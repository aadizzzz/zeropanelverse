import type { TitleFormat } from "@/db/schema";

const FORMAT_LABEL: Record<TitleFormat, string> = {
  anime: "ANIME",
  manga: "MANGA",
  manhwa: "MANHWA",
};

function hashIndex(seed: string, mod: number): number {
  let total = 0;
  for (let i = 0; i < seed.length; i += 1) total = (total + seed.charCodeAt(i) * (i + 7)) % 100000;
  return total % mod;
}

export function PosterArt({
  slug,
  name,
  glyph,
  format,
  accent,
  accentSoft,
  texture,
  year,
  className = "",
  compact = false,
}: {
  slug: string;
  name: string;
  glyph: string;
  format: TitleFormat;
  accent: string;
  accentSoft: string;
  texture: string;
  year: number;
  className?: string;
  compact?: boolean;
}) {
  const angle = [-8, 6, -4, 10, -12, 4][hashIndex(slug, 6)];
  const layout = hashIndex(`${slug}x`, 3);

  return (
    <div
      className={`grain relative overflow-hidden border border-line bg-ink-raise ${className}`}
      style={{ ["--accent" as string]: accent, ["--accent-soft" as string]: accentSoft }}
    >
      <div className={`absolute inset-0 tex-${texture} opacity-70`} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
      <div
        className="absolute -inset-6 flex items-center justify-center opacity-25 blur-[0.4px] select-none"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <span
          className="display leading-none"
          style={{ fontSize: compact ? "6rem" : "9rem", color: accent }}
        >
          {glyph}
        </span>
      </div>

      {layout === 0 && (
        <div
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: accent }}
        />
      )}
      {layout === 1 && (
        <div
          className="absolute inset-x-0 bottom-0 h-[3px]"
          style={{ background: accent }}
        />
      )}
      {layout === 2 && (
        <div
          className="absolute right-2 top-2 h-8 w-8 border-r-2 border-t-2"
          style={{ borderColor: accent }}
        />
      )}

      <div className="relative flex h-full flex-col justify-between gap-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="mono border border-paper/25 bg-ink/70 px-1.5 py-0.5 text-[9px] text-dim">
            {FORMAT_LABEL[format]}
          </span>
          <span className="mono text-[9px] text-mute">{year}</span>
        </div>
        <div>
          <h3
            className={`display text-paper ${compact ? "text-[13px]" : "text-base"} leading-[0.95]`}
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.9)" }}
          >
            {name}
          </h3>
          <div className="mt-2 h-[2px] w-8" style={{ background: accent }} />
        </div>
      </div>
    </div>
  );
}
