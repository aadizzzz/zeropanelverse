import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { follows, panels, titles, users, watchlist } from "@/db/schema";
import { ensureSeeded } from "@/lib/db-init";
import { LEVEL_LABELS, getCurrentUser } from "@/lib/auth";
import { ProfileHeaderActions } from "@/components/ProfileFollowButton";
import { ProfileFeedTabs } from "@/components/ProfileFeedTabs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${username} — ZeroPanelVerse` };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  await ensureSeeded();
  const { username } = await params;
  const currentUser = await getCurrentUser();

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  const profile = rows[0];
  if (!profile) notFound();

  // Queries: entries, watchlist, followers, following
  const [entries, list, followerRows, followingRows] = await Promise.all([
    db
      .select({
        id: panels.id,
        headline: panels.headline,
        body: panels.body,
        kind: panels.kind,
        rating: panels.rating,
        authorLevel: panels.authorLevel,
        createdAt: panels.createdAt,
        slug: titles.slug,
        titleName: titles.name,
        accent: titles.accent,
      })
      .from(panels)
      .innerJoin(titles, eq(titles.id, panels.titleId))
      .where(eq(panels.userId, profile.id))
      .orderBy(desc(panels.createdAt))
      .limit(20),

    db
      .select({
        slug: titles.slug,
        name: titles.name,
        accent: titles.accent,
        glyph: titles.glyph,
        format: titles.format,
        status: watchlist.status,
      })
      .from(watchlist)
      .innerJoin(titles, eq(titles.id, watchlist.titleId))
      .where(eq(watchlist.userId, profile.id))
      .limit(20),

    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        experienceLevel: users.experienceLevel,
        avatarGlyph: users.avatarGlyph,
      })
      .from(follows)
      .innerJoin(users, eq(users.id, follows.followerId))
      .where(eq(follows.followingId, profile.id)),

    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        experienceLevel: users.experienceLevel,
        avatarGlyph: users.avatarGlyph,
      })
      .from(follows)
      .innerJoin(users, eq(users.id, follows.followingId))
      .where(eq(follows.followerId, profile.id)),
  ]);

  let isCurrentUserFollowing = false;
  if (currentUser) {
    const isFollowRow = await db
      .select({ id: follows.id })
      .from(follows)
      .where(and(eq(follows.followerId, currentUser.id), eq(follows.followingId, profile.id)))
      .limit(1);
    isCurrentUserFollowing = isFollowRow.length > 0;
  }

  const isOwnProfile = currentUser ? currentUser.id === profile.id : false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* ================= Profile Banner & Info ================= */}
      <section className="panel grain relative overflow-hidden p-6 sm:p-10">
        <div className="tex-halftone absolute inset-0 opacity-20" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Avatar Glyph */}
          <span className="display grid h-24 w-24 shrink-0 place-items-center border border-paper/40 bg-ink text-4xl text-paper shadow-lg">
            {profile.avatarGlyph}
          </span>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="display text-3xl text-paper sm:text-4xl">{profile.displayName}</h1>
              <span className="mono border border-paper/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-paper">
                {LEVEL_LABELS[profile.experienceLevel]} panelist
              </span>
            </div>

            <div className="mono mt-2 flex flex-wrap items-center gap-2 text-[10px] text-mute">
              <span>@{profile.username}</span>
              <span>·</span>
              <span>Joined {new Date(profile.createdAt).toLocaleDateString("en-GB")}</span>
            </div>

            {/* Social stats */}
            <div className="mt-3 flex items-center gap-6 text-xs text-dim">
              <div>
                <span className="font-bold text-paper">{followerRows.length}</span>{" "}
                <span className="mono text-[10px] text-mute">Followers</span>
              </div>
              <div>
                <span className="font-bold text-paper">{followingRows.length}</span>{" "}
                <span className="mono text-[10px] text-mute">Following</span>
              </div>
              <div>
                <span className="font-bold text-paper">{entries.length}</span>{" "}
                <span className="mono text-[10px] text-mute">Reviews & Posts</span>
              </div>
            </div>

            {profile.bio ? (
              <p className="mt-3.5 max-w-2xl text-[13.5px] leading-relaxed text-dim">{profile.bio}</p>
            ) : null}
          </div>

          {/* Action buttons (Follow, Message, Edit) */}
          <div className="shrink-0">
            <ProfileHeaderActions
              profileId={profile.id}
              username={profile.username}
              initialFollowing={isCurrentUserFollowing}
              initialFollowersCount={followerRows.length}
              isOwnProfile={isOwnProfile}
              isLoggedIn={Boolean(currentUser)}
            />
          </div>
        </div>
      </section>

      {/* ================= Profile Tabs (Posts, Watchlist, Followers, Following) ================= */}
      <div className="mt-8">
        <ProfileFeedTabs
          entries={entries}
          watchlistItems={list}
          followers={followerRows}
          following={followingRows}
        />
      </div>
    </div>
  );
}
