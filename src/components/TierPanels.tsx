"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ExperienceLevel, SpoilerMode, TitleFormat, TitleTiers } from "@/db/schema";
import { setLensAction } from "@/lib/actions";
import { LEVEL_NAMES, SPOILER_NAMES, canSee, type Lens } from "@/lib/lens-shared";

const TABS: { key: ExperienceLevel; label: string; blurb: string; badge: string }[] = [
  {
    key: "beginner",
    label: "Beginner",
    blurb: "Convince Me · Why Watch · Zero Spoilers",
    badge: "The Hook & Pitch",
  },
  {
    key: "mediocre",
    label: "Mediocre",
    blurb: "Brief Discussion · Characters & Dynamics",
    badge: "Cast & Pacing",
  },
  {
    key: "elite",
    label: "Elite",
    blurb: "Fully Open · In-Depth Deconstruction",
    badge: "Full Uncensored Deep Dive",
  },
];

export function TierPanels({
  tiers,
  lens,
  titleName = "this title",
  format = "anime",
  genres = [],
  synopsis = "",
}: {
  tiers: TitleTiers;
  lens: Lens;
  titleName?: string;
  format?: TitleFormat;
  genres?: string[];
  synopsis?: string;
}) {
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

  // Beginner Convincing Reasons generator based on title data
  const defaultReasonsToWatch = [
    `⚡ High-Stakes Hook: Captivates within the first 20 minutes — no waiting 10 episodes for the action to start.`,
    `🎨 Visual & Audio Spectacle: World-class production values with cinematic direction and goosebump-inducing musical themes.`,
    `🧠 Accessible Yet Rewarding: Deep emotional stakes with zero confusing lore homework required.`,
    `🛡️ Zero Filler Pacing: Every episode drives the central narrative forward without unnecessary fluff.`,
    `🔥 Unforgettable Cast: Characters with compelling motivations that you will immediately root for.`,
  ];
  const reasonsToWatch = info.reasonsToWatch && info.reasonsToWatch.length > 0
    ? info.reasonsToWatch
    : defaultReasonsToWatch;

  return (
    <div className="panel grain overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex flex-wrap border-b border-line bg-black/40">
        {TABS.map((tab) => {
          const on = tab.key === active;
          const open = visible(tab.key);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`group relative min-w-[170px] flex-1 px-4 py-4 text-left transition-all ${
                on
                  ? "bg-paper text-ink shadow-md"
                  : "text-dim hover:bg-white/5 hover:text-paper"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="display flex items-center gap-2 text-sm font-bold">
                  {tab.label}
                  {open ? null : <span className="mono text-[8px] opacity-70">🔒 locked</span>}
                </span>
                <span
                  className={`mono rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wider ${
                    on ? "bg-black/10 text-ink" : "bg-white/5 text-mute"
                  }`}
                >
                  {tab.badge}
                </span>
              </div>
              <span className={`mono mt-1 block text-[8px] leading-tight ${on ? "text-ink/75" : "text-mute"}`}>
                {tab.blurb}
              </span>
            </button>
          );
        })}
      </div>

      {locked ? (
        /* Locked Guide view (Safe Lens protection) */
        <div key={`${active}-locked`} className="rise flex flex-col items-start gap-5 p-6 sm:p-10">
          <div className="mono border border-dashed border-paper/40 px-2.5 py-1 text-[9px] text-paper">
            {info.spoilerLevel} spoilers · {LEVEL_NAMES[active]} perspective
          </div>
          <h3 className="display text-2xl text-paper">
            This {LEVEL_NAMES[active]} analysis is veiled by your lens
          </h3>
          <p className="max-w-xl text-[13.5px] leading-relaxed text-dim">
            You are reading under the {LEVEL_NAMES[lens.level]} perspective with spoilers set to{" "}
            {SPOILER_NAMES[lens.spoilers].toLowerCase()}. The {LEVEL_NAMES[active]} breakdown includes{" "}
            {info.spoilerLevel} spoilers, unfiltered character fate analysis, and climax discussions.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={pending}
              onClick={unlock}
              className="mono bg-paper px-5 py-2.5 text-[10px] font-semibold text-ink transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {lens.level === "beginner" ? "Unlock & Show Spoilers" : unlockTarget === "mild" ? "Reveal Mild Spoilers" : "Open Full Uncensored Elite Discussion"}
            </button>
            <button
              type="button"
              onClick={() => setActive("beginner")}
              className="mono border border-line px-5 py-2.5 text-[10px] text-dim hover:border-paper hover:text-paper"
            >
              Stay on Beginner (Spoiler-Free) Guide
            </button>
          </div>
        </div>
      ) : active === "beginner" ? (
        /* ==================== BEGINNER MODE: CONVINCE & WHY TO WATCH ==================== */
        <div key="beginner" className="rise grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-6">
            {/* The Convincing Pitch Header */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="mono mb-2 flex items-center gap-2 text-[9px] uppercase tracking-wider text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Beginner Pitch · Why You Should Experience This Now</span>
              </div>
              <h4 className="display text-xl text-paper leading-snug">
                &ldquo;{info.summary}&rdquo;
              </h4>
              <p className="mt-3 text-[13.5px] leading-relaxed text-dim">
                {info.whyItClicks}
              </p>
            </div>

            {/* 5 Reasons to Watch / Read */}
            <div>
              <div className="mono mb-3 text-[9px] uppercase tracking-wider text-mute">
                💡 5 Convincing Reasons to Start {format === "manga" ? "Reading" : "Watching"}
              </div>
              <div className="space-y-2.5">
                {reasonsToWatch.map((reason, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-line/60 bg-black/30 p-3.5 transition-colors hover:border-paper/40"
                  >
                    <span className="mono flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper/10 text-[10px] font-bold text-paper">
                      {idx + 1}
                    </span>
                    <p className="text-[13px] leading-relaxed text-dim">{reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Deep Dive for Beginners */}
            <div className="border-t border-line pt-5">
              <div className="mono mb-2 text-[9px] text-mute uppercase">What to Expect</div>
              <p className="text-[13.5px] leading-relaxed text-dim">{info.deepDive}</p>
            </div>
          </div>

          {/* Right Column: Beginner Quick Card & Entry Plan */}
          <div className="flex flex-col gap-5 border-line lg:border-l lg:pl-8">
            {/* Starting Plan */}
            <div className="rounded-lg border border-line bg-black/40 p-4">
              <div className="mono mb-1.5 text-[9px] text-mute uppercase">🎯 Recommended Entry Point</div>
              <p className="text-[13.5px] font-medium text-paper">{info.startHere}</p>
              <div className="mono mt-3 rounded bg-white/5 p-2 text-[9px] text-dim">
                ✓ No spin-off homework required. Just begin with the main adaptation.
              </div>
            </div>

            {/* Beginner Barrier Check */}
            <div className="rounded-lg border border-line p-4">
              <div className="mono mb-2 text-[9px] text-mute uppercase">Complexity & Barrier</div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <span
                    key={step}
                    className={`h-2 flex-1 rounded-sm ${step <= info.difficulty ? "bg-emerald-400" : "bg-line"}`}
                  />
                ))}
                <span className="mono ml-2 text-[10px] font-bold text-emerald-400">
                  {info.difficulty}/5 (Beginner Friendly)
                </span>
              </div>
              <p className="mt-2 text-[11px] text-mute">
                Low cognitive fatigue — perfect entry for newcomers without prior genre fatigue.
              </p>
            </div>

            {/* Zero Spoiler Guarantee */}
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div>
                <span className="mono block text-[9px] text-emerald-400 uppercase">Spoiler Level</span>
                <span className="text-xs font-semibold text-paper">100% Spoiler-Free Guide</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300">
                Safe ✓
              </span>
            </div>

            {/* Prerequisites */}
            <div className="rounded-lg border border-line p-4">
              <div className="mono mb-2 text-[9px] text-mute uppercase">Prerequisites</div>
              <ul className="space-y-1.5 text-xs text-dim">
                {info.prerequisites.length === 0 ? (
                  <li className="flex items-center gap-2 text-paper">
                    <span>✓</span> <span>None! Jump straight into episode / chapter 1.</span>
                  </li>
                ) : (
                  info.prerequisites.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <span className="text-mute">—</span> <span>{p}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : active === "mediocre" ? (
        /* ==================== MEDIOCRE MODE: CHARACTERS & NARRATIVE DYNAMICS ==================== */
        <div key="mediocre" className="rise grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-6">
            {/* Header: Brief Discussion & Pitch */}
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-5">
              <div className="mono mb-2 flex items-center gap-2 text-[9px] uppercase tracking-wider text-sky-400">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                <span>Mediocre Discussion · Cast Dynamics & Narrative Flow</span>
              </div>
              <h4 className="display text-xl text-paper leading-snug">
                &ldquo;{info.summary}&rdquo;
              </h4>
              <p className="mt-3 text-[13.5px] leading-relaxed text-dim">
                {info.whyItClicks}
              </p>
            </div>

            {/* Character Focus & Cast Dynamics */}
            <div className="rounded-xl border border-line bg-black/40 p-5">
              <div className="mono mb-3 flex items-center gap-2 text-[9px] uppercase tracking-wider text-sky-300">
                <span>🎭 Character Spotlight & Chemistry</span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-dim">
                {info.characterFocus ||
                  `The cast dynamic thrives on psychological tension and ideological contrast. Rather than a solitary protagonist carrying the burden, the secondary characters provide crucial emotional anchors that question the lead's moral decisions. The rivalries feel earned rather than forced by standard battle tropes.`}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded border border-line/60 bg-white/5 p-3">
                  <span className="mono block text-[9px] text-mute uppercase">Protagonist Trajectory</span>
                  <span className="mt-1 block text-paper">Evolves from reactionary survivor into an active agent driving systemic consequences.</span>
                </div>
                <div className="rounded border border-line/60 bg-white/5 p-3">
                  <span className="mono block text-[9px] text-mute uppercase">Supporting Ensemble</span>
                  <span className="mt-1 block text-paper">Given distinct agency, personal philosophies, and moments of standalone thematic weight.</span>
                </div>
              </div>
            </div>

            {/* Arc Pacing & Adaptation Notes */}
            <div className="rounded-xl border border-line bg-black/40 p-5">
              <div className="mono mb-3 text-[9px] uppercase tracking-wider text-sky-300">
                ⏱️ Pacing & Adaptation Rhythm
              </div>
              <p className="text-[13.5px] leading-relaxed text-dim">
                {info.pacingNotes || info.deepDive}
              </p>
            </div>
          </div>

          {/* Right Column: Mid-Watcher Discussion Points */}
          <div className="flex flex-col gap-5 border-line lg:border-l lg:pl-8">
            {/* Mid-Watcher Verdict */}
            <div className="rounded-lg border border-line p-4">
              <div className="mono mb-2 text-[9px] text-mute uppercase">Adaptation Fidelity</div>
              <p className="text-[13px] leading-relaxed text-paper">
                Accurately captures source tension while enhancing key action sequences through animated framing and sound design.
              </p>
            </div>

            {/* Complexity Indicator */}
            <div className="rounded-lg border border-line p-4">
              <div className="mono mb-2 text-[9px] text-mute uppercase">Cognitive Load for Mid-Watchers</div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <span
                    key={step}
                    className={`h-2 flex-1 rounded-sm ${step <= info.difficulty ? "bg-sky-400" : "bg-line"}`}
                  />
                ))}
                <span className="mono ml-2 text-[10px] font-bold text-sky-400">
                  {info.difficulty}/5
                </span>
              </div>
              <p className="mt-2 text-[11px] text-mute">
                Demands attention to secondary dialogues and subtle visual foreshadowing.
              </p>
            </div>

            {/* Spoilers Status */}
            <div className="flex items-center justify-between rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
              <div>
                <span className="mono block text-[9px] text-sky-400 uppercase">Spoiler Load</span>
                <span className="text-xs font-semibold text-paper">Mild Discussion Spoilers</span>
              </div>
              <span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-xs text-sky-300">
                Mild 👁️
              </span>
            </div>

            {/* Recommended Companion Path */}
            <div className="rounded-lg border border-line p-4">
              <div className="mono mb-2 text-[9px] text-mute uppercase">Where to pay attention</div>
              <p className="text-xs leading-relaxed text-dim">{info.startHere}</p>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== ELITE MODE: FULLY OPEN IN-DEPTH DISSECTION ==================== */
        <div key="elite" className="rise grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-6">
            {/* Header: Fully Open Deconstruction */}
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
              <div className="mono mb-2 flex items-center gap-2 text-[9px] uppercase tracking-wider text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Elite Mode · Uncensored Academic Deconstruction & Lore Thesis</span>
              </div>
              <h4 className="display text-xl text-paper leading-snug">
                &ldquo;{info.summary}&rdquo;
              </h4>
              <p className="mt-3 text-[13.5px] leading-relaxed text-dim">
                {info.whyItClicks}
              </p>
            </div>

            {/* Thematic Thesis & Authorial Intent */}
            <div className="rounded-xl border border-line bg-black/40 p-5">
              <div className="mono mb-3 text-[9px] uppercase tracking-wider text-amber-300">
                🔬 Philosophical Thesis & Deconstruction
              </div>
              <p className="text-[13.5px] leading-relaxed text-dim">
                {info.thematicThesis || info.deepDive}
              </p>
              <div className="mt-4 rounded border border-amber-500/20 bg-amber-500/5 p-3.5">
                <span className="mono block text-[9px] text-amber-400 uppercase">
                  Subtext & Structural Commentary
                </span>
                <p className="mt-1 text-xs text-dim">
                  The narrative deconstructs conventional heroism, exposing how institutional violence reproduces itself regardless of ideological justification. Character autonomy is challenged by cyclical history.
                </p>
              </div>
            </div>

            {/* Sakuga, Paneling & Visual Craft */}
            <div className="rounded-xl border border-line bg-black/40 p-5">
              <div className="mono mb-3 text-[9px] uppercase tracking-wider text-amber-300">
                📐 Paneling Composition & Sakuga Direction
              </div>
              <p className="text-[13.5px] leading-relaxed text-dim">
                {info.sakugaAndPaneling ||
                  `Examine the transition from manga panel eye-flow to key-frame layout. The directional blocking uses claustrophobic low-angle Dutch tilts during dialogue confrontations, contrasting against expansive horizontal sweeps during climaxes. Look for animator signature cuts in rapid perspective shifts.`}
              </p>
            </div>

            {/* Uncensored Ending & Lore Climax (Full Spoilers Open) */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
              <div className="mono mb-2 flex items-center gap-2 text-[9px] uppercase tracking-wider text-red-400">
                <span>⚠️ Uncensored Lore & Climax Dissection (Full Spoilers Open)</span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-dim">
                {info.uncensoredLore ||
                  `In the final arc, the narrative strips away romanticism: characters pay the absolute structural price of their actions. There is no magical reconciliation; only irreversible causality, lasting scars on the world order, and the quiet dignity of survivors confronting their complicity.`}
              </p>
            </div>
          </div>

          {/* Right Column: Elite Technical Specs */}
          <div className="flex flex-col gap-5 border-line lg:border-l lg:pl-8">
            {/* Archival Rigor */}
            <div className="rounded-lg border border-line p-4">
              <div className="mono mb-2 text-[9px] text-mute uppercase">Archival Depth Rating</div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <span
                    key={step}
                    className={`h-2 flex-1 rounded-sm ${step <= info.difficulty ? "bg-amber-400" : "bg-line"}`}
                  />
                ))}
                <span className="mono ml-2 text-[10px] font-bold text-amber-400">
                  {info.difficulty}/5
                </span>
              </div>
              <p className="mt-2 text-[11px] text-mute">
                Demands familiarity with visual semiotics, industry adaptation constraints, and thematic deconstruction.
              </p>
            </div>

            {/* Full Spoilers Open Banner */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <span className="mono block text-[9px] text-amber-400 uppercase">Discussion Freedom</span>
              <span className="text-xs font-semibold text-paper">Fully Open · Uncensored Spoilers</span>
              <p className="mt-1 text-[11px] text-dim">
                No spoiler shrouds applied. Endings, plot twists, and secret character loyalties are analyzed in detail.
              </p>
            </div>

            {/* Full Prerequisites & Influences */}
            <div className="rounded-lg border border-line p-4">
              <div className="mono mb-2 text-[9px] text-mute uppercase">Contextual Canon & Works to Compare</div>
              <ul className="space-y-1.5 text-xs text-dim">
                {info.prerequisites.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="text-amber-400">✦</span> <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Where to Direct Analysis */}
            <div className="rounded-lg border border-line p-4">
              <div className="mono mb-1.5 text-[9px] text-mute uppercase">Critical Focus</div>
              <p className="text-xs leading-relaxed text-dim">{info.startHere}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
