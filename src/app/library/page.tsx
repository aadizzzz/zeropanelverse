import Link from "next/link";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { follows, panels, titles, users, type ExperienceLevel, type TitleFormat } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/db-init";
import { TitleCard } from "@/components/TitleCard";
import { LibraryFilters } from "@/components/LibraryFilters";
import { UserSearchResultCard, type SearchUserResult } from "@/components/UserSearchResultCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search & Library — ZeroPanelVerse",
  description:
    "Browse and search anime, manga, manhwa, and community panelists to follow and read reviews from.",
};

const FORMATS: TitleFormat[] = ["anime", "manga", "manhwa"];

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded();
  const currentUser = await getCurrentUser();
  const params = await searchParams;

  const read = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };

  const q = read("q").trim();
  const rawTab = read("tab");
  const tab: "all" | "titles" | "users" =
    rawTab === "users" || rawTab === "titles" ? rawTab : "all";
  const format = read("format");
  const genre = read("genre");
  const level = read("level");
  const sort = read("sort") || "popularity";

  // ================= 1. Build Titles Query =================
  const titleConditions: SQL[] = [];
  if (q) {
    const like = `%${q}%`;
    const search = or(
      ilike(titles.name, like),
      ilike(titles.altName, like),
      ilike(titles.studio, like),
      ilike(titles.synopsis, like),
      sql`${titles.genres}::text ilike ${like}`,
      sql`${titles.themes}::text ilike ${like}`,
    );
    if (search) titleConditions.push(search);
  }
  if (FORMATS.includes(format as TitleFormat)) {
    titleConditions.push(eq(titles.format, format as TitleFormat));
  }
  if (genre) {
    titleConditions.push(sql`${titles.genres} @> ${JSON.stringify([genre])}::jsonb`);
  }

  const levelOrder =
    level === "beginner"
      ? sql`(${titles.tiers} -> 'beginner' ->> 'difficulty')::int asc`
      : level === "mediocre"
        ? sql`(${titles.tiers} -> 'mediocre' ->> 'difficulty')::int asc`
        : level === "elite"
          ? sql`(${titles.tiers} -> 'elite' ->> 'difficulty')::int desc`
          : null;

  const titleOrderBy =
    levelOrder ??
    (sort === "rating"
      ? desc(titles.rating)
      : sort === "newest"
        ? desc(titles.year)
        : sort === "az"
          ? asc(titles.name)
          : desc(titles.popularity));

  const titleWhere = titleConditions.length > 0 ? and(...titleConditions) : undefined;

  // ================= 2. Build Users Query =================
  const userConditions: SQL[] = [];
  if (q) {
    const cleanQ = q.startsWith("@") ? q.slice(1) : q;
    const like = `%${q}%`;
    const cleanLike = `%${cleanQ}%`;
    const userSearch = or(
      ilike(users.username, cleanLike),
      ilike(users.displayName, like),
      ilike(users.bio, like),
    );
    if (userSearch) userConditions.push(userSearch);
  }

  if (tab === "users" && (level === "beginner" || level === "mediocre" || level === "elite")) {
    userConditions.push(eq(users.experienceLevel, level as ExperienceLevel));
  }

  const userWhere = userConditions.length > 0 ? and(...userConditions) : undefined;

  const userOrderBy =
    sort === "rating"
      ? desc(sql`(select count(*)::int from ${panels} where ${panels.userId} = ${users.id})`)
      : sort === "az"
        ? asc(users.displayName)
        : desc(sql`(select count(*)::int from ${follows} where ${follows.followingId} = ${users.id})`);

  let rows: any[] = [];
  let genres: string[] = [];
  let userResults: SearchUserResult[] = [];

  try {
    const [dbTitles, allGenres, dbUsers, currentUserFollows] = await Promise.all([
      db.select().from(titles).where(titleWhere).orderBy(titleOrderBy),
      db.select({ genres: titles.genres }).from(titles),
      // Query users whenever q is entered, or tab is "users", or tab is "all"
      q || tab === "users"
        ? db
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
            .where(userWhere)
            .orderBy(userOrderBy)
            .limit(tab === "users" ? 40 : 8)
        : // If tab is "all" and no query, fetch top 3 featured panelists
          db
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
            .orderBy(
              desc(sql`(select count(*)::int from ${follows} where ${follows.followingId} = ${users.id})`),
            )
            .limit(3),
      currentUser
        ? db
            .select({ followingId: follows.followingId })
            .from(follows)
            .where(eq(follows.followerId, currentUser.id))
        : Promise.resolve([]),
    ]);

    rows = dbTitles;
    genres = [...new Set(allGenres.flatMap((row) => row.genres))].sort((a, b) =>
      a.localeCompare(b),
    );

    const followingSet = new Set(currentUserFollows.map((f) => f.followingId));

    userResults = dbUsers.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      bio: u.bio,
      experienceLevel: u.experienceLevel as ExperienceLevel,
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
      isFollowing: followingSet.has(u.id),
      isSelf: currentUser ? currentUser.id === u.id : false,
    }));
  } catch (err) {
    console.warn("Library DB query fallback:", err);
    // Fallback to static seed data
    const { seedTitles, seedPanels } = await import("@/lib/seed-data");
    rows = seedTitles;
    genres = [...new Set(seedTitles.flatMap((row) => row.genres))].sort((a, b) =>
      a.localeCompare(b),
    );

    const fallbackUsers = [
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
    ];

    const cleanQ = (q.startsWith("@") ? q.slice(1) : q).toLowerCase();
    userResults = fallbackUsers
      .filter(
        (u) =>
          !cleanQ ||
          u.username.toLowerCase().includes(cleanQ) ||
          u.displayName.toLowerCase().includes(cleanQ) ||
          u.bio.toLowerCase().includes(cleanQ),
      )
      .map((u) => {
        const uPanels = seedPanels.filter((p) => p.username === u.username);
        const latest = uPanels[0];
        const t = latest ? seedTitles.find((st) => st.slug === latest.titleSlug) : null;
        return {
          ...u,
          followersCount: u.username === "midwatch_mira" ? 2 : 1,
          reviewsCount: uPanels.length,
          latestReview: latest
            ? {
                headline: latest.headline,
                titleName: t?.name ?? latest.titleSlug,
                rating: latest.rating,
                slug: latest.titleSlug,
              }
            : null,
          isFollowing: false,
          isSelf: false,
        };
      });
  }

  const isLoggedIn = Boolean(currentUser);
  const showUsersSection = (tab === "all" || tab === "users") && (q ? userResults.length > 0 : tab === "users" || userResults.length > 0);
  const showTitlesSection = tab === "all" || tab === "titles";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mono flex items-center gap-3 text-[9px] text-mute">
        <span className="h-px w-10 bg-paper/40" />
        the archive & community search
      </div>
      <h1 className="display mt-5 text-5xl text-paper sm:text-7xl">
        {tab === "users" ? "Panelists & Users" : "Search & Library"}
      </h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-dim">
        Search every anime, manga, and manhwa in the archive — and discover community panelists,
        follow their reading journeys, and read their spoiler-graded reviews.
      </p>

      {/* Filter and search bar */}
      <div className="mt-8">
        <LibraryFilters
          query={{ q, tab, format, genre, level, sort }}
          genres={genres}
          titleCount={rows.length}
          userCount={userResults.length}
        />
      </div>

      {/* ================= USERS SECTION ================= */}
      {showUsersSection ? (
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <h2 className="display text-xl text-paper sm:text-2xl">
                {q ? `Matched Panelists (${userResults.length})` : `Community Panelists (${userResults.length})`}
              </h2>
              <p className="mono mt-1 text-[10px] text-mute">
                Follow panelists to stay updated and see their reviews across titles
              </p>
            </div>
            {tab === "all" && userResults.length > 0 && !q ? (
              <Link
                href="/library?tab=users"
                className="mono text-[10.5px] text-paper hover:underline"
              >
                Browse all panelists →
              </Link>
            ) : null}
          </div>

          {userResults.length === 0 ? (
            <div className="panel mt-6 p-8 text-center">
              <h3 className="display text-xl text-paper">No panelists found</h3>
              <p className="mt-2 text-xs text-dim">
                No user matched &ldquo;{q}&rdquo;. Try searching by username (e.g. @archivist_k or mira).
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userResults.map((user) => (
                <UserSearchResultCard
                  key={user.id}
                  user={user}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* ================= TITLES SECTION ================= */}
      {showTitlesSection ? (
        <section className={showUsersSection ? "mt-14" : "mt-8"}>
          {tab === "all" && userResults.length > 0 ? (
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="display text-xl text-paper sm:text-2xl">
                  Titles & Series ({rows.length})
                </h2>
                <p className="mono mt-1 text-[10px] text-mute">
                  Anime, manga and manhwa titles matching your filters
                </p>
              </div>
            </div>
          ) : null}

          {rows.length === 0 ? (
            <div className="panel mt-6 p-12 text-center">
              <h2 className="display text-2xl text-paper">No titles match that</h2>
              <p className="mt-3 text-[13.5px] text-dim">
                {userResults.length > 0
                  ? `No titles matched "${q}", but matching panelists were found above.`
                  : "Try clearing your filters, or search for a studio like MAPPA, Madhouse or Redice."}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {rows.map((title) => (
                <TitleCard key={title.id} title={title} />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
