import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { titleNodes, titles, type ExperienceLevel, type TitleFormat } from "@/db/schema";
import { ensureSeeded } from "@/lib/db-init";
import { getCurrentUser } from "@/lib/auth";
import { getLens } from "@/lib/lens";
import { LEVELS, LEVEL_NAMES, LEVEL_RANK, levelFit, powerTier } from "@/lib/lens-shared";
import { PowerSpark } from "@/components/PowerSpark";

import type { Metadata } from "next";
import { SITE_URL, generateBreadcrumbSchema } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Franchise Timeline & Release Era Chronology Tree",
  description:
    "Explore the complete chronological anime and manga release tree. Trace classic to modern eras with rating-ranked suggested watch routes for beginner, mediocre, and elite audiences.",
  keywords: [
    "anime timeline",
    "anime watch order chronology",
    "manga release eras",
    "anime franchise timeline tree",
    "beginner anime route",
    "classic anime timeline",
    "anime chronological order guide",
  ],
  alternates: {
    canonical: `${SITE_URL}/timeline`,
  },
  openGraph: {
    title: "Franchise Timeline & Chronology Tree | ZeroPanelVerse",
    description:
      "Interactive franchise timeline trees, release chronology, and difficulty routes across the anime and manga archive.",
    url: `${SITE_URL}/timeline`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anime & Manga Franchise Timeline | ZeroPanelVerse",
    description:
      "Interactive franchise timeline trees, release chronology, and difficulty routes.",
  },
};

const FORMATS: Array<TitleFormat | "all"> = ["all", "anime", "manga", "manhwa"];

const ERAS = [
  { key: "classic", label: "Classic era", range: "1999 and earlier", test: (year: number) => year <= 1999 },
  { key: "aughts", label: "The 2000s", range: "2000 - 2009", test: (year: number) => year >= 2000 && year <= 2009 },
  { key: "boom", label: "The 2010s", range: "2010 - 2019", test: (year: number) => year >= 2010 && year <= 2019 },
  { key: "now", label: "The 2020s", range: "2020 onward", test: (year: number) => year >= 2020 },
];

