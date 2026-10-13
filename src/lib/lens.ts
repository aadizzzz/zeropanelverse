import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/auth";
import { LENS_COOKIE, normalizeLens, type Lens } from "@/lib/lens-shared";

/** Signed-in readers use the lens saved on their profile; guests use a cookie. */
export async function getLens(user: SessionUser | null): Promise<Lens> {
  if (user) return normalizeLens(user.experienceLevel, user.spoilerMode);
  const jar = await cookies();
  const raw = jar.get(LENS_COOKIE)?.value ?? "";
  const [level, spoilers] = raw.split(".");
  return normalizeLens(level, spoilers);
}
