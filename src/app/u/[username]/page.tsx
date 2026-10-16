import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { follows, panels, titles, users, watchlist, type ExperienceLevel } from "@/db/schema";
import { ensureSeeded } from "@/lib/db-init";
import { LEVEL_LABELS, getCurrentUser } from "@/lib/auth";
import { ProfileHeaderActions } from "@/components/ProfileFollowButton";
import { ProfileFeedTabs } from "@/components/ProfileFeedTabs";

import type { Metadata } from "next";
import { SITE_URL, generateProfileSchema, generateBreadcrumbSchema } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  let profile: any = null;
  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);
    profile = rows[0] ?? null;
  } catch {}

  const displayName = profile?.displayName || username;
  const bio =
    profile?.bio ||
    `Anime, manga, and manhwa reviews and watchlist by @${username} on ZeroPanelVerse.`;
  const canonicalUrl = `${SITE_URL}/u/${username}`;

  return {
    title: `${displayName} (@${username}) — Panelist Profile`,
    description: bio.slice(0, 160),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${displayName} (@${username}) | ZeroPanelVerse`,
      description: bio.slice(0, 160),
      url: canonicalUrl,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${displayName} (@${username}) | ZeroPanelVerse`,
      description: bio.slice(0, 160),
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  await ensureSeeded();
  const { username } = await params;
  const currentUser = await getCurrentUser();

  let profile: any = null;
  let entries: any[] = [];
  let list: any[] = [];
  let followerRows: any[] = [];
  let followingRows: any[] = [];
  let isCurrentUserFollowing = false;

  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);
    profile = rows[0] ?? null;

    if (profile) {
      const res = await Promise.all([
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
            accentSoft: titles.accentSoft,
            glyph: titles.glyph,
            texture: titles.texture,
            year: titles.year,
            format: titles.format,
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
            accentSoft: titles.accentSoft,
            glyph: titles.glyph,
            format: titles.format,
            texture: titles.texture,
            year: titles.year,
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
      [entries, list, followerRows, followingRows] = res;

      if (currentUser) {
        const isFollowRow = await db
          .select({ id: follows.id })
          .from(follows)
          .where(and(eq(follows.followerId, currentUser.id), eq(follows.followingId, profile.id)))
          .limit(1);
        isCurrentUserFollowing = isFollowRow.length > 0;
      }
    }
  } catch (err) {
    console.warn("Profile DB query fallback:", err);
  }

  // Fallback demo profiles if DB is offline
  if (!profile) {
    const demoProfiles: Record<string, any> = {
      panelnewbie: {
        id: 1,
        username: "panelnewbie",
        displayName: "Newbie Reader",
        bio: "Just started exploring the verse. Here for beginner-friendly anime and recommendations.",
        experienceLevel: "beginner",
        spoilerMode: "safe",
        avatarGlyph: "P",
        createdAt: new Date(),
      },
      midwatch_mira: {
        id: 2,
        username: "midwatch_mira",
        displayName: "Mira Watcher",
        bio: "Halfway through 100+ shows. I like discussing character dynamics, pacing, and intermediate guides.",
        experienceLevel: "mediocre",
        spoilerMode: "mild",
        avatarGlyph: "M",
        createdAt: new Date(),
      },
      archivist_k: {
        id: 3,
        username: "archivist_k",
        displayName: "Kenji the Archivist",
        bio: "Reading manga and manhwa since 2004. Deep-dive paneling, thematic thesis, uncensored lore.",
        experienceLevel: "elite",
        spoilerMode: "full",
        avatarGlyph: "K",
        createdAt: new Date(),
      },
    };

    profile = demoProfiles[username.toLowerCase()];
    if (!profile) notFound();

    const { seedPanels, seedTitles } = await import("@/lib/seed-data");
    entries = seedPanels
      .filter((p) => p.username === profile.username)
      .map((p, i) => {
        const t = seedTitles.find((st) => st.slug === p.titleSlug);
        return {
          id: i + 1,
          headline: p.headline,
          body: p.body,
          kind: p.kind,
          rating: p.rating,
          authorLevel: p.authorLevel,
          createdAt: new Date(),
          slug: p.titleSlug,
          titleName: t?.name ?? p.titleSlug,
          accent: t?.accent ?? "#ffffff",
        };
      });

    list = seedTitles.slice(0, 3).map((t) => ({
      slug: t.slug,
      name: t.name,
      accent: t.accent,
      glyph: t.glyph,
      format: t.format,
      status: "watching",
    }));

    followerRows = [
      { id: 99, username: "archivist_k", displayName: "Kenji the Archivist", experienceLevel: "elite", avatarGlyph: "K" },
    ];
    followingRows = [
      { id: 98, username: "midwatch_mira", displayName: "Mira Watcher", experienceLevel: "mediocre", avatarGlyph: "M" },
    ];
  }

  const isOwnProfile = currentUser ? currentUser.id === profile.id : false;
  const profileSchema = generateProfileSchema(profile);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Panelists", path: "/library" },
    { name: profile.displayName, path: `/u/${profile.username}` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
                {LEVEL_LABELS[profile.experienceLevel as ExperienceLevel] ?? profile.experienceLevel} panelist
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
