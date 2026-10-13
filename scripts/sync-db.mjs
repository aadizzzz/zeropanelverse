import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

// Read DATABASE_URL from .env.local
const envLocalPath = path.join(process.cwd(), ".env.local");
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match) dbUrl = match[1];
}

if (!dbUrl) {
  console.log("No DATABASE_URL found. Skipping remote DB sync.");
  process.exit(0);
}

const sql = neon(dbUrl);

async function sync() {
  const countRes = await sql`SELECT count(*) FROM titles;`;
  console.log("Database connected! Current titles count:", countRes[0].count);

  // Check if jujutsu-kaisen-culling-game exists
  const existingJJK = await sql`SELECT id FROM titles WHERE slug = 'jujutsu-kaisen-culling-game';`;
  console.log("JJK Culling Game in DB:", existingJJK.length > 0 ? "Exists" : "Missing");
}

sync().catch(err => {
  console.error("DB check failed:", err.message);
});
