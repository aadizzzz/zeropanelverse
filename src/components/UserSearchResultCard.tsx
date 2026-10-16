"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { followUserAction } from "@/lib/actions";
import type { ExperienceLevel } from "@/db/schema";

const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: "Beginner",
  mediocre: "Mediocre",
  elite: "Elite",
};

export type SearchUserResult = {
  id: number;
  username: string;
  displayName: string;
  bio: string;
  experienceLevel: ExperienceLevel;
  avatarGlyph: string;
  followersCount: number;
  reviewsCount: number;
  latestReview?: {
    titleName: string;
    headline: string;
    rating: number;
    slug?: string;
  } | null;
  isFollowing?: boolean;
  isSelf?: boolean;
};

const LEVEL_COLORS: Record<ExperienceLevel, string> = {
  beginner: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  mediocre: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  elite: "border-violet-500/40 text-violet-300 bg-violet-500/10",
};

export function UserSearchResultCard({
  user,
  isLoggedIn = false,
  compact = false,
  onFollowChange,
}: {
  user: SearchUserResult;
  isLoggedIn?: boolean;
  compact?: boolean;
  onFollowChange?: (userId: number, following: boolean, newCount: number) => void;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(Boolean(user.isFollowing));
  const [followersCount, setFollowersCount] = useState(user.followersCount);
  const [pending, startTransition] = useTransition();

  const handleFollowToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/login?next=/u/${user.username}`);
      return;
    }

    const nextState = !following;
    const newCount = nextState ? followersCount + 1 : Math.max(0, followersCount - 1);
    setFollowing(nextState);
    setFollowersCount(newCount);
    onFollowChange?.(user.id, nextState, newCount);

    startTransition(async () => {
      const res = await followUserAction(user.id);
      if (res.ok) {
        setFollowing(res.following);
        if (typeof res.count === "number") {
          setFollowersCount(res.count);
          onFollowChange?.(user.id, res.following, res.count);
        }
      } else {
        // Rollback on failure
        setFollowing(!nextState);
        setFollowersCount(followersCount);
        onFollowChange?.(user.id, !nextState, followersCount);
      }
    });
  };

  const levelKey = (user.experienceLevel as ExperienceLevel) || "beginner";
  const levelColor = LEVEL_COLORS[levelKey] || "border-paper/40 text-paper bg-white/5";
  const levelLabel = LEVEL_LABELS[levelKey] ?? user.experienceLevel;

  if (compact) {
    return (
      <div className="panel grain flex items-center justify-between gap-3 p-3 transition-colors hover:border-paper/50">
        <Link
          href={`/u/${user.username}`}
          className="flex min-w-0 flex-1 items-center gap-3 group"
        >
          <span className="display grid h-10 w-10 shrink-0 place-items-center border border-paper/30 bg-ink text-lg text-paper">
            {user.avatarGlyph || "Z"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-paper group-hover:underline">
                {user.displayName}
              </span>
              <span className={`mono rounded px-1.5 py-0.2 text-[8px] uppercase ${levelColor}`}>
                {levelLabel}
              </span>
            </div>
            <div className="mono flex items-center gap-2 text-[9px] text-mute">
              <span>@{user.username}</span>
              <span>·</span>
              <span>{followersCount} followers</span>
              <span>·</span>
              <span>{user.reviewsCount} reviews</span>
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5">
          {!user.isSelf ? (
            <>
              <Link
                href={`/messages?with=${user.username}`}
                className="mono flex items-center gap-1 rounded border border-paper/30 bg-paper/10 px-2.5 py-1 text-[9.5px] font-semibold text-paper transition-all hover:border-paper hover:bg-paper hover:text-ink"
                title={`Direct message @${user.username}`}
              >
                <span>Message</span>
                <span>✈️</span>
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={handleFollowToggle}
                className={`mono rounded px-2.5 py-1 text-[9.5px] font-semibold transition-all ${
                  following
                    ? "border border-line bg-transparent text-dim hover:border-red-400 hover:text-red-400"
                    : "border border-line text-paper hover:border-paper"
                }`}
              >
                {following ? "Following ✓" : "+ Follow"}
              </button>
            </>
          ) : (
            <span className="mono rounded border border-line px-2 py-0.5 text-[8.5px] text-mute">
              You
            </span>
          )}
          <Link
            href={`/u/${user.username}`}
            className="mono rounded border border-line bg-white/5 px-2.5 py-1 text-[9.5px] text-mute transition-colors hover:border-paper hover:text-paper"
            title="See reviews"
          >
            Reviews →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="panel grain flex flex-col justify-between p-5 transition-all hover:border-paper/60">
      <div>
        {/* Top Header: Avatar + Info */}
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/u/${user.username}`}
            className="group flex flex-1 items-start gap-3.5 min-w-0"
          >
            <span className="display grid h-14 w-14 shrink-0 place-items-center border border-paper/40 bg-ink text-2xl text-paper shadow-md transition-transform group-hover:scale-105">
              {user.avatarGlyph || "Z"}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="display text-lg text-paper group-hover:underline">
                  {user.displayName}
                </span>
                <span className={`mono rounded px-2 py-0.5 text-[8.5px] uppercase font-semibold ${levelColor}`}>
                  {levelLabel} panelist
                </span>
                {user.isSelf ? (
                  <span className="mono rounded border border-line px-1.5 py-0.5 text-[8px] text-mute">
                    You
                  </span>
                ) : null}
              </div>

              <span className="mono block text-[10px] text-mute">@{user.username}</span>

              {/* Follower & Review Stats */}
              <div className="mt-2 flex items-center gap-4 text-xs text-dim">
                <div>
                  <span className="font-bold text-paper">{followersCount}</span>{" "}
                  <span className="mono text-[9px] text-mute">Followers</span>
                </div>
                <div>
                  <span className="font-bold text-paper">{user.reviewsCount}</span>{" "}
                  <span className="mono text-[9px] text-mute">Reviews</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Bio */}
        {user.bio ? (
          <p className="mt-3.5 line-clamp-2 text-[12.5px] leading-relaxed text-dim">
            {user.bio}
          </p>
        ) : null}

        {/* Latest Review Spotlight */}
        {user.latestReview ? (
          <div className="mt-4 rounded border border-line bg-white/[0.02] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="mono text-[8.5px] text-mute">Latest review</span>
              <span className="mono text-[9px] font-bold text-amber-400">
                ★ {user.latestReview.rating}/10
              </span>
            </div>
            <Link
              href={user.latestReview.slug ? `/title/${user.latestReview.slug}` : `/u/${user.username}`}
              className="mt-1 block text-[11px] font-medium text-paper hover:underline line-clamp-1"
            >
              {user.latestReview.titleName}
            </Link>
            <p className="mt-0.5 text-[11.5px] italic text-dim line-clamp-2">
              &ldquo;{user.latestReview.headline}&rdquo;
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded border border-dashed border-line/60 p-2.5 text-center">
            <span className="mono text-[9px] text-mute">No reviews published yet</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 border-t border-line pt-3.5">
        <div className="flex items-center gap-2">
          {!user.isSelf ? (
            <button
              type="button"
              disabled={pending}
              onClick={handleFollowToggle}
              className={`mono rounded px-3.5 py-1.5 text-[10px] font-semibold transition-all ${
                following
                  ? "border border-line bg-transparent text-dim hover:border-red-400 hover:text-red-400"
                  : "bg-paper text-ink hover:opacity-85 shadow"
              }`}
            >
              {following ? "Following ✓" : "+ Follow"}
            </button>
          ) : (
            <Link
              href="/profile"
              className="mono rounded border border-line px-3 py-1.5 text-[10px] text-dim hover:border-paper hover:text-paper"
            >
              Edit Profile
            </Link>
          )}

          {!user.isSelf ? (
            <Link
              href={`/messages?with=${user.username}`}
              title={`Direct message @${user.username}`}
              className="mono flex items-center gap-1.5 rounded border border-paper/30 bg-paper/10 px-3.5 py-1.5 text-[10px] font-semibold text-paper transition-all hover:border-paper hover:bg-paper hover:text-ink"
            >
              <span>Message</span>
              <span>✈️</span>
            </Link>
          ) : null}
        </div>

        <Link
          href={`/u/${user.username}`}
          className="mono flex items-center gap-1.5 text-[10.5px] font-medium text-paper transition-colors hover:text-dim"
        >
          <span>See Reviews & Profile</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
