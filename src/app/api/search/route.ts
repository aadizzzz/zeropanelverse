import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { follows, panels, titles, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/db-init";
import { searchAniList, cacheAniListTitle } from "@/lib/anilist";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSeeded();
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const type = url.searchParams.get("type") ?? "all"; // 'all' | 'titles' | 'users'
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));

  const currentUser = await getCurrentUser();

  let matchedTitles: any[] = [];
  let matchedUsers: any[] = [];

  const shouldSearchTitles = type === "all" || type === "titles";
  const shouldSearchUsers = type === "all" || type === "users";

  try {
    // 1. Search Titles
    if (shouldSearchTitles && q) {
      const like = `%${q}%`;
      const titleSearch = or(
        ilike(titles.name, like),
        ilike(titles.altName, like),
        ilike(titles.studio, like),
        ilike(titles.synopsis, like),
        sql`${titles.genres}::text ilike ${like}`,
        sql`${titles.themes}::text ilike ${like}`,
      );

      matchedTitles = await db
        .select({
          id: titles.id,
          slug: titles.slug,
          name: titles.name,
          altName: titles.altName,
          format: titles.format,
          year: titles.year,
          rating: titles.rating,
          genres: titles.genres,
          accent: titles.accent,
          accentSoft: titles.accentSoft,
          glyph: titles.glyph,
          studio: titles.studio,
          tagline: titles.tagline,
          posterUrl: titles.posterUrl,
        })
        .from(titles)
        .where(titleSearch)
        .orderBy(desc(titles.popularity))
        .limit(limit);

      // If local DB has fewer results than requested, query AniList to find ANY anime/manga/manhwa in existence
      if (matchedTitles.length < limit) {
        try {
          const anilistResults = await searchAniList({
            q,
            perPage: Math.min(10, limit - matchedTitles.length),
          });

          for (const item of anilistResults) {
            const cached = await cacheAniListTitle(item);
            if (
              cached &&
              !matchedTitles.some(
                (t) => t.id === cached.id || t.slug === cached.slug || t.name.toLowerCase() === cached.name.toLowerCase(),
              )
            ) {
              matchedTitles.push({
                id: cached.id,
                slug: cached.slug,
                name: cached.name,
                altName: cached.altName,
                format: cached.format,
                year: cached.year,
                rating: cached.rating,
                genres: cached.genres,
                accent: cached.accent,
                accentSoft: cached.accentSoft,
                glyph: cached.glyph,
                studio: cached.studio,
                tagline: cached.tagline,
                posterUrl: cached.posterUrl,
              });
            }
          }
        } catch (apiErr) {
          console.warn("AniList search augmentation error:", apiErr);
        }
      }
    } else if (shouldSearchTitles && !q && type === "titles") {
      matchedTitles = await db
        .select({
          id: titles.id,
          slug: titles.slug,
          name: titles.name,
          altName: titles.altName,
          format: titles.format,
          year: titles.year,
          rating: titles.rating,
          genres: titles.genres,
          accent: titles.accent,
          accentSoft: titles.accentSoft,
          glyph: titles.glyph,
          studio: titles.studio,
          tagline: titles.tagline,
          posterUrl: titles.posterUrl,
        })
        .from(titles)
        .orderBy(desc(titles.popularity))
        .limit(limit);
    }

    // 2. Search Users
    if (shouldSearchUsers) {
      const userConditions: SQL[] = [];
      if (q) {
        const cleanQ = (q.startsWith("@") ? q.slice(1) : q).trim();
        const cleanLike = `%${cleanQ}%`;
        const userSearch = or(
          ilike(users.username, cleanLike),
          ilike(users.displayName, cleanLike),
          ilike(users.bio, cleanLike),
        );
        if (userSearch) userConditions.push(userSearch);
      }

      // If no query and type is 'users', fetch top panelists
      if (q || type === "users") {
        const dbUsers = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            bio: users.bio,
            experienceLevel: users.experienceLevel,
            avatarGlyph: users.avatarGlyph,
            followersCount: sql<number>`(select count(*)::int from ${follows} where ${follows.followingId} = ${users.id})`,
            reviewsCount: sql<number>`(select count(*)::int from ${panels} where ${panels.userId} = ${users.id})`,
            latestHeadline: sql<string | null>`(select p.headline from ${panels} p where p.user_id = ${users.id} order by p.created_at desc limit 1)`,
            latestTitleName: sql<string | null>`(select t.name from ${panels} p join ${titles} t on t.id = p.title_id where p.user_id = ${users.id} order by p.created_at desc limit 1)`,
            latestRating: sql<number | null>`(select p.rating from ${panels} p where p.user_id = ${users.id} order by p.created_at desc limit 1)`,
            latestSlug: sql<string | null>`(select t.slug from ${panels} p join ${titles} t on t.id = p.title_id where p.user_id = ${users.id} order by p.created_at desc limit 1)`,
          })
          .from(users)
          .where(userConditions.length > 0 ? and(...userConditions) : undefined)
          .orderBy(
            desc(sql`(select count(*)::int from ${follows} where ${follows.followingId} = ${users.id})`),
            asc(users.username),
          )
          .limit(limit);

        // Check if currentUser follows each user
        let followingIds = new Set<number>();
        if (currentUser) {
          const followRows = await db
            .select({ followingId: follows.followingId })
            .from(follows)
            .where(eq(follows.followerId, currentUser.id));
          followingIds = new Set(followRows.map((r) => r.followingId));
        }

        matchedUsers = dbUsers.map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          bio: u.bio,
          experienceLevel: u.experienceLevel,
          avatarGlyph: u.avatarGlyph,
          followersCount: u.followersCount ?? 0,
          reviewsCount: u.reviewsCount ?? 0,
          latestReview: u.latestHeadline
            ? {
                headline: u.latestHeadline,
                titleName: u.latestTitleName ?? "",
                rating: u.latestRating ?? 0,
                slug: u.latestSlug ?? undefined,
              }
            : null,
          isFollowing: followingIds.has(u.id),
          isSelf: currentUser ? currentUser.id === u.id : false,
        }));
      }
    }
  } catch (err) {
    console.warn("Search API fallback triggered:", err);
    // Static fallback
    const { seedTitles, seedPanels } = await import("@/lib/seed-data");

    if (shouldSearchTitles) {
      const qLower = q.toLowerCase();
      matchedTitles = seedTitles
        .filter(
          (t) =>
            !q ||
            t.name.toLowerCase().includes(qLower) ||
            t.altName.toLowerCase().includes(qLower) ||
            t.studio.toLowerCase().includes(qLower) ||
            t.genres.some((g) => g.toLowerCase().includes(qLower)),
        )
        .slice(0, limit);
    }

    if (shouldSearchUsers) {
      const demoUsers = [
        {
          id: 1,
          username: "panelnewbie",
          displayName: "Rin (Newbie)",
          bio: "Six months into anime. Currently logging everything I watch so other beginners can dodge the confusing stuff.",
          experienceLevel: "beginner" as const,
          avatarGlyph: "新",
        },
        {
          id: 2,
          username: "midwatch_mira",
          displayName: "Mira",
          bio: "Two hundred titles deep. I care about pacing, adaptation quality and which studio saved money on episode 7.",
          experienceLevel: "mediocre" as const,
          avatarGlyph: "M",
        },
        {
          id: 3,
          username: "archivist_k",
          displayName: "Archivist K",
          bio: "Manga-first since the 90s. I write long-form breakdowns of paneling, causality and authorial intent.",
          experienceLevel: "elite" as const,
          avatarGlyph: "K",
        },
        {
          id: 4,
          username: "aadizzzz",
          displayName: "Aditya",
          bio: "Platform creator & anime enthusiast",
          experienceLevel: "mediocre" as const,
          avatarGlyph: "A",
        },
        {
          id: 5,
          username: "aadizz",
          displayName: "Aditya Dhiman",
          bio: "Watching & reviewing anime, manga, and manhwas",
          experienceLevel: "mediocre" as const,
          avatarGlyph: "A",
        },
      ];

      const cleanQ = (q.startsWith("@") ? q.slice(1) : q).toLowerCase();
      matchedUsers = demoUsers
        .filter(
          (u) =>
            !cleanQ ||
            u.username.toLowerCase().includes(cleanQ) ||
            u.displayName.toLowerCase().includes(cleanQ) ||
            u.bio.toLowerCase().includes(cleanQ),
        )
        .map((u) => {
          const userPanels = seedPanels.filter((p) => p.username === u.username);
          const latest = userPanels[0];
          const title = latest ? seedTitles.find((st) => st.slug === latest.titleSlug) : null;
          return {
            ...u,
            followersCount: u.username === "midwatch_mira" ? 2 : 1,
            reviewsCount: userPanels.length,
            latestReview: latest
              ? {
                  headline: latest.headline,
                  titleName: title?.name ?? latest.titleSlug,
                  rating: latest.rating,
                  slug: latest.titleSlug,
                }
              : null,
            isFollowing: false,
            isSelf: currentUser ? currentUser.id === u.id : false,
          };
        })
        .slice(0, limit);
    }
  }

  return Response.json({
    query: q,
    type,
    titlesCount: matchedTitles.length,
    usersCount: matchedUsers.length,
    titles: matchedTitles,
    users: matchedUsers,
  });
}
