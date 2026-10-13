import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { titles, type TitleFormat } from "@/db/schema";
import { ensureSeeded } from "@/lib/db-init";
import { TitleCard } from "@/components/TitleCard";
import { LibraryFilters } from "@/components/LibraryFilters";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Library — ZeroPanelVerse",
  description: "Browse every anime, manga and manhwa in the archive with audience-level guides.",
};

const FORMATS: TitleFormat[] = ["anime", "manga", "manhwa"];

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded();
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };

  const q = read("q").trim();
  const format = read("format");
  const genre = read("genre");
  const level = read("level");
  const sort = read("sort") || "popularity";

  const conditions: SQL[] = [];
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
    if (search) conditions.push(search);
  }
  if (FORMATS.includes(format as TitleFormat)) {
    conditions.push(eq(titles.format, format as TitleFormat));
  }
  if (genre) {
    conditions.push(sql`${titles.genres} @> ${JSON.stringify([genre])}::jsonb`);
  }

  const levelOrder =
    level === "beginner"
      ? sql`(${titles.tiers} -> 'beginner' ->> 'difficulty')::int asc`
      : level === "mediocre"
        ? sql`(${titles.tiers} -> 'mediocre' ->> 'difficulty')::int asc`
        : level === "elite"
          ? sql`(${titles.tiers} -> 'elite' ->> 'difficulty')::int desc`
          : null;

  const orderBy =
    levelOrder ??
    (sort === "rating"
      ? desc(titles.rating)
      : sort === "newest"
        ? desc(titles.year)
        : sort === "az"
          ? asc(titles.name)
          : desc(titles.popularity));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, allGenres] = await Promise.all([
    db.select().from(titles).where(where).orderBy(orderBy),
    db.select({ genres: titles.genres }).from(titles),
  ]);

  const genres = [...new Set(allGenres.flatMap((row) => row.genres))].sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mono flex items-center gap-3 text-[9px] text-mute">
        <span className="h-px w-10 bg-paper/40" />
        the archive
      </div>
      <h1 className="display mt-5 text-5xl text-paper sm:text-7xl">Library</h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-dim">
        Every panel in the verse — anime, manga and manhwa — filtered by format, genre and the
        audience level you are reading at. Each card carries a difficulty rating for beginners and
        for elites so you can gauge the commitment before you open it.
      </p>

      <div className="mt-8">
        <LibraryFilters
          query={{ q, format, genre, level, sort }}
          genres={genres}
          resultCount={rows.length}
        />
      </div>

      {rows.length === 0 ? (
        <div className="panel mt-8 p-12 text-center">
          <h2 className="display text-2xl text-paper">No panels match that</h2>
          <p className="mt-3 text-[13.5px] text-dim">
            Try clearing the genre filter, or search for a studio like MAPPA, Madhouse or Redice.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((title) => (
            <TitleCard key={title.id} title={title} />
          ))}
        </div>
      )}
    </div>
  );
}
