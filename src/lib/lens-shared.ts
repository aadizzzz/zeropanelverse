import type { ExperienceLevel, SpoilerGrade, SpoilerMode } from "@/db/schema";

/**
 * The "reading lens" decides how deep a reader goes (level) and how much
 * spoiler content they have chosen to see (spoilers).
 *
 *  - Beginner : spoilers hidden by default, may opt in to see everything.
 *  - Mediocre : chooses hidden / mild only / show all.
 *  - Elite    : no boundaries — everything is open.
 */
export type Lens = { level: ExperienceLevel; spoilers: SpoilerMode };

export const LENS_COOKIE = "zpv_lens";

export const LEVELS: ExperienceLevel[] = ["beginner", "mediocre", "elite"];
export const SPOILER_MODES: SpoilerMode[] = ["safe", "mild", "full"];

export const LEVEL_RANK: Record<ExperienceLevel, number> = {
  beginner: 0,
  mediocre: 1,
  elite: 2,
};

export const LEVEL_NAMES: Record<ExperienceLevel, string> = {
  beginner: "Beginner",
  mediocre: "Mediocre",
  elite: "Elite",
};

export const SPOILER_NAMES: Record<SpoilerMode, string> = {
  safe: "Hidden",
  mild: "Mild only",
  full: "Show all",
};

export function allowedModes(level: ExperienceLevel): SpoilerMode[] {
  if (level === "elite") return ["full"];
  if (level === "mediocre") return ["safe", "mild", "full"];
  return ["safe", "full"];
}

export function defaultSpoilers(level: ExperienceLevel): SpoilerMode {
  if (level === "elite") return "full";
  if (level === "mediocre") return "mild";
  return "safe";
}

export function normalizeLens(
  level: string | null | undefined,
  spoilers: string | null | undefined,
): Lens {
  const lvl: ExperienceLevel = LEVELS.includes(level as ExperienceLevel)
    ? (level as ExperienceLevel)
    : "beginner";
  const allowed = allowedModes(lvl);
  const mode: SpoilerMode = allowed.includes(spoilers as SpoilerMode)
    ? (spoilers as SpoilerMode)
    : defaultSpoilers(lvl);
  return { level: lvl, spoilers: mode };
}

export function canSee(lens: Lens, grade: SpoilerGrade): boolean {
  if (grade === "none") return true;
  if (grade === "mild") return lens.spoilers === "mild" || lens.spoilers === "full";
  return lens.spoilers === "full";
}

/** The Open Floor is the no-boundaries room: mediocre + elite, or a beginner who opted into spoilers. */
export function hasOpenAccess(lens: Lens): boolean {
  return lens.level !== "beginner" || lens.spoilers === "full";
}

/**
 * How well a title suits a level, 0-99. Rating adjusted by how demanding the
 * title is (complexity 1..5): beginners want low complexity, mediocre want the
 * middle, elites want the dense stuff.
 */
export function levelFit(level: ExperienceLevel, rating: number, complexity: number): number {
  const base = rating * 10;
  let value: number;
  if (level === "beginner") value = base - (complexity - 1) * 9;
  else if (level === "mediocre") value = base - Math.abs(complexity - 3.5) * 8;
  else value = base * 0.85 + complexity * 3;
  return Math.max(0, Math.min(99, Math.round(value)));
}

export function powerTier(power: number): string {
  if (power < 25) return "Grounded";
  if (power < 50) return "Rising";
  if (power < 75) return "Overwhelming";
  return "Mythic";
}
