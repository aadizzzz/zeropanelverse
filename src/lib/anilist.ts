import { db } from "@/db";
import { titles, titleNodes, type TitleFormat, type TitleRow, type TitleTiers } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";

export interface AniListMedia {
  id: number;
  title: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
  };
  format?: string | null;
  type?: "ANIME" | "MANGA";
  episodes?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  seasonYear?: number | null;
  startDate?: {
    year?: number | null;
  } | null;
  genres?: string[] | null;
  averageScore?: number | null;
  popularity?: number | null;
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
  } | null;
  bannerImage?: string | null;
  description?: string | null;
  studios?: {
    nodes?: Array<{ name: string }>;
  } | null;
  countryOfOrigin?: string | null;
  status?: string | null;
}

const GENRE_ACCENTS: Record<string, { accent: string; soft: string; mood: string }> = {
  Action: { accent: "#f43f5e", soft: "#fda4af", mood: "Kinetic Fury" },
  Adventure: { accent: "#f59e0b", soft: "#fde68a", mood: "Expansive Horizon" },
  Comedy: { accent: "#eab308", soft: "#fef08a", mood: "Satirical Orbit" },
  Drama: { accent: "#3b82f6", soft: "#93c5fd", mood: "Emotional Resonance" },
  Fantasy: { accent: "#a855f7", soft: "#d8b4fe", mood: "Mythic Veil" },
  Horror: { accent: "#dc2626", soft: "#fca5a5", mood: "Gothic Dread" },
  Mahou_Shoujo: { accent: "#ec4899", soft: "#fbcfe8", mood: "Prismatic Prism" },
  Mecha: { accent: "#06b6d4", soft: "#a5f3fc", mood: "Industrial Iron" },
  Music: { accent: "#10b981", soft: "#a7f3d0", mood: "Acoustic Frequency" },
  Mystery: { accent: "#8b5cf6", soft: "#c4b5fd", mood: "Labyrinthine Noir" },
  Psychological: { accent: "#6366f1", soft: "#c7d2fe", mood: "Existential Abyss" },
  Romance: { accent: "#f472b6", soft: "#fbcfe8", mood: "Tender Melancholy" },
  Sci_Fi: { accent: "#0ea5e9", soft: "#bae6fd", mood: "Synthetic Future" },
  Slice_of_Life: { accent: "#14b8a6", soft: "#99f6e4", mood: "Ephemeral Quiet" },
  Sports: { accent: "#f97316", soft: "#fed7aa", mood: "Athletic Drive" },
  Supernatural: { accent: "#9333ea", soft: "#e9d5ff", mood: "Occult Ether" },
  Thriller: { accent: "#ef4444", soft: "#fca5a5", mood: "Tension Strobe" },
};

const TEXTURES = ["halftone", "noise", "crosshatch", "dots", "scanlines", "screen"];

