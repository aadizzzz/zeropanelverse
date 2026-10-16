import pg from "pg";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);

const pool = new pg.Pool({
  connectionString: match[1],
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("🔍 Checking Realtime Database Counts...");
  const counts = await pool.query(
    "SELECT format, count(*) as count FROM titles GROUP BY format ORDER BY format;"
  );
  console.log("Current Counts:", counts.rows);

  const sampleTitles = await pool.query(
    "SELECT format, name, slug, year, rating, poster_url FROM titles ORDER BY popularity DESC LIMIT 6;"
  );
  console.log("\n⚡ Sample Top Manhwas in DB:");
  const sampleManhwa = await pool.query(
    "SELECT name, slug, year, rating, origin, poster_url FROM titles WHERE format = 'manhwa' ORDER BY popularity DESC LIMIT 6;"
  );
  sampleManhwa.rows.forEach((t) => {
    console.log(`- ${t.name} (${t.year}) ★${t.rating} [${t.origin}] | ${t.slug}`);
  });

  console.log("\n📖 Sample Top Mangas in DB:");
  const sampleManga = await pool.query(
    "SELECT name, slug, year, rating, origin, poster_url FROM titles WHERE format = 'manga' ORDER BY popularity DESC LIMIT 6;"
  );
  sampleManga.rows.forEach((t) => {
    console.log(`- ${t.name} (${t.year}) ★${t.rating} [${t.origin}] | ${t.slug}`);
  });

  await pool.end();
}

main().catch(console.error);
