"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type LibraryQuery = {
  q: string;
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

const LEVELS = [
  { value: "all", label: "Any audience" },
  { value: "beginner", label: "Beginner friendly" },
  { value: "mediocre", label: "Mediocre" },
  { value: "elite", label: "Elite only" },
];

const SORTS = [
  { value: "popularity", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "az", label: "A → Z" },
];

export function LibraryFilters({
  query,
  genres,
  resultCount,
}: {
  query: LibraryQuery;
  genres: string[];
  resultCount: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: keyof LibraryQuery, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      router.push(`/library?${next.toString()}`);
    },
    [params, router],
  );

  return (
    <div className="panel grain flex flex-col gap-4 p-4 sm:p-5">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("q");
          update("q", typeof value === "string" ? value : "");
        }}
      >
        <input
          name="q"
          defaultValue={query.q}
          placeholder="Search titles, studios, genres, themes…"
          className="field"
        />
        <button
          type="submit"
          className="mono bg-paper px-4 py-2 text-[10px] text-ink hover:opacity-80"
        >
          Find
        </button>
      </form>

      <div className="grid gap-2 sm:grid-cols-4">
        <select
          className="field"
          value={query.format}
          onChange={(event) => update("format", event.target.value)}
        >
          {FORMATS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          className="field"
          value={query.level}
          onChange={(event) => update("level", event.target.value)}
        >
          {LEVELS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
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
          className="field"
          value={query.sort}
          onChange={(event) => update("sort", event.target.value)}
        >
          {SORTS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-3">
        <span className="mono text-[9px] text-mute">
          {resultCount} title{resultCount === 1 ? "" : "s"} in the archive
        </span>
        <button
          type="button"
          onClick={() => router.push("/library")}
          className="mono text-[9px] text-mute hover:text-paper"
        >
          reset filters
        </button>
      </div>
    </div>
  );
}