const PATH_COPY: Record<ExperienceLevel, string> = {
  beginner:
    "Gentle, high-rated titles with the lowest demand on you, shown in the order they came out so you watch the medium grow up.",
  mediocre:
    "Titles with a mid-weight commitment and a high rating: the ones that reward what you already know.",
  elite:
    "Dense, high-rated works that reward close reading, shown in the order they appeared.",
};

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded();
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };

  const user = await getCurrentUser();
  const lens = await getLens(user);
  const rank = LEVEL_RANK[lens.level];

  const pathParam = read("path") as ExperienceLevel;
  const pathLevel: ExperienceLevel = LEVELS.includes(pathParam) ? pathParam : lens.level;
  const formatParam = read("format") as TitleFormat | "all";
  const format: TitleFormat | "all" = FORMATS.includes(formatParam) ? formatParam : "all";

  let titleRows: any[] = [];
  let nodeRows: any[] = [];

  try {
    const res = await Promise.all([
      db.select().from(titles),
      db
        .select({
          titleId: titleNodes.titleId,
          power: titleNodes.powerLevel,
          canon: titleNodes.canon,
        })
        .from(titleNodes)
        .orderBy(asc(titleNodes.releaseOrder)),
    ]);
    titleRows = res[0];
    nodeRows = res[1];
  } catch (err) {
    const { seedTitles } = await import("@/lib/seed-data");
    const { seedNodes } = await import("@/lib/seed-franchise");
    titleRows = seedTitles.map((t, idx) => ({ ...t, id: idx + 1 }));
    nodeRows = Object.entries(seedNodes).flatMap(([slug, nodes], sIdx) => {
      const titleId = sIdx + 1;
      return nodes.map((n) => ({
        titleId,
        power: n.powerLevel,
        canon: n.canon,
      }));
    });
  }

  const info = new Map<number, { count: number; powers: number[] }>();
  for (const row of nodeRows) {
    const current = info.get(row.titleId) ?? { count: 0, powers: [] };
    current.count += 1;
    if (row.canon && row.power > 0) current.powers.push(row.power);
    info.set(row.titleId, current);
  }

  const list = titleRows
    .filter((title) => format === "all" || title.format === format)
    .map((title) => {
      const extra = info.get(title.id) ?? { count: 0, powers: [] };
      const complexity = title.tiers.elite.difficulty;
      return {
        ...title,
        complexity,
        fit: levelFit(pathLevel, title.rating, complexity),
        count: extra.count,
        powers: extra.powers,
      };
    });

  const path = [...list]
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 6)
    .sort((a, b) => a.year - b.year || b.rating - a.rating);

  const pathHref = (level: ExperienceLevel) =>
    `/timeline?path=${level}${format === "all" ? "" : `&format=${format}`}`;
  const formatHref = (value: TitleFormat | "all") =>
    `/timeline?path=${pathLevel}${value === "all" ? "" : `&format=${value}`}`;

  const eras = ERAS.map((era) => {
    const members = list
      .filter((title) => era.test(title.year))
      .sort((a, b) => a.year - b.year || b.rating - a.rating);
    const avg = members.length > 0 ? members.reduce((sum, t) => sum + t.rating, 0) / members.length : 0;
    return { ...era, members, avg };
  }).filter((era) => era.members.length > 0);

  const earliest = list.reduce((min, t) => Math.min(min, t.year), 9999);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Timeline", path: "/timeline" },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="mono flex items-center gap-3 text-[9px] text-mute">
        <span className="h-px w-10 bg-paper/40" />
        the archive tree
      </div>
      <h1 className="display mt-5 text-5xl text-paper sm:text-7xl">Timeline</h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-dim">
        Which came first, how well it was received, and what to open next for your level. The tree
        below grows from the earliest work in the archive; every leaf links to its own franchise tree
        with seasons, films, arcs and power curves.
      </p>

      {/* controls */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono text-[9px] text-mute">route for</span>
          {LEVELS.map((level) => (
            <Link
              key={level}
              href={pathHref(level)}
              className={`mono border px-3 py-2 text-[10px] transition-colors ${
                pathLevel === level
                  ? "border-paper bg-paper text-ink"
                  : "border-line text-dim hover:border-paper hover:text-paper"
              }`}
            >
              {LEVEL_NAMES[level]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono text-[9px] text-mute">format</span>
          {FORMATS.map((value) => (
            <Link
              key={value}
              href={formatHref(value)}
              className={`mono border px-3 py-2 text-[10px] transition-colors ${
                format === value
                  ? "border-paper bg-paper text-ink"
                  : "border-line text-dim hover:border-paper hover:text-paper"
              }`}
            >
              {value === "all" ? "All" : value}
            </Link>
          ))}
        </div>
      </div>

      {/* suggested path */}
      <section className="mt-10">
        <div className="mono text-[9px] text-mute">panel 01 — suggested route</div>
        <h2 className="display mt-3 text-3xl text-paper sm:text-4xl">
          {LEVEL_NAMES[pathLevel]} route
        </h2>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-dim">{PATH_COPY[pathLevel]}</p>

        <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {path.map((title, index) => (
            <li key={title.id}>
              <Link
                href={`/title/${title.slug}`}
                className="panel panel-hover grain flex h-full flex-col gap-3 p-5"
                style={{ ["--accent" as string]: title.accent }}
              >
                <div className="flex items-center justify-between">
                  <span className="display text-3xl text-mute">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mono text-[9px] text-mute">
                    {title.year} · {title.format}
                  </span>
                </div>
                <h3 className="display text-xl leading-tight text-paper">{title.name}</h3>
                <p className="text-[12.5px] leading-relaxed text-dim">
                  {title.tiers[pathLevel].startHere}
                </p>
                <div className="mt-auto flex items-center gap-3 border-t border-line pt-3">
                  <span className="mono text-[9px] accent-text">fit {title.fit}%</span>
                  <span className="h-px flex-1 bg-line" />
                  <span className="mono text-[9px] text-mute">rated {title.rating.toFixed(1)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
        <p className="mono mt-4 text-[9px] text-mute">
          Fit is the archive rating adjusted for how demanding a title is at that level. Routes are
          sorted by release year so you can see what came first.
        </p>
      </section>

      {/* tree */}
      <section className="mt-16 border-t border-line pt-12">
        <div className="mono text-[9px] text-mute">panel 02 — the tree</div>
        <h2 className="display mt-3 text-3xl text-paper sm:text-4xl">From the first panel to now</h2>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-dim">
          Depth for you ({LEVEL_NAMES[lens.level]}):{" "}
          {rank === 0
            ? "a power tier word per franchise."
            : rank === 1
              ? "peak power and the number of entries in each franchise."
              : "the full power range, entry count and peak for each franchise."}{" "}
          Power is always relative to that franchise&apos;s own ceiling, so compare shapes, not
          numbers, between titles.
        </p>

        <div className="mt-8">
          <ul className="tree">
            <li>
              <div className="panel grain flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <div className="mono text-[9px] text-mute">root</div>
                  <div className="display mt-1 text-2xl text-paper">ZeroPanelVerse archive</div>
                </div>
                <div className="mono text-[9px] text-mute">
                  {list.length} titles · earliest {earliest === 9999 ? "—" : earliest}
                </div>
              </div>

              <ul>
                {eras.map((era) => (
                  <li key={era.key}>
                    <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <div className="display text-xl text-paper">{era.label}</div>
                        <div className="mono mt-1 text-[9px] text-mute">{era.range}</div>
                      </div>
                      <div className="mono text-[9px] text-mute">
                        {era.members.length} title{era.members.length === 1 ? "" : "s"} · average rating{" "}
                        <span className="text-paper">{era.avg.toFixed(1)}</span>
                      </div>
                    </div>

                    <ul>
                      {era.members.map((title) => {
                        const peak = title.powers.length > 0 ? Math.max(...title.powers) : 0;
                        const low = title.powers.length > 0 ? Math.min(...title.powers) : 0;
                        return (
                          <li key={title.id}>
                            <Link
                              href={`/title/${title.slug}`}
                              className="panel panel-hover flex flex-wrap items-center gap-x-5 gap-y-3 p-4"
                              style={{
                                ["--accent" as string]: title.accent,
                                ["--accent-soft" as string]: title.accentSoft,
                              }}
                            >
                              <span
                                className="display grid h-12 w-12 shrink-0 place-items-center border border-line text-xl"
                                style={{ color: title.accent }}
                              >
                                {title.glyph}
                              </span>
                              <span className="min-w-[180px] flex-1">
                                <span className="display block text-base leading-tight text-paper">
                                  {title.name}
                                </span>
                                <span className="mono mt-1 block text-[9px] text-mute">
                                  {title.year} · {title.format}
                                  {rank >= 1 ? ` · ${title.count} entries` : ""}
                                </span>
                              </span>

                              <span className="flex items-center gap-3">
                                <PowerSpark values={title.powers} accent={title.accent} />
                                <span className="mono w-28 text-[9px] text-dim">
                                  {title.powers.length === 0
                                    ? "no power curve"
                                    : rank === 0
                                      ? `peak ${powerTier(peak)}`
                                      : rank === 1
                                        ? `peak ${peak}/100`
                                        : `${low} → ${peak}/100`}
                                </span>
                              </span>

                              <span className="text-right">
                                <span className="display block text-xl accent-text">
                                  {title.rating.toFixed(1)}
                                </span>
                                <span className="mono block text-[8px] text-mute">
                                  {LEVEL_NAMES[pathLevel]} fit {title.fit}%
                                </span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
