import pg from "pg";
import fs from "fs";

const { Pool } = pg;
const env = fs.readFileSync(".env.local", "utf8");
const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);

const pool = new Pool({
  connectionString: match[1],
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const count = await pool.query("SELECT format, count(*) FROM titles GROUP BY format;");
  console.log("Current counts:", count.rows);
  const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'titles';");
  console.log("Columns:", cols.rows.map(r => r.column_name));
  await pool.end();
}
run();
