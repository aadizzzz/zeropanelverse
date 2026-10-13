"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  directMessages,
  follows,
  panelVotes,
  panels,
  streamWaitlist,
  titles,
  users,
  watchlist,
  type ExperienceLevel,
  type PanelKind,
  type PanelRoom,
  type SpoilerGrade,
} from "@/db/schema";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { ensureSeeded } from "@/lib/db-init";
import { LENS_COOKIE, defaultSpoilers, normalizeLens } from "@/lib/lens-shared";

export type ActionState = { ok: boolean; error?: string; message?: string };

const LEVELS: ExperienceLevel[] = ["beginner", "mediocre", "elite"];

function str(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/* ------------------------------- lens ------------------------------- */

/**
 * Sets how deep (level) and how spoilery (spoilers) the reader wants the archive.
 * Signed-in readers save it on their profile; everyone also gets a cookie.
 */
export async function setLensAction(level: string, spoilers: string): Promise<{ ok: boolean }> {
  const lens = normalizeLens(level, spoilers);
  const user = await getCurrentUser();
  if (user) {
    await db
      .update(users)
      .set({ experienceLevel: lens.level, spoilerMode: lens.spoilers })
      .where(eq(users.id, user.id));
  }
  const jar = await cookies();
  jar.set(LENS_COOKIE, `${lens.level}.${lens.spoilers}`, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ------------------------------- auth ------------------------------- */

export async function signupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await ensureSeeded();
  const displayName = str(form, "displayName");
  const username = str(form, "username").toLowerCase();
  const email = str(form, "email").toLowerCase();
  const password = str(form, "password");
  const rawLevel = str(form, "experienceLevel") as ExperienceLevel;
  const experienceLevel = LEVELS.includes(rawLevel) ? rawLevel : "beginner";

  if (displayName.length < 2) return { ok: false, error: "Display name needs at least 2 characters." };
  if (!/^[a-z0-9_]{3,24}$/.test(username))
    return { ok: false, error: "Username must be 3-24 characters: lowercase letters, numbers or underscore." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const clash = await db
    .select({ id: users.id, username: users.username, email: users.email })
    .from(users)
    .where(sql`lower(${users.username}) = ${username} or lower(${users.email}) = ${email}`)
    .limit(1);
  if (clash.length > 0) {
    return {
      ok: false,
      error:
        clash[0].username === username
          ? "That username is already taken."
          : "An account with that email already exists.",
    };
  }

  const glyphs = ["零", "Z", "闇", "光", "黒", "白", "夢", "刃"];
  const spoilerMode = defaultSpoilers(experienceLevel);
  const inserted = await db
    .insert(users)
    .values({
      username,
      email,
      displayName,
      passwordHash: hashPassword(password),
      experienceLevel,
      spoilerMode,
      avatarGlyph: glyphs[Math.floor(Math.random() * glyphs.length)],
    })
    .returning({ id: users.id });

  await createSession(inserted[0].id);
  redirect("/profile");
}

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await ensureSeeded();
  const identifier = str(form, "identifier").toLowerCase();
  const password = str(form, "password");
  if (!identifier || !password) return { ok: false, error: "Enter your username/email and password." };

  const rows = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(sql`lower(${users.username}) = ${identifier} or lower(${users.email}) = ${identifier}`)
    .limit(1);

  const account = rows[0];
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return { ok: false, error: "Invalid credentials. Check your username and password." };
  }

  await createSession(account.id);
  redirect("/profile");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function updateProfileAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const displayName = str(form, "displayName") || user.displayName;
  const bio = str(form, "bio").slice(0, 600);
  const avatarGlyph = str(form, "avatarGlyph").slice(0, 2) || user.avatarGlyph;
  const rawLevel = str(form, "experienceLevel") as ExperienceLevel;
  const level = LEVELS.includes(rawLevel) ? rawLevel : user.experienceLevel;
  const lens = normalizeLens(level, str(form, "spoilerMode") || user.spoilerMode);

  await db
    .update(users)
    .set({
      displayName: displayName.slice(0, 64),
      bio,
      avatarGlyph,
      experienceLevel: lens.level,
      spoilerMode: lens.spoilers,
    })
    .where(eq(users.id, user.id));

  const jar = await cookies();
  jar.set(LENS_COOKIE, `${lens.level}.${lens.spoilers}`, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "Panel profile updated." };
}

/* ------------------------------ panels ------------------------------ */

export async function createPanelAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to post in this panel." };

  const titleId = Number(str(form, "titleId"));
  const headline = str(form, "headline");
  const body = str(form, "body");
  const rawKind = str(form, "kind") as PanelKind;
  const kind: PanelKind = rawKind === "view" || rawKind === "suggestion" ? rawKind : "review";
  const rating = Math.min(10, Math.max(0, Number(str(form, "rating")) || 0));

  const rawRoom = str(form, "room");
  const canUseOpen = user.experienceLevel !== "beginner";
  if (rawRoom === "open" && !canUseOpen) {
    return {
      ok: false,
      error: "The Open Floor is for Mediocre and Elite panelists. Change your level in the lens bar to post there.",
    };
  }
  const room: PanelRoom = rawRoom === "open" ? "open" : "lounge";

  // Lounge is the spoiler-safe zone. Open Floor has no boundaries.
  const rawGrade = str(form, "spoilerGrade");
  const spoilerGrade: SpoilerGrade =
    room === "open" && (rawGrade === "mild" || rawGrade === "heavy") ? rawGrade : "none";

  if (!Number.isFinite(titleId) || titleId <= 0) return { ok: false, error: "Unknown title." };
  if (headline.length < 4) return { ok: false, error: "Give your panel a headline (4+ characters)." };
  if (body.length < 20) return { ok: false, error: "Share a bit more — at least 20 characters." };

  const exists = await db.select({ id: titles.id, slug: titles.slug }).from(titles).where(eq(titles.id, titleId)).limit(1);
  if (exists.length === 0) return { ok: false, error: "That title no longer exists." };

  try {
    await db.insert(panels).values({
      titleId,
      userId: user.id,
      kind,
      room,
      spoilerGrade,
      authorLevel: user.experienceLevel,
      rating,
      headline: headline.slice(0, 160),
      body: body.slice(0, room === "open" ? 8000 : 4000),
      spoilerFree: spoilerGrade === "none",
    });
  } catch {
    return { ok: false, error: "You already posted a panel with that headline." };
  }

  revalidatePath(`/title/${exists[0].slug}`);
  revalidatePath("/panels");
  revalidatePath("/profile");
  return {
    ok: true,
    message:
      room === "open"
        ? "Posted to the Open Floor. No boundaries."
        : "Posted to the Beginner Lounge. Thanks for keeping it spoiler-safe.",
  };
}

