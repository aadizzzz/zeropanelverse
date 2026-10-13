"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserSearchResultCard, type SearchUserResult } from "@/components/UserSearchResultCard";

type SearchTitleResult = {
  id: number;
  slug: string;
  name: string;
  altName: string;
  format: string;
  year: number;
  rating: number;
  accent: string;
  glyph: string;
  studio: string;
  tagline: string;
};

export function QuickSearchModal({
  isOpen,
  onClose,
  isLoggedIn = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "titles" | "users">("all");
  const [titles, setTitles] = useState<SearchTitleResult[]>([]);
  const [users, setUsers] = useState<SearchUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<SearchUserResult[]>([]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
      // Fetch suggested users if not fetched yet
      if (suggestedUsers.length === 0) {
        fetch("/api/search?type=users&limit=4")
          .then((res) => res.json())
          .then((data) => {
            if (data?.users) setSuggestedUsers(data.users);
          })
          .catch(() => {});
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, suggestedUsers.length]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setTitles([]);
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&type=${tab}&limit=12`,
        );
        const data = await res.json();
        setTitles(data.titles || []);
        setUsers(data.users || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, tab, isOpen]);

  if (!isOpen) return null;

  const handleFullSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    const targetUrl = query.trim()
      ? `/library?q=${encodeURIComponent(query.trim())}&tab=${tab}`
      : `/library?tab=${tab}`;
    router.push(targetUrl);
  };

  const handleUserFollowChange = (userId: number, following: boolean, newCount: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: following, followersCount: newCount } : u)),
    );
    setSuggestedUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: following, followersCount: newCount } : u)),
    );
  };

  const hasResults = titles.length > 0 || users.length > 0;
  const isQueryEmpty = !query.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 md:p-14"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-lg border border-line bg-ink-soft shadow-2xl flex flex-col max-h-[85vh]">
        {/* Top Search Input Bar */}
        <form
          onSubmit={handleFullSearch}
          className="flex items-center gap-3 border-b border-line bg-ink px-4 py-3.5 sm:px-5"
        >
          <span className="text-lg text-mute">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, manga, or panelists & users (@username)..."
            className="flex-1 bg-transparent text-sm text-paper placeholder:text-mute focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="text-xs text-mute hover:text-paper"
              title="Clear search"
            >
              ✕
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="mono rounded border border-line bg-white/5 px-2 py-1 text-[9px] text-mute hover:border-paper hover:text-paper"
          >
            ESC
          </button>
        </form>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-line bg-ink/60 px-4 py-2 text-xs">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`mono rounded px-3 py-1 text-[10px] transition-colors ${
              tab === "all"
                ? "bg-paper text-ink font-semibold"
                : "text-dim hover:text-paper hover:bg-white/5"
            }`}
          >
            All Results
          </button>
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`mono rounded px-3 py-1 text-[10px] transition-colors ${
              tab === "users"
                ? "bg-paper text-ink font-semibold"
                : "text-dim hover:text-paper hover:bg-white/5"
            }`}
          >
            👥 Panelists & Users {users.length > 0 ? `(${users.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setTab("titles")}
            className={`mono rounded px-3 py-1 text-[10px] transition-colors ${
              tab === "titles"
                ? "bg-paper text-ink font-semibold"
                : "text-dim hover:text-paper hover:bg-white/5"
            }`}
          >
            🎬 Titles {titles.length > 0 ? `(${titles.length})` : ""}
          </button>

          {loading ? (
            <span className="mono ml-auto text-[9px] text-mute animate-pulse">
              searching...
            </span>
          ) : null}
        </div>

        {/* Scrollable Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {isQueryEmpty ? (
            /* Suggested / Quick discovery when input is empty */
            <div className="space-y-6">
              <div>
                <div className="mono mb-3 flex items-center justify-between text-[10px] text-mute">
                  <span>✨ Featured Panelists to Follow & Read</span>
                  <Link
                    href="/library?tab=users"
                    onClick={onClose}
                    className="hover:text-paper underline"
                  >
                    View all panelists →
                  </Link>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {suggestedUsers.map((u) => (
                    <UserSearchResultCard
                      key={u.id}
                      user={u}
                      isLoggedIn={isLoggedIn}
                      compact
                      onFollowChange={handleUserFollowChange}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="mono mb-2.5 block text-[10px] text-mute">
                  ⚡ Quick Categories
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link
                    href="/library?format=anime"
                    onClick={onClose}
                    className="mono rounded border border-line bg-white/5 px-3 py-1.5 text-[10px] text-paper hover:border-paper"
                  >
                    📺 Anime Archive
                  </Link>
                  <Link
                    href="/library?format=manga"
                    onClick={onClose}
                    className="mono rounded border border-line bg-white/5 px-3 py-1.5 text-[10px] text-paper hover:border-paper"
                  >
                    📖 Manga Archive
                  </Link>
                  <Link
                    href="/library?format=manhwa"
                    onClick={onClose}
                    className="mono rounded border border-line bg-white/5 px-3 py-1.5 text-[10px] text-paper hover:border-paper"
                  >
                    ⚡ Manhwa Archive
                  </Link>
                  <Link
                    href="/panels"
                    onClick={onClose}
                    className="mono rounded border border-line bg-white/5 px-3 py-1.5 text-[10px] text-paper hover:border-paper"
                  >
                    💬 Community Panels & Reviews
                  </Link>
                </div>
              </div>
            </div>
          ) : !loading && !hasResults ? (
            /* Empty state when query produces no matches */
            <div className="py-12 text-center">
              <span className="text-3xl">🔍</span>
              <h3 className="display mt-3 text-lg text-paper">No matches found</h3>
              <p className="mt-1 text-xs text-dim">
                No titles or panelists matched &ldquo;{query}&rdquo;.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mono rounded border border-line px-3 py-1.5 text-[10px] text-paper hover:border-paper"
                >
                  Clear search
                </button>
                <button
                  type="button"
                  onClick={handleFullSearch}
                  className="mono rounded bg-paper px-3 py-1.5 text-[10px] text-ink hover:opacity-85"
                >
                  Search in Library
                </button>
              </div>
            </div>
          ) : (
            /* Search Results */
            <div className="space-y-6">
              {/* Users / Panelists Section */}
              {(tab === "all" || tab === "users") && users.length > 0 ? (
                <div>
                  <div className="mono mb-3 flex items-center justify-between text-[10px] text-mute">
                    <span>👥 Panelists ({users.length}) — Follow & see their reviews</span>
                    <Link
                      href={`/library?q=${encodeURIComponent(query)}&tab=users`}
                      onClick={onClose}
                      className="hover:text-paper underline"
                    >
                      View all in Library →
                    </Link>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {users.map((u) => (
                      <UserSearchResultCard
                        key={u.id}
                        user={u}
                        isLoggedIn={isLoggedIn}
                        compact
                        onFollowChange={handleUserFollowChange}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Titles Section */}
              {(tab === "all" || tab === "titles") && titles.length > 0 ? (
                <div>
                  <div className="mono mb-3 flex items-center justify-between text-[10px] text-mute">
                    <span>🎬 Titles & Series ({titles.length})</span>
                    <Link
                      href={`/library?q=${encodeURIComponent(query)}&tab=titles`}
                      onClick={onClose}
                      className="hover:text-paper underline"
                    >
                      View all in Library →
                    </Link>
                  </div>
                  <div className="grid gap-2">
                    {titles.map((t) => (
                      <Link
                        key={t.id}
                        href={`/title/${t.slug}`}
                        onClick={onClose}
                        className="panel grain group flex items-center justify-between gap-3 p-3 transition-colors hover:border-paper/50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="display grid h-9 w-9 shrink-0 place-items-center border border-line bg-ink text-sm text-paper"
                            style={{ borderColor: t.accent }}
                          >
                            {t.glyph || t.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-paper group-hover:underline">
                                {t.name}
                              </span>
                              <span className="mono rounded border border-line px-1.5 py-0.2 text-[8px] uppercase text-mute">
                                {t.format}
                              </span>
                            </div>
                            <p className="mono truncate text-[9.5px] text-mute">
                              {t.studio || t.altName || t.tagline || `${t.year}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className="mono text-xs font-bold"
                            style={{ color: t.accent || "#fff" }}
                          >
                            ★ {t.rating?.toFixed(1) ?? "—"}
                          </span>
                          <span className="text-mute group-hover:text-paper">→</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line bg-ink px-4 py-2.5 text-[10px] text-mute">
          <div className="flex items-center gap-2">
            <span>Press <kbd className="rounded border border-line px-1 py-0.5 bg-white/5">↵ Enter</kbd> for full archive</span>
          </div>
          <button
            type="button"
            onClick={handleFullSearch}
            className="mono text-paper hover:underline"
          >
            Open in Library →
          </button>
        </div>
      </div>
    </div>
  );
}
