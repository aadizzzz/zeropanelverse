import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import { logoutAction } from "@/lib/actions";
import { NavSearchButton } from "@/components/NavSearchButton";
import { LEVEL_LABELS, type SessionUser } from "@/lib/auth";

export function Nav({ user }: { user: SessionUser | null }) {
  return (
    <header className="glass sticky top-0 z-50 border-b border-line">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="display grid h-9 w-9 place-items-center border border-paper/40 text-sm transition-colors group-hover:border-paper group-hover:bg-paper group-hover:text-ink">
            0P
          </span>
          <span className="leading-none">
            <span className="display block text-lg tracking-tight text-paper">
              ZeroPanel<span className="text-mute">Verse</span>
            </span>
            <span className="mono block text-[8px] text-mute">
              anime · manga · manhwa archive
            </span>
          </span>
        </Link>

        <NavLinks />

        <div className="flex items-center gap-2">
          <NavSearchButton isLoggedIn={Boolean(user)} />

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/messages"
                title="Direct Messages"
                className="flex h-9 w-9 items-center justify-center border border-line text-xs text-dim transition-colors hover:border-paper hover:text-paper"
              >
                ✈️
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 border border-line px-2.5 py-1.5 transition-colors hover:border-paper"
              >
                <span className="grid h-6 w-6 place-items-center bg-paper text-[11px] font-bold text-ink">
                  {user.avatarGlyph}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[11px] text-paper">{user.displayName}</span>
                  <span className="mono block text-[8px] text-mute">
                    {LEVEL_LABELS[user.experienceLevel]}
                  </span>
                </span>
              </Link>
              <form action={logoutAction} className="hidden sm:block">
                <button
                  type="submit"
                  className="mono border border-line px-2.5 py-2 text-[10px] text-mute transition-colors hover:border-paper hover:text-paper"
                >
                  Exit
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="mono border border-line px-3 py-2 text-[10px] text-dim transition-colors hover:border-paper hover:text-paper"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="mono bg-paper px-3 py-2 text-[10px] text-ink transition-opacity hover:opacity-80"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>

      <details className="group border-t border-line md:hidden">
        <summary className="mono cursor-pointer list-none px-4 py-2.5 text-[10px] text-dim hover:text-paper flex items-center justify-between bg-black/20">
          <span>Navigation Menu</span>
          <span className="text-[9px] text-mute group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="px-4 pb-3">
          <NavLinks vertical />
          {user ? (
            <form action={logoutAction} className="mt-2">
              <button
                type="submit"
                className="mono w-full border border-line px-3 py-2 text-[10px] text-mute"
              >
                Sign out
              </button>
            </form>
          ) : null}
        </div>
      </details>
    </header>
  );
}
