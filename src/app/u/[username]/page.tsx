import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { panels, titles, users, watchlist } from "@/db/schema";
import { ensureSeeded } from "@/lib/db-init";
import { LEVEL_LABELS } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${username} — ZeroPanelVerse` };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  await ensureSeeded();
  const { username } = await params;

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  const profile = rows[0];
  if (!profile) notFound();

  const [entries, list] = await Promise.all([
    db
      .select({
        id: panels.id,
        headline: panels.headline,
        body: panels.body,
        kind: panels.kind,
        rating: panels.rating,
        authorLevel: panels.authorLevel,
        createdAt: panels.createdAt,
        slug: titles.slug,
        titleName: titles.name,
        accent: titles.accent,
      })
      .from(panels)
      .innerJoin(titles, eq(titles.id, panels.titleId))
      .where(eq(panels.userId, profile.id))
      .orderBy(desc(panels.createdAt))
      .limit(12),
    db
      .select({
        slug: titles.slug,
        name: titles.name,
        accent: titles.accent,
        glyph: titles.glyph,
        format: titles.format,
        status: watchlist.status,
      })
      .from(watchlist)
      .innerJoin(titles, eq(titles.id, watchlist.titleId))
      .where(eq(watchlist.userId, profile.id))
      .limit(12),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="panel grain relative overflow-hidden p-6 sm:p-10">
        <div className="tex-halftone absolute inset-0 opacity-20" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="display grid h-20 w-20 place-items-center border border-paper/40 bg-ink text-3xl text-paper">
            {profile.avatarGlyph}
          </span>
          <div className="flex-1">
            <h1 className="display text-4xl text-paper sm:text-5xl">{profile.displayName}</h1>
            <div className="mono mt-2 flex flex-wrap items-center gap-2 text-[9px] text-mute">
              <span>@{profile.username}</span>
              <span>·</span>
              <span className="border border-paper/40 px-2 py-0.5 text-paper">
                {LEVEL_LABELS[profile.experienceLevel]} panelist
              </span>
              <span>·</span>
              <span>joined {new Date(profile.createdAt).toLocaleDateString("en-GB")}</span>
            </div>
            {profile.bio ? (
              <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-dim">{profile.bio}</p>
            ) : null}
          </div>
          <Link
            href="/panels"
            className="mono border border-line px-4 py-2.5 text-[10px] text-dim hover:border-paper hover:text-paper"
          >
            All panels
          </Link>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <section className="flex flex-col gap-5">
          <div>
            <div className="mono text-[9px] text-mute">panel entries</div>
            <h2 className="display mt-3 text-3xl text-paper">Points of view</h2>
          </div>

          {entries.length === 0 ? (
            <div className="panel p-10 text-center">
              <p className="text-[13.5px] text-dim">This panelist has not posted an entry yet.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <article
                key={entry.id}
                className="panel panel-hover p-5"
                style={{ ["--accent" as string]: entry.accent }}
              >
                <div className="mono flex flex-wrap items-center gap-2 text-[8px] text-mute">
                  <span className="border border-line px-1.5 py-0.5">{entry.kind}</span>
                  <span>{entry.authorLevel}</span>
                  <span>·</span>
                  <span>{new Date(entry.createdAt).toLocaleDateString("en-GB")}</span>
                  <span className="ml-auto accent-text">
                    {entry.rating > 0 ? `${entry.rating.toFixed(1)}/10` : "—"}
                  </span>
                </div>
                <h3 className="display mt-3 text-lg leading-tight text-paper">{entry.headline}</h3>
                <p className="mt-2 line-clamp-5 text-[13px] leading-relaxed text-dim">{entry.body}</p>
                <Link
                  href={`/title/${entry.slug}`}
                  className="mono mt-4 inline-block text-[9px] accent-text hover:underline"
                >
                  {entry.titleName} →
                </Link>
              </article>
            ))
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <div className="panel grain p-5">
            <h3 className="mono mb-4 text-[9px] text-mute">Archive stats</h3>
            <div className="flex flex-col gap-3 text-[13px]">
              {[
                ["Entries posted", String(entries.length)],
                ["Titles tracked", String(list.length)],
                [
                  "Average score",
                  entries.length > 0
                    ? (
                        entries.reduce((sum, entry) => sum + entry.rating, 0) / entries.length
                      ).toFixed(1)
                    : "—",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between border-b border-line pb-2">
                  <span className="mono text-[9px] text-mute">{label}</span>
                  <span className="text-paper">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel grain p-5">
            <h3 className="mono mb-4 text-[9px] text-mute">Recently tracked</h3>
            {list.length === 0 ? (
              <p className="text-[12.5px] text-dim">No tracked titles yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {list.map((item) => (
                  <Link
                    key={`${item.slug}-${item.status}`}
                    href={`/title/${item.slug}`}
                    className="flex items-center gap-3 border border-line p-2.5 hover:border-paper"
                  >
                    <span className="display text-lg" style={{ color: item.accent }}>
                      {item.glyph}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-paper">{item.name}</span>
                      <span className="mono block text-[8px] text-mute">{item.status}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
