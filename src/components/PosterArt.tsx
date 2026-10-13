"use client";

import { useState } from "react";
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
  const [imageError, setImageError] = useState(false);
  const angle = [-8, 6, -4, 10, -12, 4][hashIndex(slug, 6)];
  const layout = hashIndex(`${slug}x`, 3);

  return (
    <div
      className={`grain relative overflow-hidden border border-line bg-ink-raise group select-none ${className}`}
      style={{ ["--accent" as string]: accent, ["--accent-soft" as string]: accentSoft }}
    >
      {/* Background stylized textured glyph canvas (always present as base or fallback) */}
      <div className={`absolute inset-0 tex-${texture} opacity-70`} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
      <div
        className="absolute -inset-6 flex items-center justify-center opacity-25 blur-[0.4px] pointer-events-none"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <span
          className="display leading-none"
          style={{ fontSize: compact ? "6rem" : "9rem", color: accent }}
        >
          {glyph}
        </span>
      </div>

      {/* Real Poster Artwork with zoom effect on hover */}
      {!imageError && (
        <img
          src={`/posters/${slug}.jpg`}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      )}

      {/* Atmospheric dark vignette and gradient overlays for cinematic contrast & typography legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-black/25" />
      <div className="pointer-events-none absolute inset-0 bg-ink/15 mix-blend-multiply" />

      {/* Signature geometric accent borders */}
      {layout === 0 && (
        <div
          className="absolute inset-y-0 left-0 w-[3px] z-10 transition-all duration-300 group-hover:w-[4px]"
          style={{ background: accent }}
        />
      )}
      {layout === 1 && (
        <div
          className="absolute inset-x-0 bottom-0 h-[3px] z-10 transition-all duration-300 group-hover:h-[4px]"
          style={{ background: accent }}
        />
      )}
      {layout === 2 && (
        <div
          className="absolute right-2 top-2 h-7 w-7 border-r-2 border-t-2 z-10 transition-all duration-300 group-hover:scale-110"
          style={{ borderColor: accent }}
        />
      )}

      {/* Card Content & Badge Overlay */}
      <div className="relative z-10 flex h-full flex-col justify-between gap-3 p-3 pointer-events-none">
        <div className="flex items-start justify-between gap-2">
          <span className="mono border border-paper/30 bg-ink/80 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-medium text-paper shadow-sm">
            {FORMAT_LABEL[format] || format?.toUpperCase()}
          </span>
          <span className="mono text-[10px] font-medium text-paper/90 bg-ink/70 backdrop-blur-sm px-1.5 py-0.5 border border-line">
            {year}
          </span>
        </div>
        <div>
          <h3
            className={`display text-paper ${compact ? "text-[13px]" : "text-base"} leading-[1.05] tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]`}
          >
            {name}
          </h3>
          <div
            className="mt-2 h-[2px] w-8 shadow-[0_0_8px_var(--accent)] transition-all duration-300 group-hover:w-14"
            style={{ background: accent }}
          />
        </div>
      </div>
    </div>
  );
}
