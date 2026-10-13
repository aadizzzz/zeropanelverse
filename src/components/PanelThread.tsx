"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import type { ExperienceLevel, PanelKind, PanelRoom, SpoilerGrade } from "@/db/schema";
import {
  createPanelAction,
  deletePanelAction,
  setLensAction,
  votePanelAction,
  type ActionState,
} from "@/lib/actions";
import { LEVEL_NAMES, type Lens } from "@/lib/lens-shared";
import { SpoilerVeil } from "@/components/SpoilerVeil";

export type PanelItem = {
  id: number;
  room: PanelRoom;
  kind: PanelKind;
  authorLevel: ExperienceLevel;
  rating: number;
  headline: string;
  body: string;
  spoilerGrade: SpoilerGrade;
  veiled: boolean;
  createdAt: string;
  authorName: string;
  authorUsername: string;
  authorGlyph: string;
  score: number;
  mine: boolean;
};

const KIND_LABEL: Record<PanelKind, string> = {
  review: "Review",
  view: "Point of view",
  suggestion: "Suggestion",
};

const LEVEL_STYLE: Record<ExperienceLevel, string> = {
  beginner: "border-dashed border-paper/40 text-dim",
  mediocre: "border-paper/50 text-paper",
  elite: "border-paper bg-paper text-ink",
};

const EMPTY: ActionState = { ok: false };