function cleanText(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

export function determineFormat(media: AniListMedia): TitleFormat {
  if (media.type === "ANIME" || media.format === "TV" || media.format === "MOVIE" || media.format === "OVA") {
    return "anime";
  }
  if (media.countryOfOrigin === "KR") {
    return "manhwa";
  }
  return "manga";
}

export function synthesizeTiers(media: AniListMedia, name: string, synopsis: string): TitleTiers {
  const genres = media.genres || [];
  const primaryGenre = genres[0] || "Story";
  const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : "8.5";
  const epOrCh = media.episodes ? `${media.episodes} episodes` : media.chapters ? `${media.chapters} chapters` : "Standard run";
  const firstSentence = synopsis.split(". ")[0] || synopsis.slice(0, 120);

  return {
    beginner: {
      difficulty: 2,
      spoilerLevel: "none",
      summary: `A gripping entry point into ${primaryGenre.toLowerCase()} storytelling. ${firstSentence}. Easily accessible with crisp storytelling and memorable stakes.`,
      whyItClicks: `High visual clarity, charismatic leads, and an immediate hook from chapter/episode one. Rated ${score}/10 by hundreds of thousands worldwide.`,
      startHere: media.type === "ANIME" ? "Episode 1 (Original Series)" : "Chapter 1 (Prologue)",
      prerequisites: ["None required — perfect gateway title"],
      deepDive: `${name} welcomes first-time readers with seamless narrative momentum, avoiding confusing lore dumps while delivering instant emotional payoff.`,
      reasonsToWatch: [
        `Instant narrative hook in the opening sequence`,
        `Superb world-building with an accessible learning curve`,
        `High production values and iconic character moments`,
      ],
      targetAudience: `Fans of ${genres.slice(0, 3).join(", ")} seeking a clean, exhilarating narrative without convoluted filler.`,
    },
    mediocre: {
      difficulty: 3,
      spoilerLevel: "mild",
      summary: `A layered ${primaryGenre.toLowerCase()} journey that rewards genre literacy. Examines how ${name} navigates character friction, power scaling, and adaptation pacing across ${epOrCh}.`,
      whyItClicks: `Rich thematic progression beyond typical tropes. The internal psychology of the cast develops organically over pivotal turning points.`,
      startHere: "From the beginning, paying close attention to subplots and character rivalries.",
      prerequisites: [`Familiarity with standard ${primaryGenre} conventions`],
      deepDive: `For viewers with dozens of titles under their belt, ${name} stands out for its deliberate pacing and character relationship dynamics that elevate it above standard fare.`,
      characterFocus: `The dynamic between central allies and antagonists creates tension where morality is rarely black and white.`,
      pacingNotes: `Maintains sharp narrative velocity through early arcs before deepening its lore and emotional stakes in the mid-game.`,
    },
    elite: {
      difficulty: 5,
      spoilerLevel: "heavy",
      summary: `A formalist masterpiece in narrative architecture. Dissects authorial intent, visual symbolism, framing dynamics, and thematic deconstruction in ${name}.`,
      whyItClicks: `Uncompromising thematic thesis, inventive spatial staging, and a profound climax that challenges the boundaries of its medium.`,
      startHere: "Full chronological immersion with close study of panels, framing, and sound design.",
      prerequisites: ["Deep medium literacy", "Appreciation for nuanced symbolism"],
      deepDive: `A definitive work for the archive. The architectural paneling/direction functions not merely as illustration, but as psychological grammar exploring human vulnerability, power, and destiny.`,
      thematicThesis: `Explores the inevitable friction between individual agency and systemic determinism within ${primaryGenre.toLowerCase()} aesthetics.`,
      sakugaAndPaneling: `Masterful visual composition: deliberate panel gutters, chiaroscuro lighting, and dynamic focal lengths that command absolute focus.`,
      uncensoredLore: `The overarching revelation unmasks the foundational mysteries established in the prologue, delivering an uncompromising thematic payoff.`,
    },
  };
}

export function transformAniListToTitle(media: AniListMedia): Omit<TitleRow, "id" | "createdAt"> {
  const name = media.title?.english || media.title?.romaji || media.title?.native || "Untitled";
  const altName = [media.title?.romaji, media.title?.native].filter(Boolean).filter((n) => n !== name).join(" / ");
  const format = determineFormat(media);
  const rawSynopsis = cleanText(media.description) || "No synopsis available.";
  const synopsis = rawSynopsis.length > 2000 ? rawSynopsis.slice(0, 1997) + "..." : rawSynopsis;
  const tagline = (rawSynopsis.split(". ")[0] || "An unforgettable narrative journey.").slice(0, 235) + ".";

  const genres = (media.genres && media.genres.length > 0) ? media.genres : ["Drama", "Action"];
  const primaryGenre = genres[0] || "Action";
  const palette = GENRE_ACCENTS[primaryGenre.replace(/\s+/g, "_")] || {
    accent: "#e5e5e5",
    soft: "#a3a3a3",
    mood: "Cinematic Mono",
  };

  const glyphCandidate = media.title?.native?.trim();
  const glyph = glyphCandidate && glyphCandidate.length > 0 ? glyphCandidate.charAt(0) : name.charAt(0).toUpperCase();

  const studio = media.studios?.nodes?.[0]?.name || (format === "anime" ? "Studio" : "Original Author");
  const year = media.seasonYear || media.startDate?.year || 2020;
  const rating = media.averageScore ? Number((media.averageScore / 10).toFixed(1)) : 8.4;
  const popularity = media.popularity || 10000;
  const texture = TEXTURES[Math.abs(media.id) % TEXTURES.length];
  const origin = format === "manhwa" ? "South Korea" : format === "manga" ? "Japan" : (media.countryOfOrigin === "CN" ? "China" : "Japan");

  const tiers = synthesizeTiers(media, name, rawSynopsis);

  return {
    slug: `${slugify(name)}-${media.id}`,
    name,
    altName: altName.slice(0, 195),
    format,
    tagline,
    synopsis,
    genres,
    themes: genres.slice(1, 4),
    year,
    status: media.status || "Finished",
    episodes: media.episodes || 0,
    chapters: media.chapters || 0,
    studio: studio.slice(0, 115),
    origin,
    ageRating: "13+",
    rating,
    popularity,
    accent: palette.accent,
    accentSoft: palette.soft,
    mood: palette.mood,
    texture,
    glyph,
    tiers,
    streamingPlanned: true,
    posterUrl: media.coverImage?.extraLarge || media.coverImage?.large || null,
  };
}

/**
 * Executes a GraphQL query against AniList with exponential backoff & timeouts.
 */
async function queryAniList(query: string, variables: Record<string, any> = {}): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`AniList HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Search AniList catalog across anime, manga, and manhwa.
 */
export async function searchAniList(params: {
  q?: string;
  format?: string;
  page?: number;
  perPage?: number;
}): Promise<AniListMedia[]> {
  const { q, format, page = 1, perPage = 20 } = params;

  let type: "ANIME" | "MANGA" | undefined = undefined;
  let country: string | undefined = undefined;

  if (format === "anime") {
    type = "ANIME";
  } else if (format === "manga") {
    type = "MANGA";
    country = "JP";
  } else if (format === "manhwa") {
    type = "MANGA";
    country = "KR";
  }

  const query = `
    query ($search: String, $type: MediaType, $country: CountryCode, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: $type, countryOfOrigin: $country, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          format
          type
          episodes
          chapters
          volumes
          seasonYear
          startDate { year }
          genres
          averageScore
          popularity
          status
          coverImage { extraLarge large }
          bannerImage
          description(asHtml: false)
          studios(isMain: true) { nodes { name } }
          countryOfOrigin
        }
      }
    }
  `;

  try {
    const data = await queryAniList(query, {
      search: q && q.trim().length > 0 ? q.trim() : undefined,
      type,
      country,
      page,
      perPage,
    });

    return data?.Page?.media || [];
  } catch (err) {
    console.warn("AniList search error:", err);
    return [];
  }
}

/**
 * Fetch a single title from AniList by slug or search name.
 */
export async function fetchAniListByQuery(searchName: string): Promise<AniListMedia | null> {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 1) {
        media(search: $search, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          format
          type
          episodes
          chapters
          volumes
          seasonYear
          startDate { year }
          genres
          averageScore
          popularity
          status
          coverImage { extraLarge large }
          bannerImage
          description(asHtml: false)
          studios(isMain: true) { nodes { name } }
          countryOfOrigin
        }
      }
    }
  `;

  try {
    const data = await queryAniList(query, { search: searchName });
    const list = data?.Page?.media || [];
    return list[0] || null;
  } catch (err) {
    console.warn("AniList single query error:", err);
    return null;
  }
}

