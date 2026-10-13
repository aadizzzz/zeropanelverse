import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { panels, titles, users, watchlist } from "@/db/schema";
import { ensureSeeded } from "@/lib/db-init";
import { TitleCard } from "@/components/TitleCard";

export const dynamic = "force-dynamic";

const LEVELS = [
  {
    key: "beginner",
    label: "Beginner",
    copy: "You have finished a handful of titles, or none at all. You want the cleanest entry point, no lore homework, and a spoiler-free route through the story.",
    href: "/library?level=beginner",
  },
  {
    key: "mediocre",
    label: "Mediocre",
    copy: "A hundred-plus titles in. You read subtext, you care about pacing and adaptation quality, and you want the version of the guide that trusts you with the middle arc.",
    href: "/library?level=mediocre",
  },
  {
    key: "elite",
    label: "Elite",
    copy: "Five hundred deep. You want authorial intent, panel composition, production context, and the argument the work is actually making — spoilers and all.",
    href: "/library?level=elite",
  },
];

import { seedTitles, seedPanels } from "@/lib/seed-data";

export default async function HomePage() {
  let featured: any[] = [];
  let counts: { format: string; count: number }[] = [];
  let latestPanels: any[] = [];
  let watchlistCount: { count: number }[] = [{ count: 0 }];
  let panelCount: { count: number }[] = [{ count: 0 }];
  let isDbConnected = true;

  try {
    await ensureSeeded();
    const res = await Promise.all([
      db.select().from(titles).orderBy(desc(titles.popularity)).limit(8),
      db
        .select({ format: titles.format, count: sql<number>`count(*)::int` })
        .from(titles)
        .groupBy(titles.format),
      db
        .select({
          id: panels.id,
          headline: panels.headline,
          body: panels.body,
          kind: panels.kind,
          authorLevel: panels.authorLevel,
          createdAt: panels.createdAt,
          slug: titles.slug,
          titleName: titles.name,
          accent: titles.accent,
          authorName: users.displayName,
          authorUsername: users.username,
        })
        .from(panels)
        .innerJoin(titles, eq(titles.id, panels.titleId))
        .innerJoin(users, eq(users.id, panels.userId))
        .orderBy(desc(panels.createdAt))
        .limit(3),
      db.select({ count: sql<number>`count(*)::int` }).from(watchlist),
      db.select({ count: sql<number>`count(*)::int` }).from(panels),
    ]);
    [featured, counts, latestPanels, watchlistCount, panelCount] = res;
  } catch (err) {
    isDbConnected = false;
    // Fallback to static seed data so the homepage ALWAYS loads cleanly even before DB connection!
    featured = seedTitles.slice(0, 8);
    counts = [
      { format: "anime", count: seedTitles.filter((t) => t.format === "anime").length },
      { format: "manga", count: seedTitles.filter((t) => t.format === "manga").length },
      { format: "manhwa", count: seedTitles.filter((t) => t.format === "manhwa").length },
    ];
    panelCount = [{ count: seedPanels.length }];
    watchlistCount = [{ count: 12 }];
    latestPanels = seedPanels.slice(0, 3).map((p, i) => {
      const t = seedTitles.find((st) => st.slug === p.titleSlug);
      return {
        id: i + 1,
        headline: p.headline,
        body: p.body,
        kind: p.kind,
        authorLevel: p.authorLevel,
        createdAt: new Date(),
        slug: p.titleSlug,
        titleName: t?.name ?? p.titleSlug,
        accent: t?.accent ?? "#ffffff",
        authorName: p.username,
        authorUsername: p.username,
      };
    });
  }

  const formatCount = (key: string) =>
    counts.find((row) => row.format === key)?.count ?? 0;

  const tickerNames = [...featured, ...featured].map((title) => title.name);

  return (
    <div>
      {!isDbConnected && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-300">
          <span className="font-semibold">⚡ Demo Archive Mode:</span> Real-time database is not connected. Add your <code className="bg-black/40 px-1.5 py-0.5 rounded text-paper">DATABASE_URL</code> to Vercel Environment Variables to activate live community panels and Messenger.
        </div>
      )}
      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.22] grayscale"
          style={{ backgroundImage: "url(/images/hero-ink.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
        <div className="grain absolute inset-0" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <div className="mono flex items-center gap-3 text-[9px] text-mute">
            <span className="h-px w-10 bg-paper/40" />
            panel 001 — the archive
          </div>

          <h1 className="display mt-6 text-[13vw] leading-[0.85] text-paper sm:text-[8rem]">
            Zero
            <br />
            <span className="text-mute">Panel</span>Verse
          </h1>

          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-dim sm:text-base">
            Every anime, manga and manhwa — filed in panels. A monochrome archive where each title
            repaints the interface with its own cinematic palette, and where every entry is written
            three times: once for the beginner, once for the mediocre, once for the elite.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/library"
              className="mono bg-paper px-6 py-3.5 text-[11px] text-ink transition-opacity hover:opacity-80"
            >
              Enter the archive
            </Link>
            <Link
              href="/timeline"
              className="mono border border-paper/40 px-6 py-3.5 text-[11px] text-paper transition-colors hover:bg-paper hover:text-ink"
            >
              Timeline tree
            </Link>
            <Link
              href="/streaming"
              className="mono border border-line px-6 py-3.5 text-[11px] text-dim transition-colors hover:border-paper hover:text-paper"
            >
              Streaming — planned
            </Link>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            {[
              { label: "Anime", value: formatCount("anime") },
              { label: "Manga", value: formatCount("manga") },
              { label: "Manhwa", value: formatCount("manhwa") },
              { label: "Panel entries", value: panelCount[0]?.count ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="bg-ink-soft px-5 py-6">
                <dt className="mono text-[9px] text-mute">{stat.label}</dt>
                <dd className="display mt-2 text-4xl text-paper">
                  {String(stat.value).padStart(2, "0")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------- ticker ---------------- */}
      <div className="overflow-hidden border-b border-line bg-ink-soft py-3">
        <div className="ticker flex w-max gap-8 whitespace-nowrap">
          {tickerNames.map((name, index) => (
            <span key={`${name}-${index}`} className="mono flex items-center gap-8 text-[10px] text-mute">
              {name}
              <span className="h-1 w-1 bg-paper/40" />
            </span>
          ))}
        </div>
      </div>

      {/* ---------------- audience tracks ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono text-[9px] text-mute">panel 002 — audience</div>
            <h2 className="display mt-3 text-3xl text-paper sm:text-4xl">
              Three ways to read
              <br />
              the same work
            </h2>
          </div>
          <p className="max-w-md text-[13.5px] leading-relaxed text-mute">
            The same title is a gateway for one viewer and a thesis for another. Every entry in the
            archive carries all three readings. Beginners keep spoilers hidden unless they choose to
            see them, Mediocre readers pick how much to reveal, and Elite readers get everything —
            including an Open Floor discussion with no boundaries.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {LEVELS.map((level, index) => (
            <Link
              key={level.key}
              href={level.href}
              className="panel panel-hover group flex flex-col gap-4 p-6"
            >
              <div className="flex items-start justify-between">
                <span className="mono text-[9px] text-mute">0{index + 1}</span>
                <span className="mono text-[9px] text-mute opacity-0 transition-opacity group-hover:opacity-100">
                  browse →
                </span>
              </div>
              <h3 className="display text-3xl text-paper">{level.label}</h3>
              <p className="text-[13.5px] leading-relaxed text-dim">{level.copy}</p>
              <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
                <span className="mono text-[9px] text-mute">difficulty guide included</span>
                <span className="h-px flex-1 bg-line" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- featured ---------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-10">
          <div>
            <div className="mono text-[9px] text-mute">panel 003 — archive</div>
            <h2 className="display mt-3 text-3xl text-paper sm:text-4xl">Most opened panels</h2>
          </div>
          <Link
            href="/library"
            className="mono border border-line px-4 py-2.5 text-[10px] text-dim hover:border-paper hover:text-paper"
          >
            View full library
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((title) => (
            <TitleCard key={title.slug ?? title.id} title={title} />
          ))}
        </div>
      </section>

      {/* ---------------- theming ---------------- */}
      <section className="border-y border-line bg-ink-soft">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mono text-[9px] text-mute">panel 004 — the interface</div>
            <h2 className="display mt-3 text-3xl text-paper sm:text-4xl">
              Black and white,
              <br />
              until the title decides
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-dim">
              ZeroPanelVerse is drawn in monochrome — ink, paper, hairline borders and print grain.
              Open a title and the archive borrows that work&apos;s palette: ashen crimson for the
              walls that fell, teal for a cursed subway, lantern gold for a bathhouse at night. The
              accent recolours frames, glows, texture overlays and the mood strip, so browsing feels
              like stepping into the film rather than reading a database row.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["halftone", "rain", "ink", "mist", "grid", "splatter", "etch", "scan"].map((tex) => (
                <span key={tex} className="mono border border-line px-2 py-1 text-[8px] text-mute">
                  {tex}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {featured.slice(0, 4).map((title) => (
              <div
                key={title.slug ?? title.id}
                className={`grain relative h-40 overflow-hidden border border-line tex-${title.texture}`}
                style={{
                  ["--accent" as string]: title.accent,
                  ["--accent-soft" as string]: title.accentSoft,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                <div className="absolute inset-0 bg-ink/55" />
                <div className="relative flex h-full flex-col justify-between p-4">
                  <span className="mono text-[8px] text-mute">
                    {title.mood?.split("—")[0] ?? title.mood ?? "Archive"}
                  </span>
                  <div>
                    <div className="h-[2px] w-10" style={{ background: title.accent }} />
                    <span className="display mt-2 block text-sm text-paper">{title.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- latest panels ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono text-[9px] text-mute">panel 005 — community</div>
            <h2 className="display mt-3 text-3xl text-paper sm:text-4xl">Fresh from the panels</h2>
          </div>
          <Link
            href="/panels"
            className="mono border border-line px-4 py-2.5 text-[10px] text-dim hover:border-paper hover:text-paper"
          >
            All discussions
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {latestPanels.map((panel) => (
            <article
              key={panel.id}
              className="panel panel-hover flex flex-col gap-4 p-5"
              style={{ ["--accent" as string]: panel.accent }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="mono border accent-border px-2 py-0.5 text-[8px] accent-text">
                  {panel.authorLevel}
                </span>
                <span className="mono text-[8px] text-mute">{panel.kind}</span>
              </div>
              <h3 className="display text-lg leading-tight text-paper">{panel.headline}</h3>
              <p className="line-clamp-4 text-[13px] leading-relaxed text-dim">{panel.body}</p>
              <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
                <Link href={`/title/${panel.slug}`} className="mono text-[9px] accent-text">
                  {panel.titleName}
                </Link>
                <Link href={`/u/${panel.authorUsername}`} className="mono text-[9px] text-mute hover:text-paper">
                  @{panel.authorUsername}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="panel grain mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="max-w-xl text-[13.5px] leading-relaxed text-dim">
            {`${watchlistCount[0]?.count ?? 0} slot${(watchlistCount[0]?.count ?? 0) === 1 ? "" : "s"}`}{" "}
            are already filled across member panel lists. Add yours, mark what you are reading, and
            post the take you wish someone had given you before you started.
          </p>
          <Link
            href="/signup"
            className="mono bg-paper px-5 py-3 text-[10px] text-ink hover:opacity-80"
          >
            Join ZeroPanelVerse
          </Link>
        </div>
      </section>
    </div>
  );
}
