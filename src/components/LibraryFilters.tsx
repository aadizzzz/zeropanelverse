"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export type LibraryQuery = {
  q: string;
  tab: "all" | "titles" | "users";
  format: string;
  genre: string;
  level: string;
  sort: string;
};

const FORMATS = [
  { value: "all", label: "All formats" },
  { value: "anime", label: "Anime" },
  { value: "manga", label: "Manga" },
  { value: "manhwa", label: "Manhwa" },
];

const TITLE_LEVELS = [
  { value: "all", label: "Any audience" },
  { value: "beginner", label: "Beginner friendly" },
  { value: "mediocre", label: "Mediocre" },
  { value: "elite", label: "Elite only" },
];

const USER_LEVELS = [
  { value: "all", label: "All panelist levels" },
  { value: "beginner", label: "Beginner panelists" },
  { value: "mediocre", label: "Mediocre panelists" },
  { value: "elite", label: "Elite panelists" },
];

const TITLE_SORTS = [
  { value: "popularity", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "az", label: "A → Z" },
];

const USER_SORTS = [
  { value: "popularity", label: "Most followed" },
  { value: "rating", label: "Most reviews" },
  { value: "az", label: "A → Z" },
];

export function LibraryFilters({
  query,
  genres,
  titleCount,
  userCount,
  formatCounts = { anime: 0, manga: 0, manhwa: 0 },
}: {
  query: LibraryQuery;
  genres: string[];
  titleCount: number;
  userCount: number;
  formatCounts?: { anime: number; manga: number; manhwa: number };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [searchInput, setSearchInput] = useState(query.q);

  const update = useCallback(
    (key: keyof LibraryQuery, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      router.push(`/library?${next.toString()}`);
    },
    [params, router],
  );

  const setTab = useCallback(
    (tab: "all" | "titles" | "users") => {
      const next = new URLSearchParams(params.toString());
      if (tab === "all") next.delete("tab");
      else next.set("tab", tab);
      router.push(`/library?${next.toString()}`);
    },
    [params, router],
  );

  const activeTab = query.tab || "all";

  return (
    <div className="panel grain flex flex-col gap-4 p-4 sm:p-5">
      {/* Category Tabs: All, Titles, Users */}
      <div className="flex items-center gap-2 border-b border-line pb-3 overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`mono shrink-0 rounded px-3.5 py-1.5 text-[10.5px] transition-all ${
            activeTab === "all"
              ? "bg-paper text-ink font-bold shadow"
              : "border border-line bg-white/[0.02] text-dim hover:border-paper/40 hover:text-paper"
          }`}
        >
          All Results
        </button>

        <button
          type="button"
          onClick={() => setTab("users")}
          className={`mono shrink-0 flex items-center gap-1.5 rounded px-3.5 py-1.5 text-[10.5px] transition-all ${
            activeTab === "users"
              ? "bg-paper text-ink font-bold shadow"
              : "border border-line bg-white/[0.02] text-dim hover:border-paper/40 hover:text-paper"
          }`}
        >
          <span>👥 Panelists & Users</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[9px] ${
              activeTab === "users" ? "bg-ink text-paper" : "bg-white/10 text-paper"
            }`}
          >
            {userCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("titles")}
          className={`mono shrink-0 flex items-center gap-1.5 rounded px-3.5 py-1.5 text-[10.5px] transition-all ${
            activeTab === "titles"
              ? "bg-paper text-ink font-bold shadow"
              : "border border-line bg-white/[0.02] text-dim hover:border-paper/40 hover:text-paper"
          }`}
        >
          <span>🎬 Titles</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[9px] ${
              activeTab === "titles" ? "bg-ink text-paper" : "bg-white/10 text-paper"
            }`}
          >
            {titleCount}
          </span>
        </button>
      </div>

      {/* Quick Format Pills with Realtime Counts */}
      {activeTab !== "users" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] scrollbar-none">
          <span className="mono text-mute mr-1 shrink-0 text-[9px] uppercase tracking-wider">Format:</span>
          {[
            {
              value: "all",
              label: "All",
              count: (formatCounts.anime || 0) + (formatCounts.manga || 0) + (formatCounts.manhwa || 0),
            },
            { value: "anime", label: "Anime", count: formatCounts.anime || 0 },
            { value: "manga", label: "Manga", count: formatCounts.manga || 0 },
            { value: "manhwa", label: "Manhwa", count: formatCounts.manhwa || 0 },
          ].map((f) => {
            const isSelected = (!query.format && f.value === "all") || query.format === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => update("format", f.value)}
                className={`mono shrink-0 flex items-center gap-1.5 rounded px-2.5 py-1 transition-all ${
                  isSelected
                    ? "bg-paper text-ink font-bold shadow-sm"
                    : "border border-line bg-white/[0.02] text-dim hover:border-paper/40 hover:text-paper"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[8.5px] ${
                    isSelected ? "bg-ink text-paper" : "bg-white/10 text-paper/80"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search Input Bar */}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          update("q", searchInput.trim());
        }}
      >
        <div className="relative flex-1">
          <input
            name="q"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search across thousands of animes, mangas, manhwas, or panelists (@username)…"
            className="field w-full pr-8"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                update("q", "");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-mute hover:text-paper"
              title="Clear search"
            >
              ✕
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          className="mono bg-paper px-5 py-2 text-[10px] font-bold text-ink hover:opacity-80"
        >
          Find
        </button>
      </form>

      {/* Filter Selects */}
      {activeTab === "users" ? (
        /* Users specific filters */
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            aria-label="Panelist Level"
            className="field"
            value={query.level}
            onChange={(event) => update("level", event.target.value)}
          >
            {USER_LEVELS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort Panelists"
            className="field"
            value={query.sort}
            onChange={(event) => update("sort", event.target.value)}
          >
            {USER_SORTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        /* Titles filters */
        <div className="grid gap-2 sm:grid-cols-4">
          <select
            aria-label="Format"
            className="field"
            value={query.format}
            onChange={(event) => update("format", event.target.value)}
          >
            <option value="all">
              All formats ({titleCount > 0 ? titleCount : (formatCounts.anime || 0) + (formatCounts.manga || 0) + (formatCounts.manhwa || 0)})
            </option>
            <option value="anime">Anime ({formatCounts.anime || 0})</option>
            <option value="manga">Manga ({formatCounts.manga || 0})</option>
            <option value="manhwa">Manhwa ({formatCounts.manhwa || 0})</option>
          </select>
          <select
            aria-label="Audience Level"
            className="field"
            value={query.level}
            onChange={(event) => update("level", event.target.value)}
          >
            {TITLE_LEVELS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Genre"
            className="field"
            value={query.genre}
            onChange={(event) => update("genre", event.target.value)}
          >
            <option value="all">All genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort"
            className="field"
            value={query.sort}
            onChange={(event) => update("sort", event.target.value)}
          >
            {TITLE_SORTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Helper text & Reset link */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[9px] text-mute">
        <span>
          💡 Tip: Type a name or @username to discover panelists, follow them, and read their reviews.
        </span>
        <button
          type="button"
          onClick={() => {
            setSearchInput("");
            router.push("/library");
          }}
          className="mono text-mute hover:text-paper underline"
        >
          reset filters
        </button>
      </div>
    </div>
  );
}
