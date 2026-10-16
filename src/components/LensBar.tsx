"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLensAction } from "@/lib/actions";
import type { ExperienceLevel, SpoilerMode } from "@/db/schema";
import {
  LEVELS,
  LEVEL_NAMES,
  SPOILER_MODES,
  SPOILER_NAMES,
  allowedModes,
  defaultSpoilers,
  type Lens,
} from "@/lib/lens-shared";

const HINTS: Record<ExperienceLevel, string> = {
  beginner: "Spoilers stay hidden unless you choose to see them.",
  mediocre: "You choose how much to see: hidden, mild or everything.",
  elite: "No boundaries: every note, theory and spoiler is open.",
};

export function LensBar({ lens, signedIn }: { lens: Lens; signedIn: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const modes = allowedModes(lens.level);

  function apply(level: ExperienceLevel, spoilers: SpoilerMode) {
    start(async () => {
      await setLensAction(level, spoilers);
      router.refresh();
    });
  }

  return (
    <div data-lens-bar className={`border-b border-line bg-ink-soft transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-x-4 gap-y-2 px-4 py-2 sm:gap-x-5 sm:px-6 overflow-x-auto scrollbar-none whitespace-nowrap">
        <span className="mono shrink-0 text-[9px] text-mute">Reading lens</span>

        <div role="group" aria-label="Audience level" className="flex">
          {LEVELS.map((level) => {
            const on = lens.level === level;
            return (
              <button
                key={level}
                type="button"
                disabled={pending}
                onClick={() => !on && apply(level, defaultSpoilers(level))}
                className={`mono border px-3 py-1.5 text-[9px] transition-colors -ml-px first:ml-0 ${
                  on
                    ? "relative z-10 border-paper bg-paper text-ink"
                    : "border-line text-dim hover:border-paper hover:text-paper"
                }`}
              >
                {LEVEL_NAMES[level]}
              </button>
            );
          })}
        </div>

        <span className="h-4 w-px bg-line shrink-0" />
        <span className="mono shrink-0 text-[9px] text-mute">Spoilers</span>

        {lens.level === "elite" ? (
          <span className="mono shrink-0 border border-paper/50 px-3 py-1.5 text-[9px] text-paper">
            Open · no boundaries
          </span>
        ) : (
          <div role="group" aria-label="Spoiler mode" className="flex shrink-0">
            {SPOILER_MODES.map((mode) => {
              const allowed = modes.includes(mode);
              const on = lens.spoilers === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  disabled={pending || !allowed}
                  title={allowed ? undefined : "Beginners choose between hidden and show all"}
                  onClick={() => !on && apply(lens.level, mode)}
                  className={`mono border px-3 py-1.5 text-[9px] transition-colors -ml-px first:ml-0 ${
                    on
                      ? "relative z-10 border-paper bg-paper text-ink"
                      : allowed
                        ? "border-line text-dim hover:border-paper hover:text-paper"
                        : "border-line text-mute/40 line-through"
                  }`}
                >
                  {mode === "full" && lens.level === "beginner" ? "Show spoilers" : SPOILER_NAMES[mode]}
                </button>
              );
            })}
          </div>
        )}

        <span className="mono ml-auto hidden text-[8px] text-mute lg:block">
          {HINTS[lens.level]} · {signedIn ? "saved to your profile" : "saved on this device"}
        </span>
      </div>
    </div>
  );
}
