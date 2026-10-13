import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { panels, titles, users } from "@/db/schema";
import { AuthPanel } from "@/components/AuthPanel";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign up — ZeroPanelVerse",
};

export default async function SignupPage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (user) redirect("/profile");

  const [userCount, titleCount, panelCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(titles),
    db.select({ count: sql<number>`count(*)::int` }).from(panels),
  ]);

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
      <section className="panel grain order-2 p-6 sm:p-10 lg:order-1">
        <Link href="/" className="mono text-[9px] text-mute hover:text-paper">
          ← back to the archive
        </Link>
        <h1 className="display mt-6 text-4xl text-paper sm:text-5xl">Create your panel</h1>
        <p className="mono mt-3 text-[9px] text-mute">
          free · no email verification · instant access
        </p>
        <div className="mt-8">
          <AuthPanel mode="signup" />
        </div>
      </section>

      <section className="relative order-1 overflow-hidden border border-line lg:order-2">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 grayscale"
          style={{ backgroundImage: "url(/images/hero-ink.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-tl from-ink via-ink/85 to-ink" />
        <div className="grain tex-scan absolute inset-0 opacity-60" />
        <div className="relative flex flex-col gap-8 p-8 sm:p-10">
          <div className="mono flex items-center gap-3 text-[9px] text-mute">
            <span className="h-px w-10 bg-paper/40" />
            join the verse
          </div>
          <h2 className="display text-4xl leading-[0.9] text-paper sm:text-5xl">
            Pick the level
            <br />
            you actually
            <br />
            read at
          </h2>
          <p className="max-w-md text-[14px] leading-relaxed text-dim">
            Be honest about it. The archive uses your level to surface the right version of every
            guide, and the community panels show which reading a take is coming from — a
            beginner&apos;s spoiler-free route and an elite&apos;s thesis are both useful, in
            different ways.
          </p>
          <dl className="grid grid-cols-3 gap-px border border-line bg-line">
            {[
              { label: "Panelists", value: userCount[0]?.count ?? 0 },
              { label: "Titles", value: titleCount[0]?.count ?? 0 },
              { label: "Entries", value: panelCount[0]?.count ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="bg-ink-soft px-4 py-5">
                <dt className="mono text-[8px] text-mute">{stat.label}</dt>
                <dd className="display mt-1.5 text-3xl text-paper">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
