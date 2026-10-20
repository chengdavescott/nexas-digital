import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const result = await pool.query(
        "SELECT store_key AS \"storeKey\", data FROM public.nexas_store ORDER BY store_key",
      );
      return res.status(200).json({ entries: result.rows });
    }

    if (req.method === "PUT") {
      const { storeKey, data } = req.body ?? {};
      if (typeof storeKey !== "string" || !storeKey || data === undefined) {
        return res.status(400).json({ error: "storeKey and data are required" });
      }
      await pool.query(
        `INSERT INTO public.nexas_store (store_key, data, updated_at)
         VALUES ($1, $2::jsonb, now())
         ON CONFLICT (store_key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
        [storeKey, JSON.stringify(data)],
      );
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[v0] Neon store request failed", error);
    return res.status(500).json({ error: "Database request failed" });
  }
}
