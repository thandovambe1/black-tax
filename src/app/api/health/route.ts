import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Health probe. Reports database connectivity but always responds 200 when the
 * application itself is running, so a transient DB blip never takes the
 * deployment down.
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: true, app: "up", database: "not-configured" });
  }

  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, app: "up", database: "connected" });
  } catch (error) {
    console.error("[health] database check failed:", error);
    return Response.json({ ok: true, app: "up", database: "unreachable" });
  }
}
