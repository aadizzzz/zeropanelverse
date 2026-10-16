import pg from "pg";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
if (!match) {
  console.error("No DATABASE_URL found in .env.local");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: match[1],
  ssl: { rejectUnauthorized: false },
});

const GENRE_ACCENTS = {
  Action: { accent: "#f43f5e", soft: "#fda4af", mood: "Kinetic Fury" },
  Adventure: { accent: "#f59e0b", soft: "#fde68a", mood: "Expansive Horizon" },
  Comedy: { accent: "#eab308", soft: "#fef08a", mood: "Satirical Orbit" },
  Drama: { accent: "#3b82f6", soft: "#93c5fd", mood: "Emotional Resonance" },
  Fantasy: { accent: "#a855f7", soft: "#d8b4fe", mood: "Mythic Veil" },
  Horror: { accent: "#dc2626", soft: "#fca5a5", mood: "Gothic Dread" },
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

function cleanText(html) {
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

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

function synthesizeTiers(media, name, synopsis, format) {
  const genres = media.genres || [];
  const primaryGenre = genres[0] || "Story";
  const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : "8.5";
  const epOrCh = media.episodes ? `${media.episodes} episodes` : media.chapters ? `${media.chapters} chapters` : "Standard run";
  const firstSentence = synopsis.split(". ")[0] || synopsis.slice(0, 120);

  return {
    beginner: {
      difficulty: 2,
      spoilerLevel: "none",
      summary: `A high-impact entry into ${primaryGenre.toLowerCase()} storytelling. ${firstSentence}. Accessible narrative pace with immediate stakes.`,
      whyItClicks: `Dynamic visual clarity, charismatic leads, and an immediate hook from chapter/episode one. Rated ${score}/10 by hundreds of thousands worldwide.`,
      startHere: format === "anime" ? "Episode 1 (Original Series)" : "Chapter 1 (Prologue)",
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
      summary: `A layered ${primaryGenre.toLowerCase()} journey that rewards medium literacy. Examines how ${name} navigates character friction, power scaling, and adaptation pacing across ${epOrCh}.`,
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

async function fetchAniListPage(type, country, page, perPage = 50) {
  const query = `
    query ($type: MediaType, $country: CountryCode, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: $type, countryOfOrigin: $country, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          format
          episodes
          chapters
          seasonYear
          startDate { year }
          genres
          averageScore
          popularity
          status
          coverImage { extraLarge large }
          description(asHtml: false)
          studios(isMain: true) { nodes { name } }
          countryOfOrigin
        }
      }
    }
  `;

  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query,
      variables: { type, country, page, perPage },
    }),
  });

  if (!res.ok) {
    throw new Error(`AniList returned HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data?.Page?.media || [];
}

async function seedCategory(format, type, country, count) {
  console.log(`\n⏳ Fetching ${count} ${format.toUpperCase()} from AniList...`);
  const perPage = 50;
  const pages = Math.ceil(count / perPage);
  let totalSaved = 0;

  for (let p = 1; p <= pages; p++) {
    const list = await fetchAniListPage(type, country, p, perPage);
    console.log(`Fetched page ${p}/${pages} (${list.length} items) for ${format}`);

    for (const media of list) {
      const name = media.title?.english || media.title?.romaji || media.title?.native || "Untitled";
      const altName = [media.title?.romaji, media.title?.native].filter(Boolean).filter((n) => n !== name).join(" / ");
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
      const slug = `${slugify(name)}-${media.id}`;
      const posterUrl = media.coverImage?.extraLarge || media.coverImage?.large || null;

      const tiers = synthesizeTiers(media, name, rawSynopsis, format);

      try {
        await pool.query(
          `
          INSERT INTO titles (
            slug, name, alt_name, format, tagline, synopsis, genres, themes,
            year, status, episodes, chapters, studio, origin, age_rating,
            rating, popularity, accent, accent_soft, mood, texture, glyph,
            tiers, streaming_planned, poster_url
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb,
            $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22,
            $23::jsonb, $24, $25
          )
          ON CONFLICT (slug) DO UPDATE SET
            rating = EXCLUDED.rating,
            popularity = EXCLUDED.popularity,
            poster_url = COALESCE(titles.poster_url, EXCLUDED.poster_url),
            episodes = EXCLUDED.episodes,
            chapters = EXCLUDED.chapters;
        `,
          [
            slug,
            name,
            altName.slice(0, 195),
            format,
            tagline,
            synopsis,
            JSON.stringify(genres),
            JSON.stringify(genres.slice(1, 4)),
            year,
            media.status || "Finished",
            media.episodes || 0,
            media.chapters || 0,
            studio.slice(0, 115),
            origin,
            "13+",
            rating,
            popularity,
            palette.accent,
            palette.soft,
            palette.mood,
            texture,
            glyph,
            JSON.stringify(tiers),
            true,
            posterUrl,
          ]
        );
        totalSaved++;
      } catch (err) {
        console.warn(`Failed to insert ${name} (${slug}):`, err.message);
      }
    }
  }

  console.log(`✅ Saved ${totalSaved} ${format} titles.`);
}

async function main() {
  console.log("🚀 Starting Vast Catalog Seeding from AniList...");
  // 100 Anime
  await seedCategory("anime", "ANIME", undefined, 100);
  // 80 Manga
  await seedCategory("manga", "MANGA", "JP", 80);
  // 70 Manhwa
  await seedCategory("manhwa", "MANGA", "KR", 70);

  const counts = await pool.query("SELECT format, count(*) FROM titles GROUP BY format;");
  console.log("\n📊 Realtime Database Counts now:", counts.rows);

  await pool.end();
  console.log("\n🎉 Seeding complete!");
}

main().catch(console.error);