export async function deletePanelAction(panelId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await db.delete(panels).where(and(eq(panels.id, panelId), eq(panels.userId, user.id)));
  revalidatePath("/profile");
}

/** Reveals one veiled entry without changing the reader's whole lens. */
export async function revealPanelAction(
  panelId: number,
): Promise<{ ok: boolean; headline?: string; body?: string }> {
  const rows = await db
    .select({ headline: panels.headline, body: panels.body })
    .from(panels)
    .where(eq(panels.id, panelId))
    .limit(1);
  if (rows.length === 0) return { ok: false };
  return { ok: true, headline: rows[0].headline, body: rows[0].body };
}

export async function votePanelAction(
  panelId: number,
  value: 1 | -1,
): Promise<{ ok: boolean; score: number; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, score: 0, error: "Sign in to upvote panels." };

  const existing = await db
    .select({ id: panelVotes.id, value: panelVotes.value })
    .from(panelVotes)
    .where(and(eq(panelVotes.panelId, panelId), eq(panelVotes.userId, user.id)))
    .limit(1);

  if (existing.length > 0 && existing[0].value === value) {
    await db.delete(panelVotes).where(eq(panelVotes.id, existing[0].id));
  } else if (existing.length > 0) {
    await db.update(panelVotes).set({ value }).where(eq(panelVotes.id, existing[0].id));
  } else {
    await db.insert(panelVotes).values({ panelId, userId: user.id, value });
  }

  const scoreRows = await db
    .select({ score: sql<number>`coalesce(sum(${panelVotes.value}), 0)::int` })
    .from(panelVotes)
    .where(eq(panelVotes.panelId, panelId));
  return { ok: true, score: scoreRows[0]?.score ?? 0 };
}

