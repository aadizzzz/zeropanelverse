import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/AuthPanel";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Log in — ZeroPanelVerse",
};

export default async function LoginPage() {
  try {
    await ensureSeeded();
  } catch {}
  const user = await getCurrentUser();
  if (user) redirect("/profile");

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
      <section className="relative hidden overflow-hidden border border-line lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 grayscale"
          style={{ backgroundImage: "url(/images/hero-ink.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/80 to-ink" />
        <div className="grain tex-ink absolute inset-0 opacity-70" />
        <div className="relative flex h-full flex-col justify-between gap-10 p-10">
          <div className="mono flex items-center gap-3 text-[9px] text-mute">
            <span className="h-px w-10 bg-paper/40" />
            panel access
          </div>
          <div>
            <h2 className="display text-5xl leading-[0.9] text-paper">
              Welcome back
              <br />
              to the verse
            </h2>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-dim">
              Your panel list, your audience level and every take you have posted stays exactly
              where you left it. The archive remembers whether you read as a beginner, a mediocre or
              an elite.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {[
              "Track anime, manga and manhwa in one panel list",
              "Post reviews, points of view and suggestions",
              "See the archive through your own audience level",
            ].map((line) => (
              <li key={line} className="flex items-center gap-3 text-[13px] text-dim">
                <span className="h-px w-6 bg-paper/40" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel grain p-6 sm:p-10">
        <Link href="/" className="mono text-[9px] text-mute hover:text-paper">
          ← back to the archive
        </Link>
        <h1 className="display mt-6 text-4xl text-paper sm:text-5xl">Log in</h1>
        <p className="mono mt-3 text-[9px] text-mute">
          enter your panel — sessions last 30 days
        </p>
        <div className="mt-8">
          <AuthPanel mode="login" />
        </div>
      </section>
    </div>
  );
}
