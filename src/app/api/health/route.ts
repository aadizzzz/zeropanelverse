import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeeded } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    let seeded = true;
    try {
      await ensureSeeded();
    } catch {
      seeded = false;
    }
    return Response.json({ ok: true, seeded, service: "zeropanelverse" });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