/* ---------------------------- watchlist ----------------------------- */

export async function watchlistAction(
  titleId: number,
  status: string,
): Promise<{ ok: boolean; saved: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, saved: false, error: "Sign in to build your panel list." };

  const existing = await db
    .select({ id: watchlist.id, status: watchlist.status })
    .from(watchlist)
    .where(and(eq(watchlist.userId, user.id), eq(watchlist.titleId, titleId)))
    .limit(1);

  if (existing.length > 0 && (existing[0].status === status || status === "remove")) {
    await db.delete(watchlist).where(eq(watchlist.id, existing[0].id));
    revalidatePath("/profile");
    return { ok: true, saved: false };
  }

  if (existing.length > 0) {
    await db.update(watchlist).set({ status }).where(eq(watchlist.id, existing[0].id));
  } else {
    await db.insert(watchlist).values({ userId: user.id, titleId, status });
  }

  revalidatePath("/profile");
  return { ok: true, saved: true };
}

/* --------------------------- streaming list -------------------------- */

export async function joinWaitlistAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await ensureSeeded();
  const email = str(form, "email").toLowerCase();
  const region = str(form, "region") || "Global";
  const interest = str(form, "interest") || "anime";
  const user = await getCurrentUser();

  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address." };

  await db
    .insert(streamWaitlist)
    .values({ email, region: region.slice(0, 60), interest: interest.slice(0, 24), userId: user?.id ?? null })
    .onConflictDoNothing();

  const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(streamWaitlist);
  return {
    ok: true,
    message: `You are on the list — ${countRows[0]?.count ?? 1} viewers waiting for launch.`,
  };
}

/* ----------------------------- social / follow ---------------------------- */

export async function followUserAction(
  targetUserId: number,
): Promise<{ ok: boolean; following: boolean; count?: number; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, following: false, error: "Sign in to follow other panelists." };
  if (user.id === targetUserId) {
    return { ok: false, following: false, error: "You cannot follow yourself." };
  }

  const existing = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.followerId, user.id), eq(follows.followingId, targetUserId)))
    .limit(1);

  let following = false;
  if (existing.length > 0) {
    await db.delete(follows).where(eq(follows.id, existing[0].id));
    following = false;
  } else {
    await db.insert(follows).values({ followerId: user.id, followingId: targetUserId });
    following = true;
  }

  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.followingId, targetUserId));

  revalidatePath(`/u/[username]`, "page");
  revalidatePath("/library");
  return { ok: true, following, count: countRows[0]?.count ?? 0 };
}

/* ----------------------------- messenger / chat ---------------------------- */

export async function sendMessageAction(
  receiverId: number,
  content: string,
  titleSlug?: string,
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to send direct messages." };
  if (user.id === receiverId) return { ok: false, error: "You cannot message yourself." };

  const trimmed = content.trim();
  if (!trimmed && !titleSlug) {
    return { ok: false, error: "Message cannot be empty." };
  }

  const result = await db
    .insert(directMessages)
    .values({
      senderId: user.id,
      receiverId,
      content: trimmed,
      titleSlug: titleSlug || null,
      read: false,
    })
    .returning({ id: directMessages.id });

  return { ok: true, messageId: result[0]?.id };
}

export async function markMessagesReadAction(
  partnerId: number,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  await db
    .update(directMessages)
    .set({ read: true })
    .where(
      and(
        eq(directMessages.senderId, partnerId),
        eq(directMessages.receiverId, user.id),
        eq(directMessages.read, false),
      ),
    );

  return { ok: true };
}
