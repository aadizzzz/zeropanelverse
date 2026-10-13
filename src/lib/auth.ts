import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type ExperienceLevel, type User } from "@/db/schema";

export const SESSION_COOKIE = "zpv_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: token, userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  jar.delete(SESSION_COOKIE);
}

export type SessionUser = Pick<
  User,
  | "id"
  | "username"
  | "displayName"
  | "email"
  | "experienceLevel"
  | "spoilerMode"
  | "avatarGlyph"
  | "bio"
  | "createdAt"
>;

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        experienceLevel: users.experienceLevel,
        spoilerMode: users.spoilerMode,
        avatarGlyph: users.avatarGlyph,
        bio: users.bio,
        createdAt: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
});

export const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: "Beginner",
  mediocre: "Mediocre",
  elite: "Elite",
};