export function PanelThread({
  titleId,
  items,
  signedIn,
  viewerLevel,
  lens,
  openAccess,
  openTotal,
}: {
  titleId: number;
  items: PanelItem[];
  signedIn: boolean;
  viewerLevel: ExperienceLevel | null;
  lens: Lens;
  openAccess: boolean;
  openTotal: number;
}) {
  const router = useRouter();
  const [room, setRoom] = useState<PanelRoom>(lens.level === "beginner" ? "lounge" : "open");
  const [filter, setFilter] = useState<PanelKind | "all">("all");
  const canUseOpen = viewerLevel !== null && viewerLevel !== "beginner";
  const [composerRoom, setComposerRoom] = useState<PanelRoom>(canUseOpen ? "open" : "lounge");
  const [state, formAction, pending] = useActionState(createPanelAction, EMPTY);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [busy, startBusy] = useTransition();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  const loungeItems = items.filter((item) => item.room === "lounge");
  const roomItems = items.filter((item) => item.room === room);
  const visible = filter === "all" ? roomItems : roomItems.filter((item) => item.kind === filter);
  const loungeCount = loungeItems.length;

  function vote(panelId: number, value: 1 | -1) {
    startBusy(async () => {
      const result = await votePanelAction(panelId, value);
      if (result.ok) setVotes((prev) => ({ ...prev, [panelId]: result.score }));
      else router.push("/login");
    });
  }

  function enterOpen() {
    startBusy(async () => {
      await setLensAction(lens.level, "full");
      setRoom("open");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="display text-2xl text-paper">The Panel</h2>
        <p className="mono mt-1 text-[9px] text-mute">
          two rooms · one safe for newcomers, one with no boundaries
        </p>
      </div>

      {/* rooms */}
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            {
              key: "lounge" as const,
              title: "Beginner Lounge",
              copy: "Spoiler-safe. Everyone can read and post, but nothing here may spoil.",
              count: loungeCount,
            },
            {
              key: "open" as const,
              title: "Open Floor",
              copy: "Mediocre and Elite. No boundaries: spoilers, theories and hot takes are all welcome.",
              count: openTotal,
            },
          ]
        ).map((item) => {
          const on = room === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setRoom(item.key)}
              className={`panel panel-hover p-4 text-left ${on ? "border-paper bg-white/5" : ""}`}
            >
              <span className="flex items-center justify-between">
                <span className="display text-lg text-paper">{item.title}</span>
                <span className="mono text-[9px] text-mute">{item.count} entries</span>
              </span>
              <span className="mt-2 block text-[12.5px] leading-relaxed text-dim">{item.copy}</span>
            </button>
          );
        })}
      </div>

      {/* composer */}
      <div className="panel grain p-5 sm:p-6">
        {signedIn ? (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="titleId" value={titleId} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="mono text-[9px] text-mute">
                Posting as{" "}
                <span className="accent-text">{viewerLevel ? LEVEL_NAMES[viewerLevel] : "Beginner"}</span>{" "}
                panelist
              </span>
              <label className="mono flex items-center gap-2 text-[9px] text-mute">
                Room
                <select
                  className="field !w-auto !py-1.5"
                  name="room"
                  value={composerRoom}
                  onChange={(event) => setComposerRoom(event.target.value as PanelRoom)}
                >
                  <option value="lounge">Beginner Lounge (spoiler-safe)</option>
                  {canUseOpen ? <option value="open">Open Floor (no boundaries)</option> : null}
                </select>
              </label>
            </div>

            {composerRoom === "open" ? (
              <p className="mono border border-paper/30 px-3 py-2 text-[9px] leading-relaxed text-dim">
                Open Floor: no boundaries. Say anything about the story, ending or theory. Tag the
                spoiler grade so readers who have hidden spoilers can choose to reveal it.
              </p>
            ) : (
              <p className="mono border border-line px-3 py-2 text-[9px] leading-relaxed text-mute">
                Lounge: keep it spoiler-safe for newcomers.{" "}
                {canUseOpen
                  ? "Switch the room to Open Floor to talk freely."
                  : "Mediocre and Elite members can post on the Open Floor."}
              </p>
            )}

            <div
              className={`grid gap-3 ${
                composerRoom === "open" ? "sm:grid-cols-[1fr_140px_130px_130px]" : "sm:grid-cols-[1fr_150px_150px]"
              }`}
            >
              <input
                className="field"
                name="headline"
                placeholder="Headline — e.g. 'Start here if you have never read a manhwa'"
                maxLength={160}
                required
              />
              <select className="field" name="kind" defaultValue="review">
                <option value="review">Review</option>
                <option value="view">Point of view</option>
                <option value="suggestion">Suggestion</option>
              </select>
              <select className="field" name="rating" defaultValue="8">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    Score {n}/10
                  </option>
                ))}
              </select>
              {composerRoom === "open" ? (
                <select className="field" name="spoilerGrade" defaultValue="mild">
                  <option value="none">No spoilers</option>
                  <option value="mild">Mild spoilers</option>
                  <option value="heavy">Heavy spoilers</option>
                </select>
              ) : null}
            </div>

            <textarea
              className="field min-h-[120px] resize-y"
              name="body"
              placeholder={
                composerRoom === "open"
                  ? "Break it down — endings, theories, adaptation changes, anything…"
                  : "Share your read on the story, who you would recommend it to, and what to watch out for…"
              }
              required
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="mono bg-paper px-5 py-2.5 text-[10px] text-ink transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {pending ? "Posting…" : composerRoom === "open" ? "Post to Open Floor" : "Post to Lounge"}
              </button>
            </div>

            {state.error ? (
              <p className="mono border border-paper/40 px-3 py-2 text-[10px] text-paper">{state.error}</p>
            ) : null}
            {state.ok && state.message ? (
              <p className="mono border accent-border px-3 py-2 text-[10px] accent-text">{state.message}</p>
            ) : null}
          </form>
        ) : (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="display text-lg text-paper">Add your point of view</h3>
              <p className="mt-1 text-[13px] text-dim">
                Create a free account to review, debate and suggest titles to other viewers.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/login"
                className="mono border border-line px-4 py-2.5 text-[10px] text-dim hover:border-paper hover:text-paper"
              >
                Log in
              </Link>
              <Link href="/signup" className="mono bg-paper px-4 py-2.5 text-[10px] text-ink hover:opacity-80">
                Join the verse
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* kind filter */}
      <div className="flex flex-wrap gap-1.5">
        {(["all", "review", "view", "suggestion"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`mono border px-2.5 py-1.5 text-[9px] transition-colors ${
              filter === key
                ? "border-paper bg-paper text-ink"
                : "border-line text-mute hover:border-paper hover:text-paper"
            }`}
          >
            {key === "all" ? "All" : KIND_LABEL[key]}
          </button>
        ))}
      </div>

      {/* thread */}
      {room === "open" && !openAccess ? (
        <div className="panel grain flex flex-col items-start gap-4 p-6 sm:p-8">
          <span className="mono border border-dashed border-paper/40 px-2.5 py-1 text-[9px] text-paper">
            {openTotal} entries inside
          </span>
          <h3 className="display text-2xl text-paper">The Open Floor has no spoiler boundaries</h3>
          <p className="max-w-xl text-[13.5px] leading-relaxed text-dim">
            Mediocre and Elite panelists talk about endings, theories and twists here without
            filters. Because you are reading as a Beginner with spoilers hidden, the room is closed.
            It is your choice: turn spoilers on and walk in, or stay in the Lounge.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={enterOpen}
              className="mono bg-paper px-5 py-2.5 text-[10px] text-ink hover:opacity-80 disabled:opacity-50"
            >
              I want spoilers · enter
            </button>
            <button
              type="button"
              onClick={() => setRoom("lounge")}
              className="mono border border-line px-5 py-2.5 text-[10px] text-dim hover:border-paper hover:text-paper"
            >
              Stay in the Lounge
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.length === 0 ? (
            <div className="panel p-8 text-center">
              <p className="mono text-[10px] text-mute">No entries in this room yet.</p>
            </div>
          ) : null}

          {visible.map((item) => {
            const score = votes[item.id] ?? item.score;
            return (
              <article key={item.id} className="panel grain flex flex-col gap-4 p-5 sm:flex-row sm:p-6">
                <div className="flex shrink-0 items-start gap-3 sm:flex-col sm:items-center">
                  <span className="display grid h-12 w-12 place-items-center border border-line bg-ink-raise text-lg text-paper">
                    {item.authorGlyph}
                  </span>
                  <span className={`mono border px-2 py-1 text-[8px] ${LEVEL_STYLE[item.authorLevel]}`}>
                    {item.authorLevel}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link href={`/u/${item.authorUsername}`} className="text-sm text-paper hover:underline">
                      {item.authorName}
                    </Link>
                    <span className="mono text-[8px] text-mute">@{item.authorUsername}</span>
                    <span className="mono border border-line px-1.5 py-0.5 text-[8px] text-mute">
                      {KIND_LABEL[item.kind]}
                    </span>
                    {item.spoilerGrade === "none" ? null : (
                      <span className="mono border border-paper/60 px-1.5 py-0.5 text-[8px] text-paper">
                        {item.spoilerGrade} spoilers
                      </span>
                    )}
                    <span className="mono text-[8px] text-mute">{item.createdAt}</span>
                    <span className="mono ml-auto text-[10px] accent-text">
                      {item.rating > 0 ? `${item.rating.toFixed(1)}/10` : "—"}
                    </span>
                  </div>

                  <SpoilerVeil
                    panelId={item.id}
                    grade={item.spoilerGrade}
                    veiled={item.veiled}
                    headline={item.headline}
                    body={item.body}
                    headlineClassName="display mt-3 text-lg leading-tight text-paper"
                    bodyClassName="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-dim"
                  />

                  <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => vote(item.id, 1)}
                        disabled={busy}
                        className="mono border border-line px-2 py-1.5 text-[10px] text-dim transition-colors hover:border-paper hover:text-paper disabled:opacity-40"
                        aria-label="Upvote"
                      >
                        ▲
                      </button>
                      <span className="mono w-8 text-center text-[11px] accent-text">{score}</span>
                      <button
                        type="button"
                        onClick={() => vote(item.id, -1)}
                        disabled={busy}
                        className="mono border border-line px-2 py-1.5 text-[10px] text-dim transition-colors hover:border-paper hover:text-paper disabled:opacity-40"
                        aria-label="Downvote"
                      >
                        ▼
                      </button>
                    </div>
                    {item.mine ? (
                      <button
                        type="button"
                        onClick={() =>
                          startBusy(async () => {
                            await deletePanelAction(item.id);
                            router.refresh();
                          })
                        }
                        className="mono text-[9px] text-mute hover:text-paper"
                      >
                        delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
