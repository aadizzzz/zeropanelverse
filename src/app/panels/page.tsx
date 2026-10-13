import Link from "next/link";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { panels, titles, users, type PanelKind, type PanelRoom } from "@/db/schema";
import { ensureSeeded } from "@/lib/db-init";
import { getCurrentUser } from "@/lib/auth";
import { getLens } from "@/lib/lens";
import { LEVEL_NAMES, canSee, hasOpenAccess } from "@/lib/lens-shared";
import { SpoilerVeil } from "@/components/SpoilerVeil";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panels — community reviews, views and suggestions",
  description:
    "Every review, point of view and suggestion posted across the ZeroPanelVerse archive, in a spoiler-safe lounge and a no-boundaries open floor.",
};

const KINDS: { value: string; label: string; copy: string }[] = [
  { value: "all", label: "Everything", copy: "The full feed" },
  { value: "review", label: "Reviews", copy: "Scored verdicts" },
  { value: "view", label: "Points of view", copy: "Readings and arguments" },
  { value: "suggestion", label: "Suggestions", copy: "Advice for other viewers" },
];

const ROOMS: { value: string; label: string; copy: string }[] = [
  { value: "all", label: "Both rooms", copy: "Everything your lens allows" },
  { value: "lounge", label: "Beginner Lounge", copy: "Spoiler-safe" },
  { value: "open", label: "Open Floor", copy: "No boundaries · Mediocre + Elite" },
];

