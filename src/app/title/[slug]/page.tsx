import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  panels,
  titleNodes,
  titles,
  users,
  watchlist,
  type TierInfo,
  type TitleTiers,
} from "@/db/schema";
import { ensureSeeded } from "@/lib/db-init";
import { getCurrentUser } from "@/lib/auth";
import { getLens } from "@/lib/lens";
import { LEVEL_NAMES, SPOILER_NAMES, canSee, hasOpenAccess, levelFit } from "@/lib/lens-shared";
import { PosterArt } from "@/components/PosterArt";
import { TierPanels } from "@/components/TierPanels";
import { PanelThread, type PanelItem } from "@/components/PanelThread";
import { WatchlistControls } from "@/components/WatchlistControls";
import { TitleCard } from "@/components/TitleCard";
import { FranchiseTree, type TreeNodeData } from "@/components/FranchiseTree";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rows = await db.select().from(titles).where(eq(titles.slug, slug)).limit(1);
  const title = rows[0];
  if (!title) return { title: "Panel not found — ZeroPanelVerse" };
  return {
    title: `${title.name} — ZeroPanelVerse`,
    description: title.synopsis.slice(0, 180),
  };
}

export default async function TitlePage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSeeded();
  const { slug } = await params;

  const titleRows = await db.select().from(titles).where(eq(titles.slug, slug)).limit(1);
  const title = titleRows[0];
  if (!title) notFound();

  const user = await getCurrentUser();
  const lens = await getLens(user);
  const openAccess = hasOpenAccess(lens);

  /* ----------------------------- franchise tree ----------------------------- */
  const nodeRows = await db
    .select()
    .from(titleNodes)
    .where(eq(titleNodes.titleId, title.id))
    .orderBy(asc(titleNodes.releaseOrder));

  const mildOk = canSee(lens, "mild");
  const heavyOk = canSee(lens, "heavy");
  const treeNodes: TreeNodeData[] = nodeRows.map((row) => ({
    key: row.nodeKey,
    parentKey: row.parentKey,
    label: row.label,
    kind: row.kind,
    year: row.year,
    releaseOrder: row.releaseOrder,
    chronoOrder: row.chronoOrder,
    units: row.units,
    unit: row.unit,
    rating: row.rating,
    power: row.powerLevel,
    priority: row.priority,
    canon: row.canon,
    creator: row.creator,
    blurb: row.blurb,
    // Spoiler notes are withheld on the server unless the lens allows them.
    mild: row.mildNote && mildOk ? row.mildNote : null,
    mildLocked: Boolean(row.mildNote) && !mildOk,
    heavy: row.heavyNote && heavyOk ? row.heavyNote : null,
    heavyLocked: Boolean(row.heavyNote) && !heavyOk,
    powerNote: row.powerNote && heavyOk ? row.powerNote : null,
  }));

  /* ------------------------------ discussion ------------------------------ */
  const panelRows = await db
    .select({
      id: panels.id,
      room: panels.room,
      kind: panels.kind,
      authorLevel: panels.authorLevel,
      rating: panels.rating,
      headline: panels.headline,
      body: panels.body,
      spoilerGrade: panels.spoilerGrade,
      createdAt: panels.createdAt,
      userId: panels.userId,
      authorName: users.displayName,
      authorUsername: users.username,
      authorGlyph: users.avatarGlyph,
      score: sql<number>`(select coalesce(sum(v.value), 0)::int from panel_votes v where v.panel_id = ${panels.id})`,
    })
    .from(panels)
    .innerJoin(users, eq(users.id, panels.userId))
    .where(eq(panels.titleId, title.id))
    .orderBy(desc(panels.createdAt));

  const openTotal = panelRows.filter((row) => row.room === "open").length;
  // Beginners with spoilers hidden never receive Open Floor content at all.
  const visibleRows = openAccess ? panelRows : panelRows.filter((row) => row.room === "lounge");

  const items: PanelItem[] = visibleRows.map((row) => {
    const veiled = row.spoilerGrade !== "none" && !canSee(lens, row.spoilerGrade);
    return {
      id: row.id,
      room: row.room,
      kind: row.kind,
      authorLevel: row.authorLevel,
      rating: row.rating,
      headline: veiled ? "" : row.headline,
      body: veiled ? "" : row.body,
      spoilerGrade: row.spoilerGrade,
      veiled,
      createdAt: new Date(row.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      authorName: row.authorName,
      authorUsername: row.authorUsername,
      authorGlyph: row.authorGlyph,
      score: row.score,
      mine: user ? row.userId === user.id : false,
    };
  });

  const savedRows = user
    ? await db
        .select({ status: watchlist.status })
        .from(watchlist)
        .where(and(eq(watchlist.userId, user.id), eq(watchlist.titleId, title.id)))
        .limit(1)
    : [];
  const savedStatus = savedRows[0]?.status ?? null;

  const similar = await db
    .select()
    .from(titles)
    .where(
      and(
        ne(titles.id, title.id),
        or(
          eq(titles.format, title.format),
          ...title.genres.map((genre) => sql`${titles.genres} @> ${JSON.stringify([genre])}::jsonb`),
        ),
      ),
    )
    .orderBy(desc(titles.popularity))
    .limit(4);

  const communityScore =
    panelRows.length > 0 ? panelRows.reduce((sum, row) => sum + row.rating, 0) / panelRows.length : 0;

  const complexity = title.tiers.elite.difficulty;
  const fit = levelFit(lens.level, title.rating, complexity);

  // Guides above the reader's spoiler comfort are withheld on the server, not just hidden in the UI.
  const guard = (info: TierInfo): TierInfo =>
    canSee(lens, info.spoilerLevel)
      ? info
      : { ...info, summary: "", whyItClicks: "", startHere: "", prerequisites: [], deepDive: "" };
  const guardedTiers: TitleTiers = {
    beginner: guard(title.tiers.beginner),
    mediocre: guard(title.tiers.mediocre),
    elite: guard(title.tiers.elite),
  };

  const facts: Array<[string, string]> = [
    ["Format", title.format],
    ["Released", String(title.year)],
    ["Status", title.status],
    ["Episodes", title.episodes > 0 ? String(title.episodes) : "—"],
    ["Chapters", title.chapters > 0 ? String(title.chapters) : "—"],
    ["Origin", title.origin],
    ["Studio / Author", title.studio],
    ["Age rating", title.ageRating],
  ];

  return (
    <div
      style={{
        ["--accent" as string]: title.accent,
        ["--accent-soft" as string]: title.accentSoft,
      }}
    >
      {/* ---------------- cinematic header ---------------- */}
      <section className="relative overflow-hidden border-b border-line">
        <div className={`absolute inset-0 tex-${title.texture} opacity-45`} />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/90 to-ink" />
        <div className="grain absolute inset-0" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[300px_1fr]">
          <PosterArt
            slug={title.slug}
            name={title.name}
            glyph={title.glyph}
            format={title.format}
            accent={title.accent}
            accentSoft={title.accentSoft}
            texture={title.texture}
            year={title.year}
            className="w-full max-w-[300px]"
          />

          <div className="flex flex-col gap-6">
            <div className="mono flex flex-wrap items-center gap-3 text-[9px] text-mute">
              <Link href="/library" className="hover:text-paper">
                archive
              </Link>
              <span>/</span>
              <Link href={`/library?format=${title.format}`} className="hover:text-paper">
                {title.format}
              </Link>
              <span>/</span>
              <span className="accent-text">{title.slug}</span>
            </div>

            <div>
              <h1 className="display text-[11vw] leading-[0.86] text-paper sm:text-6xl lg:text-7xl">
                {title.name}
              </h1>
              <p className="mono mt-3 text-[10px] text-mute">{title.altName}</p>
              <p className="mt-5 max-w-2xl text-lg leading-snug" style={{ color: title.accent }}>
                {title.tagline}
              </p>
            </div>

            <div className="grid gap-px border border-line bg-line sm:grid-cols-4">
              {[
                { label: "Archive score", value: title.rating.toFixed(1) },
                { label: "Panel score", value: communityScore > 0 ? communityScore.toFixed(1) : "—" },
                { label: "Complexity", value: `${complexity}/5` },
                { label: `Fit · ${LEVEL_NAMES[lens.level]}`, value: `${fit}%` },
              ].map((stat) => (
                <div key={stat.label} className="bg-ink-soft px-4 py-4">
                  <div className="mono text-[8px] text-mute">{stat.label}</div>
                  <div className="display mt-1.5 text-2xl text-paper">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {title.genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/library?genre=${encodeURIComponent(genre)}`}
                  className="mono border border-line px-2.5 py-1.5 text-[9px] text-dim transition-colors hover:border-paper hover:text-paper"
                >
                  {genre}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-line pt-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mono mb-2 text-[9px] text-mute">Your panel list</div>
                {user ? (
                  <WatchlistControls titleId={title.id} current={savedStatus} />
                ) : (
                  <p className="mono text-[10px] text-mute">
                    <Link href="/login" className="accent-text underline">
                      Log in
                    </Link>{" "}
                    to track this title
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 lg:items-end">
                <span className="mono text-[9px] text-mute">streaming</span>
                {title.streamingPlanned ? (
                  <Link
                    href="/streaming"
                    className="mono border accent-border px-4 py-2.5 text-[10px] accent-text transition-colors hover:bg-paper hover:text-ink"
                  >
                    Planned for the player
                  </Link>
                ) : (
                  <span className="mono border border-line px-4 py-2.5 text-[10px] text-mute">
                    Archive only
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* mood strip */}
        <div className="relative flex items-center gap-4 border-t border-line bg-ink px-4 py-3 sm:px-6">
          <span className="mono shrink-0 text-[9px] text-mute">cinematic mood</span>
          <span className="pulse-line h-2 w-2 shrink-0 accent-bg" />
          <span className="mono flex-1 truncate text-[9px] text-dim">{title.mood}</span>
          <span className="hidden gap-1 sm:flex">
            {[0, 1, 2, 3, 4].map((dot) => (
              <span
                key={dot}
                className="h-2 w-2"
                style={{
                  background: dot % 2 === 0 ? title.accent : title.accentSoft,
                  opacity: 1 - dot * 0.14,
                }}
              />
            ))}
          </span>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-14">
          {/* synopsis */}
          <section>
            <div className="mono text-[9px] text-mute">panel 01 — the work</div>
            <h2 className="display mt-3 text-3xl text-paper">Synopsis</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-dim">{title.synopsis}</p>

            <div className="mt-7 flex flex-wrap gap-2">
              {title.themes.map((theme) => (
                <span
                  key={theme}
                  className="mono border border-dashed border-paper/25 px-2.5 py-1.5 text-[9px] text-mute"
                >
                  {theme}
                </span>
              ))}
            </div>
          </section>

          {/* timeline tree */}
          {treeNodes.length > 0 ? (
            <section>
              <div className="mono text-[9px] text-mute">panel 02 — the timeline tree</div>
              <h2 className="display mt-3 text-3xl text-paper">What came first, and how the power moved</h2>
              <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-dim">
                Every season, film, OVA, arc and source work of this franchise, grouped by what grew
                out of what. You are viewing it at <span className="text-paper">{LEVEL_NAMES[lens.level]}</span>{" "}
                depth with spoilers <span className="text-paper">{SPOILER_NAMES[lens.spoilers].toLowerCase()}</span>
                . Change your lens in the bar above and the tree rewrites itself.
              </p>
              <div className="mt-6">
                <FranchiseTree nodes={treeNodes} lens={lens} />
              </div>
            </section>
          ) : null}

          {/* tiers */}
          <section>
            <div className="mono text-[9px] text-mute">panel 03 — audience guides</div>
            <h2 className="display mb-5 mt-3 text-3xl text-paper">Beginner · Mediocre · Elite</h2>
            <TierPanels tiers={guardedTiers} lens={lens} />
          </section>

          {/* community */}
          <PanelThread
            titleId={title.id}
            items={items}
            signedIn={Boolean(user)}
            viewerLevel={user?.experienceLevel ?? null}
            lens={lens}
            openAccess={openAccess}
            openTotal={openTotal}
          />
        </div>

        {/* sidebar */}
        <aside className="flex flex-col gap-6">
          <div className="panel grain p-5">
            <h3 className="mono mb-4 text-[9px] text-mute">File card</h3>
            <dl className="flex flex-col gap-3">
              {facts.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-3 border-b border-line pb-2"
                >
                  <dt className="mono text-[9px] text-mute">{label}</dt>
                  <dd className="text-right text-[13px] capitalize text-paper">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel grain p-5">
            <h3 className="mono mb-4 text-[9px] text-mute">Your lens right now</h3>
            <p className="text-[12.5px] leading-relaxed text-dim">
              <span className="text-paper">{LEVEL_NAMES[lens.level]}</span> depth ·{" "}
              <span className="text-paper">{SPOILER_NAMES[lens.spoilers]}</span> spoilers. The Open Floor
              is {openAccess ? "open to you." : "closed until you choose to see spoilers."}
            </p>
            <Link
              href="/timeline"
              className="mono mt-4 block border border-line px-3 py-2.5 text-center text-[10px] text-dim hover:border-paper hover:text-paper"
            >
              See the whole-archive timeline
            </Link>
          </div>

          <div className="panel grain p-5">
            <h3 className="mono mb-4 text-[9px] text-mute">How this panel is themed</h3>
            <div className={`relative mb-4 h-24 overflow-hidden border border-line tex-${title.texture}`}>
              <div className="absolute inset-0 bg-ink/60" />
            </div>
            <p className="text-[12.5px] leading-relaxed text-dim">
              The archive stays monochrome, but this panel borrows the work&apos;s palette. Accent{" "}
              <span className="accent-text">{title.accent}</span> drives frames, glows and the{" "}
              <span className="text-paper">{title.texture}</span> texture so the page sits inside the
              film&apos;s environment rather than describing it.
            </p>
          </div>

          <div className="panel grain p-5">
            <h3 className="mono mb-4 text-[9px] text-mute">Similar panels</h3>
            <div className="flex flex-col gap-3">
              {similar.map((item) => (
                <Link
                  key={item.id}
                  href={`/title/${item.slug}`}
                  className="flex items-center gap-3 border border-line p-2.5 transition-colors hover:border-paper"
                >
                  <span
                    className="display grid h-10 w-10 shrink-0 place-items-center border border-line text-base"
                    style={{ color: item.accent }}
                  >
                    {item.glyph}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] text-paper">{item.name}</span>
                    <span className="mono block text-[8px] text-mute">
                      {item.format} · {item.year}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* more */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="border-t border-line pt-10">
          <h2 className="display text-2xl text-paper">Continue through the archive</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similar.map((item) => (
              <TitleCard key={item.id} title={item} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
