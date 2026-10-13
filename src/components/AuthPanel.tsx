"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction, type ActionState } from "@/lib/actions";
import type { ExperienceLevel } from "@/db/schema";

const EMPTY: ActionState = { ok: false };

const LEVEL_OPTIONS: { value: ExperienceLevel; title: string; copy: string }[] = [
  {
    value: "beginner",
    title: "Beginner",
    copy: "New to anime or manga. Wants clear entry points and zero homework.",
  },
  {
    value: "mediocre",
    title: "Mediocre",
    copy: "A hundred titles in. Reads subtext, cares about pacing and adaptation quality.",
  },
  {
    value: "elite",
    title: "Elite",
    copy: "Five hundred deep. Wants authorial intent, paneling breakdowns and the thesis.",
  },
];

export function AuthPanel({ mode }: { mode: "login" | "signup" }) {
  const [loginState, loginSubmit, loginPending] = useActionState(loginAction, EMPTY);
  const [signupState, signupSubmit, signupPending] = useActionState(signupAction, EMPTY);

  if (mode === "login") {
    return (
      <form action={loginSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mono mb-1.5 block text-[9px] text-mute">Username or email</label>
          <input className="field" name="identifier" placeholder="panelnewbie" required />
        </div>
        <div>
          <label className="mono mb-1.5 block text-[9px] text-mute">Password</label>
          <input className="field" name="password" type="password" placeholder="••••••••" required />
        </div>
        {loginState.error ? (
          <p className="mono border border-paper/40 px-3 py-2 text-[10px] text-paper">
            {loginState.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loginPending}
          className="mono bg-paper px-5 py-3 text-[11px] text-ink transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {loginPending ? "Opening panel…" : "Enter the verse"}
        </button>
        <p className="mono text-[9px] leading-relaxed text-mute">
          Demo panelists — <span className="text-dim">panelnewbie</span> /{" "}
          <span className="text-dim">midwatch_mira</span> /{" "}
          <span className="text-dim">archivist_k</span>, password{" "}
          <span className="text-dim">zeropanelverse</span>
        </p>
        <p className="text-[13px] text-dim">
          No account yet?{" "}
          <Link href="/signup" className="accent-text underline">
            Create one free
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form action={signupSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mono mb-1.5 block text-[9px] text-mute">Display name</label>
          <input className="field" name="displayName" placeholder="Rin" required />
        </div>
        <div>
          <label className="mono mb-1.5 block text-[9px] text-mute">Username</label>
          <input className="field" name="username" placeholder="panelnewbie" required />
        </div>
      </div>
      <div>
        <label className="mono mb-1.5 block text-[9px] text-mute">Email</label>
        <input className="field" name="email" type="email" placeholder="you@email.com" required />
      </div>
      <div>
        <label className="mono mb-1.5 block text-[9px] text-mute">Password</label>
        <input
          className="field"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
        />
      </div>

      <div>
        <span className="mono mb-2 block text-[9px] text-mute">Your audience level</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {LEVEL_OPTIONS.map((option, index) => (
            <label
              key={option.value}
              className="cursor-pointer border border-line p-3 transition-colors hover:border-paper has-[:checked]:border-paper has-[:checked]:bg-white/5"
            >
              <input
                type="radio"
                name="experienceLevel"
                value={option.value}
                defaultChecked={index === 0}
                className="sr-only"
              />
              <span className="display block text-sm text-paper">{option.title}</span>
              <span className="mt-1 block text-[11px] leading-snug text-mute">{option.copy}</span>
            </label>
          ))}
        </div>
      </div>

      {signupState.error ? (
        <p className="mono border border-paper/40 px-3 py-2 text-[10px] text-paper">
          {signupState.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={signupPending}
        className="mono bg-paper px-5 py-3 text-[11px] text-ink transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {signupPending ? "Creating panel…" : "Create my panel"}
      </button>
      <p className="text-[13px] text-dim">
        Already registered?{" "}
        <Link href="/login" className="accent-text underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
