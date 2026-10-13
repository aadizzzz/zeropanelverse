import Link from "next/link";
import type { TitleRow } from "@/db/schema";
import { PosterArt } from "@/components/PosterArt";

export function TitleCard({ title }: { title: TitleRow }) {
  return (
    <Link
      href={`/title/${title.slug}`}
      className="panel panel-hover group flex flex-col overflow-hidden"
      style={{ ["--accent" as string]: title.accent, ["--accent-soft" as string]: title.accentSoft }}
    >
      <PosterArt
        slug={title.slug}
        name={title.name}
        glyph={title.glyph}
        format={title.format}
        accent={title.accent}
        accentSoft={title.accentSoft}
        texture={title.texture}
        year={title.year}
        className="aspect-[3/4] w-full border-0 border-b border-line"
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="mono text-[9px] text-mute">{title.studio}</span>
          <span className="mono text-[10px]" style={{ color: title.accent }}>
            {title.rating.toFixed(1)}
          </span>
        </div>
        <p className="line-clamp-3 text-[12.5px] leading-relaxed text-dim">{title.tagline}</p>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {title.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="mono border border-line px-1.5 py-0.5 text-[8px] text-mute"
            >
              {genre}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <span className="mono text-[8px] text-mute">BEGIN {title.tiers.beginner.difficulty}/5</span>
          <span className="h-px flex-1 bg-line" />
          <span className="mono text-[8px] text-mute">ELITE {title.tiers.elite.difficulty}/5</span>
        </div>
      </div>
    </Link>
  );
}
