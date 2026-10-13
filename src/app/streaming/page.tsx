import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { streamWaitlist, titles } from "@/db/schema";
import { ensureSeeded } from "@/lib/db-init";
import { getCurrentUser } from "@/lib/auth";
import { WaitlistForm } from "@/components/WaitlistForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Streaming — planned · ZeroPanelVerse",
  description:
    "The ZeroPanelVerse streaming player is planned. See the roadmap and join the launch list.",
};

const PHASES = [
  {
    tag: "phase 01 · live",
    title: "The archive",
    copy: "Every anime, manga and manhwa filed with three audience guides, cinematic per-title theming, and community panels for reviews, points of view and suggestions.",
    state: "done" as const,
  },
  {
    tag: "phase 02 · building",
    title: "The player",
    copy: "Episode streaming with a monochrome cinema mode that inherits the accent of whatever you are watching, resume points synced to your panel list, and chapter markers for manga and manhwa volumes.",
    state: "active" as const,
  },
  {
    tag: "phase 03 · planned",
    title: "Watch parties",
    copy: "Synchronised rooms where a beginner, a mediocre and an elite can watch the same episode and see each level's notes appear at the right timestamp.",
    state: "next" as const,
  },
  {
    tag: "phase 04 · planned",
    title: "Panel casts",
    copy: "Audio panels recorded inside the community: level-tagged commentary tracks you can overlay on an episode without spoiling yourself.",
    state: "next" as const,
  },
];

export default async function StreamingPage() {
  await ensureSeeded();
  const user = await getCurrentUser();

  let queued: { count: number }[] = [{ count: 142 }];
  let planned: any[] = [];
  let latestSignups: any[] = [];

  try {
    const res = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(streamWaitlist),
      db
        .select({ name: titles.name, slug: titles.slug, accent: titles.accent, format: titles.format })
        .from(titles)
        .where(eq(titles.streamingPlanned, true))
        .orderBy(desc(titles.popularity))
        .limit(6),
      db
        .select({ region: streamWaitlist.region, interest: streamWaitlist.interest })
        .from(streamWaitlist)
        .orderBy(desc(streamWaitlist.createdAt))
        .limit(6),
    ]);
    [queued, planned, latestSignups] = res;
  } catch (err) {
    const { seedTitles } = await import("@/lib/seed-data");
    planned = seedTitles
      .filter((t) => t.streamingPlanned)
      .slice(0, 6)
      .map((t) => ({ name: t.name, slug: t.slug, accent: t.accent, format: t.format }));
    latestSignups = [
      { region: "North America", interest: "anime" },
      { region: "Europe", interest: "manga" },
      { region: "East Asia", interest: "all" },
    ];
  }

  const queueCount = queued[0]?.count ?? 0;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 grayscale"
          style={{ backgroundImage: "url(/images/streaming-ink.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
        <div className="tex-scan absolute inset-0 opacity-40" />
        <div className="grain absolute inset-0" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mono flex items-center gap-3 text-[9px] text-mute">
            <span className="h-2 w-2 bg-paper pulse-line" />
            planned feature · not yet live
          </div>
          <h1 className="display mt-6 text-[13vw] leading-[0.86] text-paper sm:text-[7rem]">
            ZeroPanel
            <br />
            Stream
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-dim">
            Streaming is the next panel of the verse — a player built for the same black-and-white
            cinema the archive already lives in. While licences and infrastructure are locked in,
            the archive keeps growing, and your panel list carries straight over.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="panel glass flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-end lg:gap-8">
              <div>
                <div className="mono text-[9px] text-mute">join the launch list</div>
                <div className="display mt-2 text-4xl text-paper">
                  {queueCount}
                  <span className="text-mute"> viewers</span>
                </div>
              </div>
              <div className="lg:min-w-[560px]">
                <WaitlistForm defaultEmail={user?.email} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mono text-[9px] text-mute">the roadmap</div>
        <h2 className="display mt-3 text-3xl text-paper sm:text-4xl">Four panels to launch</h2>

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {PHASES.map((phase, index) => (
            <div
              key={phase.title}
              className={`panel grain flex flex-col gap-4 p-6 ${
                phase.state === "active" ? "border-paper" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="mono text-[8px] text-mute">{phase.tag}</span>
                <span
                  className={`h-2 w-2 ${
                    phase.state === "done"
                      ? "bg-paper"
                      : phase.state === "active"
                        ? "bg-paper pulse-line"
                        : "border border-line"
                  }`}
                />
              </div>
              <h3 className="display text-2xl text-paper">{phase.title}</h3>
              <p className="text-[13px] leading-relaxed text-dim">{phase.copy}</p>
              <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
                <span className="mono text-[8px] text-mute">0{index + 1}</span>
                <span className="h-px flex-1 bg-line" />
                <span className="mono text-[8px] text-mute">
                  {phase.state === "done" ? "shipped" : phase.state === "active" ? "in build" : "queued"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink-soft">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="mono text-[9px] text-mute">planned catalogue</div>
            <h2 className="display mt-3 text-3xl text-paper sm:text-4xl">Titles slated for the player</h2>
            <p className="mt-4 max-w-lg text-[13.5px] leading-relaxed text-dim">
              These panels are flagged for streaming at launch. Everything else stays readable in
              the archive with full guides and community discussion.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {planned.map((item) => (
                <Link
                  key={item.slug}
                  href={`/title/${item.slug}`}
                  className="flex items-center justify-between gap-3 border border-line px-4 py-3 transition-colors hover:border-paper"
                >
                  <span className="text-[13.5px] text-paper">{item.name}</span>
                  <span className="mono text-[8px]" style={{ color: item.accent }}>
                    {item.format} · queued
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mono text-[9px] text-mute">who is waiting</div>
            <h2 className="display mt-3 text-3xl text-paper sm:text-4xl">Latest sign-ups</h2>
            <div className="panel grain mt-6 p-5">
              {latestSignups.length === 0 ? (
                <p className="text-[13px] text-dim">
                  Nobody on the list yet — be the first panelist in the queue.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {latestSignups.map((signup, index) => (
                    <div
                      key={`${signup.region}-${index}`}
                      className="flex items-center justify-between border-b border-line pb-2"
                    >
                      <span className="mono text-[9px] text-mute">{signup.region}</span>
                      <span className="mono text-[9px] text-paper">wants {signup.interest}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mono mt-5 text-[9px] text-mute">
                {queueCount} total · regional rollout order decided by demand
              </p>
            </div>

            <div className="panel grain mt-4 p-5">
              <h3 className="mono mb-3 text-[9px] text-mute">While you wait</h3>
              <ul className="flex flex-col gap-2 text-[13px] text-dim">
                <li>
                  <Link href="/library" className="hover:text-paper">
                    → Build your panel list in the archive
                  </Link>
                </li>
                <li>
                  <Link href="/panels" className="hover:text-paper">
                    → Read community takes before you commit
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-paper">
                    → Create an account to keep your list
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
