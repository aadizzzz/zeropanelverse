"use client";

import { useState } from "react";
import Link from "next/link";

type PanelEntry = {
  id: number;
  headline: string;
  body: string;
  kind: string;
  rating: number;
  authorLevel: string;
  createdAt: Date;
  slug: string;
  titleName: string;
  accent: string;
  accentSoft?: string;
  glyph?: string;
  format?: string;
  year?: number;
};

type WatchlistItem = {
  slug: string;
  name: string;
  accent: string;
  glyph: string;
  format: string;
  status: string;
  accentSoft?: string;
  year?: number;
};

type FollowerUser = {
  id: number;
  username: string;
  displayName: string;
  experienceLevel: string;
  avatarGlyph: string;
};

export function ProfileFeedTabs({
  entries,
  watchlistItems,
  followers,
  following,
}: {
  entries: PanelEntry[];
  watchlistItems: WatchlistItem[];
  followers: FollowerUser[];
  following: FollowerUser[];
}) {
  const [activeTab, setActiveTab] = useState<"posts" | "watchlist" | "followers" | "following">("posts");

  return (
    <div>
      {/* Tabs Bar with smooth horizontal scrolling on mobile */}
      <div className="flex border-b border-line overflow-x-auto scrollbar-none whitespace-nowrap gap-1 sm:gap-2 px-1">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`inline-flex shrink-0 items-center gap-1.5 sm:gap-2 border-b-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium transition-colors ${
            activeTab === "posts"
              ? "border-paper text-paper font-semibold"
              : "border-transparent text-dim hover:text-paper"
          }`}
        >
          <span>📝 Posts & Reviews</span>
          <span className="mono rounded-full bg-white/10 px-2 py-0.5 text-[9px]">
            {entries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("watchlist")}
          className={`inline-flex shrink-0 items-center gap-1.5 sm:gap-2 border-b-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium transition-colors ${
            activeTab === "watchlist"
              ? "border-paper text-paper font-semibold"
              : "border-transparent text-dim hover:text-paper"
          }`}
        >
          <span>📑 Watchlist</span>
          <span className="mono rounded-full bg-white/10 px-2 py-0.5 text-[9px]">
            {watchlistItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("followers")}
          className={`inline-flex shrink-0 items-center gap-1.5 sm:gap-2 border-b-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium transition-colors ${
            activeTab === "followers"
              ? "border-paper text-paper font-semibold"
              : "border-transparent text-dim hover:text-paper"
          }`}
        >
          <span>👥 Followers</span>
          <span className="mono rounded-full bg-white/10 px-2 py-0.5 text-[9px]">
            {followers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("following")}
          className={`inline-flex shrink-0 items-center gap-1.5 sm:gap-2 border-b-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium transition-colors ${
            activeTab === "following"
              ? "border-paper text-paper font-semibold"
              : "border-transparent text-dim hover:text-paper"
          }`}
        >
          <span>✨ Following</span>
          <span className="mono rounded-full bg-white/10 px-2 py-0.5 text-[9px]">
            {following.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Posts & Reviews */}
        {activeTab === "posts" && (
          <div className="flex flex-col gap-4">
            {entries.length === 0 ? (
              <div className="panel p-8 sm:p-12 text-center">
                <p className="text-sm text-dim">This panelist has not published any entries yet.</p>
              </div>
            ) : (
              entries.map((entry) => (
                <article
                  key={entry.id}
                  className="panel panel-hover p-4 sm:p-6"
                  style={{ ["--accent" as string]: entry.accent }}
                >
                  <div className="mono flex flex-wrap items-center gap-2 text-[9px] text-mute">
                    <span className="border border-line px-2 py-0.5 uppercase tracking-wider text-paper">
                      {entry.kind}
                    </span>
                    <span className="capitalize">{entry.authorLevel} Take</span>
                    <span>·</span>
                    <span>{new Date(entry.createdAt).toLocaleDateString("en-GB")}</span>
                    <span className="ml-auto text-xs font-bold accent-text">
                      {entry.rating > 0 ? `${entry.rating.toFixed(1)}/10` : "—"}
                    </span>
                  </div>

                  <h3 className="display mt-3 text-lg sm:text-xl leading-tight text-paper">
                    {entry.headline}
                  </h3>
                  <p className="mt-2.5 text-[13px] sm:text-[13.5px] leading-relaxed text-dim whitespace-pre-wrap">
                    {entry.body}
                  </p>

                  {/* Anime Poster Card attached to review */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
                    <Link
                      href={`/title/${entry.slug}`}
                      className="group/link flex items-center gap-3 rounded-lg border border-line bg-black/40 p-2 pr-3.5 transition-colors hover:border-paper hover:bg-black/60"
                    >
                      <span
                        className="display grid h-9 w-9 shrink-0 place-items-center rounded border text-sm font-bold shadow-sm"
                        style={{
                          borderColor: entry.accent || "var(--color-line)",
                          color: entry.accent || "#fff",
                        }}
                      >
                        {entry.glyph || entry.titleName.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <span className="display block text-xs text-paper group-hover/link:underline truncate max-w-[200px] sm:max-w-xs">
                          {entry.titleName}
                        </span>
                        <span className="mono text-[8px] uppercase text-mute">
                          {entry.format || "Anime"} {entry.year ? `· ${entry.year}` : ""}
                        </span>
                      </div>
                    </Link>

                    <Link
                      href={`/title/${entry.slug}`}
                      className="mono text-[10px] text-paper hover:underline"
                    >
                      Open Guide →
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {/* Watchlist */}
        {activeTab === "watchlist" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {watchlistItems.length === 0 ? (
              <div className="panel col-span-2 p-8 sm:p-12 text-center text-sm text-dim">
                No titles in watchlist yet.
              </div>
            ) : (
              watchlistItems.map((item) => (
                <Link
                  key={`${item.slug}-${item.status}`}
                  href={`/title/${item.slug}`}
                  className="panel panel-hover flex items-center gap-3.5 p-3.5 sm:p-4"
                >
                  <span
                    className="display grid h-12 w-12 shrink-0 place-items-center rounded border border-line bg-black/40 text-xl font-bold shadow"
                    style={{ borderColor: item.accent, color: item.accent }}
                  >
                    {item.glyph}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-paper">{item.name}</h4>
                    <div className="mono mt-1 flex items-center gap-2 text-[9px] text-mute">
                      <span className="uppercase">{item.format}</span>
                      {item.year ? (
                        <>
                          <span>·</span>
                          <span>{item.year}</span>
                        </>
                      ) : null}
                      <span>·</span>
                      <span className="capitalize text-dim">{item.status}</span>
                    </div>
                  </div>
                  <span className="mono text-xs text-mute">→</span>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Followers */}
        {activeTab === "followers" && (
          <div className="space-y-3">
            {followers.length === 0 ? (
              <div className="panel p-8 sm:p-12 text-center text-sm text-dim">
                No followers yet. Be the first to follow!
              </div>
            ) : (
              followers.map((u) => (
                <div
                  key={u.id}
                  className="panel flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 transition-colors hover:border-paper/40"
                >
                  <Link
                    href={`/u/${u.username}`}
                    className="flex items-center gap-3 hover:opacity-85"
                  >
                    <span className="display grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-black/60 text-sm font-bold text-paper">
                      {u.avatarGlyph}
                    </span>
                    <div>
                      <span className="display block text-sm font-semibold text-paper">
                        {u.displayName}
                      </span>
                      <span className="mono text-[10px] text-mute">@{u.username}</span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/messages?with=${u.username}`}
                      className="mono rounded border border-line bg-white/5 px-3 py-1.5 text-[10px] text-paper hover:border-paper hover:bg-white/10"
                    >
                      Message ✈️
                    </Link>
                    <Link
                      href={`/u/${u.username}`}
                      className="mono rounded bg-white/10 px-3 py-1.5 text-[10px] text-dim hover:text-paper"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Following */}
        {activeTab === "following" && (
          <div className="space-y-3">
            {following.length === 0 ? (
              <div className="panel p-8 sm:p-12 text-center text-sm text-dim">
                Not following any panelists yet.
              </div>
            ) : (
              following.map((u) => (
                <div
                  key={u.id}
                  className="panel flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 transition-colors hover:border-paper/40"
                >
                  <Link
                    href={`/u/${u.username}`}
                    className="flex items-center gap-3 hover:opacity-85"
                  >
                    <span className="display grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-black/60 text-sm font-bold text-paper">
                      {u.avatarGlyph}
                    </span>
                    <div>
                      <span className="display block text-sm font-semibold text-paper">
                        {u.displayName}
                      </span>
                      <span className="mono text-[10px] text-mute">@{u.username}</span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/messages?with=${u.username}`}
                      className="mono rounded border border-line bg-white/5 px-3 py-1.5 text-[10px] text-paper hover:border-paper hover:bg-white/10"
                    >
                      Message ✈️
                    </Link>
                    <Link
                      href={`/u/${u.username}`}
                      className="mono rounded bg-white/10 px-3 py-1.5 text-[10px] text-dim hover:text-paper"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
