"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ExperienceLevel, SpoilerMode, TitleTiers } from "@/db/schema";
import { setLensAction } from "@/lib/actions";
import { LEVEL_NAMES, SPOILER_NAMES, canSee, type Lens } from "@/lib/lens-shared";

const TABS: { key: ExperienceLevel; label: string; blurb: string }[] = [
  { key: "beginner", label: "Beginner", blurb: "First 5 titles · zero homework" },
  { key: "mediocre", label: "Mediocre", blurb: "100+ titles · reads the subtext" },
  { key: "elite", label: "Elite", blurb: "500+ titles · wants the thesis" },
];

export function TierPanels({ tiers, lens }: { tiers: TitleTiers; lens: Lens }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const visible = (key: ExperienceLevel) => canSee(lens, tiers[key].spoilerLevel);
  const [active, setActive] = useState<ExperienceLevel>(visible(lens.level) ? lens.level : "beginner");
  const info = tiers[active];
  const locked = !visible(active);

  const unlockTarget: SpoilerMode =
    info.spoilerLevel === "mild" && lens.level === "mediocre" ? "mild" : "full";

  function unlock() {
    start(async () => {
      await setLensAction(lens.level, unlockTarget);
      router.refresh();
    });
  }

  return (
    <div className="panel grain overflow-hidden">
      <div className="flex flex-wrap border-b border-line">
        {TABS.map((tab) => {
          const on = tab.key === active;
          const open = visible(tab.key);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`group relative min-w-[140px] flex-1 px-4 py-4 text-left transition-colors ${
                on ? "bg-paper text-ink" : "text-dim hover:bg-white/5 hover:text-paper"
              }`}
            >
              <span className="display flex items-center gap-2 text-sm">
                {tab.label}
                {open ? null : <span className="mono text-[8px] opacity-70">locked</span>}
              </span>
              <span className={`mono block text-[8px] ${on ? "text-ink/60" : "text-mute"}`}>
                {tab.blurb}
              </span>
            </button>
          );
        })}
      </div>

      {locked ? (
        <div key={`${active}-locked`} className="rise flex flex-col items-start gap-5 p-6 sm:p-10">
          <div className="mono border border-dashed border-paper/40 px-2.5 py-1 text-[9px] text-paper">
            {info.spoilerLevel} spoilers · {LEVEL_NAMES[active]} guide
          </div>
          <h3 className="display text-2xl text-paper">This guide is hidden by your lens</h3>
          <p className="max-w-xl text-[13.5px] leading-relaxed text-dim">
            You are reading as a {LEVEL_NAMES[lens.level]} with spoilers set to{" "}
            {SPOILER_NAMES[lens.spoilers].toLowerCase()}. The {LEVEL_NAMES[active]} guide goes into{" "}
            {info.spoilerLevel} spoiler territory, so it stays closed until you choose to open it.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={unlock}
              className="mono bg-paper px-5 py-2.5 text-[10px] text-ink transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {lens.level === "beginner" ? "I want spoilers" : unlockTarget === "mild" ? "Show mild spoilers" : "Show everything"}
            </button>
            <button
              type="button"
              onClick={() => setActive("beginner")}
              className="mono border border-line px-5 py-2.5 text-[10px] text-dim hover:border-paper hover:text-paper"
            >
              Back to the spoiler-free guide
            </button>
          </div>
        </div>
      ) : (
        <div key={active} className="rise grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-5">
            <div>
              <div className="mono mb-2 text-[9px] text-mute">Difficulty for this audience</div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 flex-1 ${step <= info.difficulty ? "accent-bg" : "bg-line"}`}
                  />
                ))}
                <span className="mono ml-2 text-[10px] accent-text">{info.difficulty}/5</span>
              </div>
            </div>

            <div>
              <div className="mono mb-1.5 text-[9px] text-mute">The pitch</div>
              <p className="text-lg leading-snug text-paper">{info.summary}</p>
            </div>

            <div>
              <div className="mono mb-1.5 text-[9px] text-mute">Why it clicks at this level</div>
              <p className="text-[13.5px] leading-relaxed text-dim">{info.whyItClicks}</p>
            </div>

            <div>
              <div className="mono mb-1.5 text-[9px] text-mute">Deep dive</div>
              <p className="text-[13.5px] leading-relaxed text-dim">{info.deepDive}</p>
            </div>
          </div>

          <div className="flex flex-col gap-5 border-line lg:border-l lg:pl-7">
            <div className="border border-line p-4">
              <div className="mono mb-2 text-[9px] text-mute">Where to start</div>
              <p className="text-[13px] leading-relaxed text-paper">{info.startHere}</p>
            </div>

            <div className="border border-line p-4">
              <div className="mono mb-2 text-[9px] text-mute">Prerequisites</div>
              <ul className="flex flex-col gap-2">
                {info.prerequisites.length === 0 ? (
                  <li className="text-[13px] text-dim">None — jump straight in.</li>
                ) : (
                  info.prerequisites.map((item) => (
                    <li key={item} className="flex gap-2 text-[13px] text-dim">
                      <span className="accent-text">—</span>
                      <span>{item}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="flex items-center justify-between border border-line p-4">
              <span className="mono text-[9px] text-mute">Spoiler load</span>
              <span
                className="mono border px-2 py-1 text-[9px]"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
              >
                {info.spoilerLevel === "none"
                  ? "Spoiler free"
                  : info.spoilerLevel === "mild"
                    ? "Mild spoilers"
                    : "Heavy spoiler risk"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
