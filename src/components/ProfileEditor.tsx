"use client";

import { useActionState } from "react";
import { updateProfileAction, type ActionState } from "@/lib/actions";
import type { ExperienceLevel } from "@/db/schema";
import type { SessionUser } from "@/lib/auth";

const EMPTY: ActionState = { ok: false };

const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "mediocre", label: "Mediocre" },
  { value: "elite", label: "Elite" },
];

export function ProfileEditor({ user }: { user: SessionUser }) {
  const [state, action, pending] = useActionState(updateProfileAction, EMPTY);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mono mb-1.5 block text-[9px] text-mute">Display name</label>
          <input className="field" name="displayName" defaultValue={user.displayName} />
        </div>
        <div>
          <label className="mono mb-1.5 block text-[9px] text-mute">Panel glyph (1-2 chars)</label>
          <input className="field" name="avatarGlyph" defaultValue={user.avatarGlyph} maxLength={2} />
        </div>
      </div>

      <div>
        <label className="mono mb-1.5 block text-[9px] text-mute">Audience level</label>
        <select className="field" name="experienceLevel" defaultValue={user.experienceLevel}>
          {LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mono mb-1.5 block text-[9px] text-mute">Spoilers</label>
        <select className="field" name="spoilerMode" defaultValue={user.spoilerMode}>
          <option value="safe">Hidden: spoiler notes stay closed</option>
          <option value="mild">Mild only (Mediocre)</option>
          <option value="full">Show all: spoilers open</option>
        </select>
        <p className="mono mt-1.5 text-[8px] leading-relaxed text-mute">
          Beginners choose hidden or show all, Mediocre can pick any, and Elite is always open.
        </p>
      </div>

      <div>
        <label className="mono mb-1.5 block text-[9px] text-mute">Bio</label>
        <textarea
          className="field min-h-[110px] resize-y"
          name="bio"
          defaultValue={user.bio}
          placeholder="What do you watch, read, and argue about?"
          maxLength={600}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="mono bg-paper px-5 py-2.5 text-[10px] text-ink hover:opacity-80 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save panel"}
        </button>
        {state.message ? (
          <span className="mono text-[10px] accent-text">{state.message}</span>
        ) : null}
        {state.error ? <span className="mono text-[10px] text-paper">{state.error}</span> : null}
      </div>
    </form>
  );
}
