import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const pg = await import("pg");
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    const result = await pool.query("SELECT current_database() as db, version() as ver");
    await pool.end();
    return Response.json({ success: true, db: result.rows[0].db, version: result.rows[0].ver });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
