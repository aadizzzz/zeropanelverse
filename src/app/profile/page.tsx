import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { panels, titles, watchlist } from "@/db/schema";
import { getCurrentUser, LEVEL_LABELS } from "@/lib/auth";
import { ProfileEditor } from "@/components/ProfileEditor";
import { PosterArt } from "@/components/PosterArt";
import { logoutAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your panel — ZeroPanelVerse",
};

const STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  watching: "In progress",
  finished: "Finished",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let list: any[] = [];
  let myPanels: any[] = [];
  let totals: { count: number }[] = [{ count: 0 }];

  try {
    const res = await Promise.all([
      db
        .select({
          status: watchlist.status,
          id: titles.id,
          slug: titles.slug,
          name: titles.name,
          glyph: titles.glyph,
          format: titles.format,
          accent: titles.accent,
          accentSoft: titles.accentSoft,
          texture: titles.texture,
          year: titles.year,
          rating: titles.rating,
        })
        .from(watchlist)
        .innerJoin(titles, eq(titles.id, watchlist.titleId))
        .where(eq(watchlist.userId, user.id))
        .orderBy(desc(watchlist.createdAt)),
      db
        .select({
          id: panels.id,
          headline: panels.headline,
          kind: panels.kind,
          rating: panels.rating,
          createdAt: panels.createdAt,
          titleName: titles.name,
          slug: titles.slug,
          accent: titles.accent,
        })
        .from(panels)
        .innerJoin(titles, eq(titles.id, panels.titleId))
        .where(eq(panels.userId, user.id))
        .orderBy(desc(panels.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(watchlist).where(eq(watchlist.userId, user.id)),
    ]);
    [list, myPanels, totals] = res;
  } catch (err) {
    console.warn("Profile query error:", err);
  }

  const grouped = (["watching", "planned", "finished"] as const).map((status) => ({
    status,
    items: list.filter((item) => item.status === status),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {/* identity */}
      <section
        className="panel grain relative overflow-hidden p-6 sm:p-10"
        style={{ ["--accent" as string]: user.experienceLevel === "elite" ? "#f3f3ef" : "#8a8a90" }}
      >
        <div className="tex-halftone absolute inset-0 opacity-25" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="display grid h-24 w-24 place-items-center border border-paper/40 bg-ink text-4xl text-paper">
              {user.avatarGlyph}
            </span>
            <div>
              <div className="mono flex flex-wrap items-center gap-2 text-[9px] text-mute">
                <span>@{user.username}</span>
                <span>·</span>
                <span>joined {new Date(user.createdAt).toLocaleDateString("en-GB")}</span>
              </div>
              <h1 className="display mt-2 text-4xl text-paper sm:text-5xl">{user.displayName}</h1>
              <span className="mono mt-3 inline-block border border-paper/40 px-2.5 py-1 text-[9px] text-paper">
                {LEVEL_LABELS[user.experienceLevel]} panelist
              </span>
              {user.bio ? (
                <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-dim">{user.bio}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px border border-line bg-line lg:w-80">
            {[
              { label: "List", value: totals[0]?.count ?? 0 },
              { label: "Entries", value: myPanels.length },
              {
                label: "Avg score",
                value:
                  myPanels.length > 0
                    ? (
                        myPanels.reduce((sum, panel) => sum + panel.rating, 0) / myPanels.length
                      ).toFixed(1)
                    : "—",
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-ink px-4 py-5 text-center">
                <div className="mono text-[8px] text-mute">{stat.label}</div>
                <div className="display mt-1.5 text-2xl text-paper">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-12">
          {/* list */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="mono text-[9px] text-mute">panel 01 — your list</div>
                <h2 className="display mt-3 text-3xl text-paper">Panel list</h2>
              </div>
              <Link
                href="/library"
                className="mono border border-line px-4 py-2.5 text-[10px] text-dim hover:border-paper hover:text-paper"
              >
                Add titles
              </Link>
            </div>

            {list.length === 0 ? (
              <div className="panel mt-6 p-10 text-center">
                <p className="text-[13.5px] text-dim">
                  Nothing here yet. Open any title and mark it as planned, in progress or finished.
                </p>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-8">
                {grouped.map((group) =>
                  group.items.length === 0 ? null : (
                    <div key={group.status}>
                      <h3 className="mono mb-3 flex items-center gap-3 text-[9px] text-mute">
                        <span className="h-px w-6 bg-paper/40" />
                        {STATUS_LABEL[group.status]} · {group.items.length}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-5">
                        {group.items.map((item) => (
                          <Link
                            key={item.id}
                            href={`/title/${item.slug}`}
                            className="panel panel-hover overflow-hidden"
                            style={{
                              ["--accent" as string]: item.accent,
                              ["--accent-soft" as string]: item.accentSoft,
                            }}
                          >
                            <PosterArt
                              slug={item.slug}
                              name={item.name}
                              glyph={item.glyph}
                              format={item.format}
                              accent={item.accent}
                              accentSoft={item.accentSoft}
                              texture={item.texture}
                              year={item.year}
                              compact
                              className="aspect-[3/4] w-full border-0 border-b border-line"
                            />
                            <div className="flex items-center justify-between p-3">
                              <span className="mono text-[8px] text-mute">{item.format}</span>
                              <span className="mono text-[9px] accent-text">
                                {item.rating.toFixed(1)}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          {/* my entries */}
          <section>
            <div className="mono text-[9px] text-mute">panel 02 — your entries</div>
            <h2 className="display mt-3 text-3xl text-paper">Your takes</h2>
            {myPanels.length === 0 ? (
              <div className="panel mt-6 p-10 text-center">
                <p className="text-[13.5px] text-dim">
                  You have not posted in a panel yet. Open a title and share the take you wish
                  someone had given you before you started.
                </p>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {myPanels.map((panel) => (
                  <Link
                    key={panel.id}
                    href={`/title/${panel.slug}`}
                    className="panel panel-hover flex flex-wrap items-center justify-between gap-3 p-4"
                    style={{ ["--accent" as string]: panel.accent }}
                  >
                    <div className="min-w-0">
                      <span className="mono text-[8px] text-mute">
                        {panel.kind} · {new Date(panel.createdAt).toLocaleDateString("en-GB")}
                      </span>
                      <h3 className="display mt-1.5 truncate text-base text-paper">
                        {panel.headline}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="mono text-[9px] text-mute">{panel.titleName}</span>
                      <span className="mono text-[10px] accent-text">
                        {panel.rating > 0 ? `${panel.rating.toFixed(1)}/10` : "—"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* sidebar */}
        <aside className="flex flex-col gap-6">
          <div className="panel grain p-5">
            <h3 className="mono mb-4 text-[9px] text-mute">Edit your panel</h3>
            <ProfileEditor user={user} />
          </div>

          <div className="panel grain p-5">
            <h3 className="mono mb-4 text-[9px] text-mute">Account</h3>
            <div className="flex flex-col gap-3 text-[13px]">
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                <span className="mono text-[9px] text-mute">Email</span>
                <span className="truncate text-dim">{user.email}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                <span className="mono text-[9px] text-mute">Username</span>
                <span className="text-dim">@{user.username}</span>
              </div>
              <Link
                href={`/u/${user.username}`}
                className="mono border border-line px-3 py-2.5 text-center text-[10px] text-dim hover:border-paper hover:text-paper"
              >
                View public profile
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="mono w-full border border-line px-3 py-2.5 text-[10px] text-mute hover:border-paper hover:text-paper"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="panel grain p-5">
            <h3 className="mono mb-4 text-[9px] text-mute">Streaming</h3>
            <p className="text-[12.5px] leading-relaxed text-dim">
              The ZeroPanelVerse player is in planning. Panel members get first access when the
              beta opens.
            </p>
            <Link
              href="/streaming"
              className="mono mt-4 block border accent-border px-3 py-2.5 text-center text-[10px] accent-text hover:bg-paper hover:text-ink"
            >
              Join the stream list
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
