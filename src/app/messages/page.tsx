import Link from "next/link";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { titles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/db-init";
import { Messenger } from "@/components/Messenger";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Direct Messages — ZeroPanelVerse",
  description: "Connect and chat with other anime and manga panelists in real time.",
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  await ensureSeeded();
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="panel grain p-8 sm:p-12">
          <div className="display mx-auto grid h-20 w-20 place-items-center rounded-full border border-line bg-black/40 text-4xl">
            ✈️
          </div>
          <h1 className="display mt-6 text-3xl text-paper">Direct Messages</h1>
          <p className="mt-3 text-sm leading-relaxed text-dim">
            Connect directly with fellow readers, debate controversial panels, share spoiler-safe
            routes, and recommend titles in real-time.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login?next=/messages"
              className="mono rounded bg-paper px-6 py-2.5 text-xs font-semibold text-ink transition-opacity hover:opacity-85"
            >
              Log in to Chat
            </Link>
            <Link
              href="/signup?next=/messages"
              className="mono rounded border border-line px-6 py-2.5 text-xs text-paper transition-colors hover:border-paper"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-8 border-t border-line/60 pt-6">
            <p className="mono text-[10px] text-mute">
              Demo accounts available:{" "}
              <Link href="/login" className="text-paper underline">
                panelnewbie
              </Link>
              ,{" "}
              <Link href="/login" className="text-paper underline">
                midwatch_mira
              </Link>
              ,{" "}
              <Link href="/login" className="text-paper underline">
                archivist_k
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const titleRows = await db
    .select({
      slug: titles.slug,
      name: titles.name,
      format: titles.format,
      accent: titles.accent,
    })
    .from(titles)
    .orderBy(asc(titles.name));

  return (
    <Messenger
      currentUser={user}
      initialWithUsername={params.with}
      availableTitles={titleRows}
    />
  );
}