export default async function PanelsPage({
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
  const openAccess = hasOpenAccess(lens);

  const kindParam = read("kind");
  const kind: PanelKind | "all" =
    kindParam === "review" || kindParam === "view" || kindParam === "suggestion" ? kindParam : "all";
  const roomParam = read("room");
  const room: PanelRoom | "all" = roomParam === "lounge" || roomParam === "open" ? roomParam : "all";

  const conditions: SQL[] = [];
  if (kind !== "all") conditions.push(eq(panels.kind, kind));
  if (room !== "all") conditions.push(eq(panels.room, room));
  // Beginners with spoilers hidden never receive Open Floor entries.
  if (!openAccess) conditions.push(eq(panels.room, "lounge"));

  const rows = await db
    .select({
      id: panels.id,
      room: panels.room,
      headline: panels.headline,
      body: panels.body,
      kind: panels.kind,
      rating: panels.rating,
      authorLevel: panels.authorLevel,
      spoilerGrade: panels.spoilerGrade,
      createdAt: panels.createdAt,
      slug: titles.slug,
      titleName: titles.name,
      accent: titles.accent,
      texture: titles.texture,
      authorName: users.displayName,
      authorUsername: users.username,
      authorGlyph: users.avatarGlyph,
    })
    .from(panels)
    .innerJoin(titles, eq(titles.id, panels.titleId))
    .innerJoin(users, eq(users.id, panels.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(panels.createdAt))
    .limit(60);

  const hiddenOpen = !openAccess
    ? (
        await db
          .select({ id: panels.id })
          .from(panels)
          .where(eq(panels.room, "open"))
      ).length
    : 0;

  const href = (nextKind: string, nextRoom: string) => {
    const query = new URLSearchParams();
    if (nextKind !== "all") query.set("kind", nextKind);
    if (nextRoom !== "all") query.set("room", nextRoom);
    const text = query.toString();
    return text ? `/panels?${text}` : "/panels";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mono flex items-center gap-3 text-[9px] text-mute">
        <span className="h-px w-10 bg-paper/40" />
        community
      </div>
      <h1 className="display mt-5 text-5xl text-paper sm:text-7xl">Panels</h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-dim">
        Two rooms. The Beginner Lounge is spoiler-safe for newcomers. The Open Floor is for Mediocre
        and Elite panelists and has no boundaries: endings, theories and hot takes are all fair game.
        Every entry is tagged with the audience level it was written from.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {ROOMS.map((item) => {
          const on = item.value === room;
          return (
            <Link
              key={item.value}
              href={href(kind, item.value)}
              className={`panel panel-hover p-4 ${on ? "border-paper bg-white/5" : ""}`}
            >
              <span className="display block text-lg text-paper">{item.label}</span>
              <span className="mono mt-1 block text-[8px] text-mute">{item.copy}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        {KINDS.map((item) => {
          const on = item.value === kind;
          return (
            <Link
              key={item.value}
              href={href(item.value, room)}
              className={`panel panel-hover p-4 ${on ? "border-paper bg-white/5" : ""}`}
            >
              <span className="display block text-base text-paper">{item.label}</span>
              <span className="mono mt-1 block text-[8px] text-mute">{item.copy}</span>
            </Link>
          );
        })}
      </div>

      {!openAccess ? (
        <div className="panel grain mt-8 flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="max-w-2xl text-[13px] leading-relaxed text-dim">
            <span className="text-paper">{hiddenOpen} Open Floor entries</span> are hidden because you
            are reading as a {LEVEL_NAMES[lens.level]} with spoilers hidden. Switch spoilers on in the
            lens bar whenever you want to walk in.
          </p>
        </div>
      ) : null}

      <div className="mt-10 flex flex-col gap-4">
        {rows.length === 0 ? (
          <div className="panel p-12 text-center">
            <p className="mono text-[10px] text-mute">No entries in this panel yet.</p>
          </div>
        ) : null}

        {rows.map((row) => {
          const veiled = row.spoilerGrade !== "none" && !canSee(lens, row.spoilerGrade);
          return (
            <article
              key={row.id}
              className="panel grain flex flex-col gap-4 p-5 sm:flex-row sm:p-6"
              style={{
                ["--accent" as string]: row.accent,
                ["--accent-soft" as string]: "#3a3a3f",
              }}
            >
              <div className="hidden w-24 shrink-0 sm:block">
                <div
                  className={`grain relative h-full min-h-[120px] overflow-hidden border border-line tex-${row.texture}`}
                >
                  <div className="absolute inset-0 bg-ink/70" />
                  <div className="relative flex h-full items-center justify-center">
                    <span className="display text-3xl accent-text">{row.authorGlyph}</span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mono flex flex-wrap items-center gap-2 text-[8px] text-mute">
                  <span className="border border-line px-1.5 py-0.5">
                    {row.room === "open" ? "open floor" : "lounge"}
                  </span>
                  <span className="border border-line px-1.5 py-0.5">{row.kind}</span>
                  <span
                    className={`border px-1.5 py-0.5 ${
                      row.authorLevel === "elite"
                        ? "border-paper bg-paper text-ink"
                        : row.authorLevel === "mediocre"
                          ? "border-paper/50 text-paper"
                          : "border-dashed border-paper/40 text-dim"
                    }`}
                  >
                    {row.authorLevel}
                  </span>
                  {row.spoilerGrade === "none" ? null : (
                    <span className="border border-paper/60 px-1.5 py-0.5 text-paper">
                      {row.spoilerGrade} spoilers
                    </span>
                  )}
                  <span>·</span>
                  <span>{new Date(row.createdAt).toLocaleDateString("en-GB")}</span>
                  <span className="ml-auto accent-text">
                    {row.rating > 0 ? `${row.rating.toFixed(1)}/10` : "—"}
                  </span>
                </div>

                <SpoilerVeil
                  panelId={row.id}
                  grade={row.spoilerGrade}
                  veiled={veiled}
                  headline={veiled ? "" : row.headline}
                  body={veiled ? "" : row.body}
                  headingTag="h2"
                  headlineClassName="display mt-3 text-xl leading-tight text-paper"
                  bodyClassName="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-dim"
                />

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                  <Link
                    href={`/u/${row.authorUsername}`}
                    className="mono text-[9px] text-dim hover:text-paper"
                  >
                    {row.authorName} · @{row.authorUsername}
                  </Link>
                  <span className="h-px flex-1 bg-line" />
                  <Link
                    href={`/title/${row.slug}`}
                    className="mono text-[9px] accent-text hover:underline"
                  >
                    {row.titleName} →
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
