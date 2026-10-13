import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { titles, type TitleFormat } from "@/db/schema";
import { ensureSeeded } from "@/lib/db-init";

export const dynamic = "force-dynamic";

const FORMATS: TitleFormat[] = ["anime", "manga", "manhwa"];

export async function GET(request: Request) {
  await ensureSeeded();
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const format = url.searchParams.get("format") ?? "";
  const genre = url.searchParams.get("genre") ?? "";
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit")) || 20));

  const conditions: SQL[] = [];
  if (q) {
    const like = `%${q}%`;
    const search = or(
      ilike(titles.name, like),
      ilike(titles.altName, like),
      ilike(titles.studio, like),
      sql`${titles.genres}::text ilike ${like}`,
    );
    if (search) conditions.push(search);
  }
  if (FORMATS.includes(format as TitleFormat)) {
    conditions.push(eq(titles.format, format as TitleFormat));
  }
  if (genre) {
    conditions.push(sql`${titles.genres} @> ${JSON.stringify([genre])}::jsonb`);
  }

  const rows = await db
    .select({
      id: titles.id,
      slug: titles.slug,
      name: titles.name,
      format: titles.format,
      year: titles.year,
      rating: titles.rating,
      genres: titles.genres,
      accent: titles.accent,
      mood: titles.mood,
    })
    .from(titles)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(titles.name), desc(titles.popularity))
    .limit(limit);

  return Response.json({ count: rows.length, titles: rows });
}
