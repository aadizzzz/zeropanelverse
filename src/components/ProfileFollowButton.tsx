"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { followUserAction } from "@/lib/actions";

export function ProfileHeaderActions({
  profileId,
  username,
  initialFollowing,
  initialFollowersCount,
  isOwnProfile,
  isLoggedIn,
}: {
  profileId: number;
  username: string;
  initialFollowing: boolean;
  initialFollowersCount: number;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [pending, startTransition] = useTransition();

  const handleFollowToggle = () => {
    if (!isLoggedIn) {
      router.push(`/login?next=/u/${username}`);
      return;
    }

    // Optimistic toggle
    const nextState = !following;
    setFollowing(nextState);
    setFollowersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    startTransition(async () => {
      const res = await followUserAction(profileId);
      if (res.ok) {
        setFollowing(res.following);
        if (typeof res.count === "number") {
          setFollowersCount(res.count);
        }
      } else {
        // Rollback
        setFollowing(!nextState);
        setFollowersCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
      }
    });
  };

  if (isOwnProfile) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/profile"
          className="mono rounded border border-line px-4 py-2 text-[11px] text-dim transition-colors hover:border-paper hover:text-paper"
        >
          Edit Profile
        </Link>
        <Link
          href="/messages"
          className="mono rounded bg-white/10 px-4 py-2 text-[11px] text-paper transition-colors hover:bg-white/20"
        >
          My Messages ✈️
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleFollowToggle}
        className={`mono rounded px-5 py-2 text-[11px] font-semibold transition-all ${
          following
            ? "border border-line bg-transparent text-dim hover:border-red-400 hover:text-red-400"
            : "bg-paper text-ink hover:opacity-85 shadow"
        }`}
      >
        {following ? "Following ✓" : "+ Follow"}
      </button>

      <Link
        href={`/messages?with=${username}`}
        className="mono flex items-center gap-1.5 rounded border border-line bg-white/5 px-4 py-2 text-[11px] text-paper transition-colors hover:border-paper hover:bg-white/10"
      >
        <span>Message</span>
        <span>✈️</span>
      </Link>
    </div>
  );
}
