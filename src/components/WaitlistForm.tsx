"use client";

import Link from "next/link";
import { useActionState } from "react";
import { joinWaitlistAction, type ActionState } from "@/lib/actions";

const EMPTY: ActionState = { ok: false };

export function WaitlistForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState(joinWaitlistAction, EMPTY);

  return (
    <div className="flex flex-col gap-3">
      <form id="waitlist-form" action={action} className="grid gap-2 sm:grid-cols-[1fr_140px_130px_auto]">
        <input
          className="field"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          placeholder="your@email.com"
          required
        />
        <select className="field" name="interest" defaultValue="anime">
          <option value="anime">Anime</option>
          <option value="manga">Manga</option>
          <option value="manhwa">Manhwa</option>
          <option value="everything">Everything</option>
        </select>
        <select className="field" name="region" defaultValue="Global">
          <option value="Global">Global</option>
          <option value="India">India</option>
          <option value="North America">North America</option>
          <option value="Europe">Europe</option>
          <option value="SEA">South East Asia</option>
          <option value="LATAM">LATAM</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="mono bg-paper px-5 py-2.5 text-[10px] text-ink hover:opacity-80 disabled:opacity-50"
        >
          {pending ? "…" : "Notify me"}
        </button>
      </form>
      {state.error ? <p className="mono text-[10px] text-paper">{state.error}</p> : null}
      {state.ok && state.message ? (
        <p className="mono border accent-border px-3 py-2 text-[10px] accent-text">{state.message}</p>
      ) : null}
      <p className="mono text-[9px] text-mute">
        No spam — one email when the ZeroPanelVerse player goes live.{" "}
        <Link href="/library" className="underline hover:text-paper">
          Browse the archive meanwhile
        </Link>
      </p>
    </div>
  );
}