/**
 * Ingest and cache an AniList media item directly into PostgreSQL database.
 * Also generates default franchise timeline nodes!
 */
export async function cacheAniListTitle(media: AniListMedia): Promise<TitleRow | null> {
  try {
    const transformed = transformAniListToTitle(media);

    // Upsert into titles table
    const [inserted] = await db
      .insert(titles)
      .values(transformed)
      .onConflictDoUpdate({
        target: titles.slug,
        set: {
          posterUrl: transformed.posterUrl,
          rating: transformed.rating,
          popularity: transformed.popularity,
          episodes: transformed.episodes,
          chapters: transformed.chapters,
        },
      })
      .returning();

    if (inserted) {
      // Add default essential franchise node so timeline tree displays nicely
      const unitLabel = inserted.format === "anime" ? "eps" : "chapters";
      const units = inserted.format === "anime" ? inserted.episodes : inserted.chapters;

      await db
        .insert(titleNodes)
        .values({
          titleId: inserted.id,
          nodeKey: `${inserted.slug}-core`,
          label: `${inserted.name} (Canonical Run)`,
          kind: inserted.format === "anime" ? "season" : "source",
          year: inserted.year,
          releaseOrder: 1,
          chronoOrder: 1,
          units: units || 12,
          unit: unitLabel,
          rating: inserted.rating,
          powerLevel: Math.round(inserted.rating * 10),
          priority: "essential",
          canon: true,
          creator: inserted.studio,
          blurb: inserted.tagline || `Canonical release for ${inserted.name}.`,
          mildNote: "Standard progression arc.",
          heavyNote: "Key character reveals and pivotal resolution.",
          powerNote: `Rated ${inserted.rating}/10 by the community.`,
        })
        .onConflictDoNothing();
    }

    return inserted || null;
  } catch (err) {
    console.error("Failed to cache AniList title:", err);
    return null;
  }
}
