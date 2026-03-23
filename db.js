import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.TODO_APP_DB_DATABASE_URL,
});

// Attach the pool to ensure idle connections close before suspension
attachDatabasePool(pool);

export { pool };

// This function can now leverage a shared connection pool
export default async function handler(_req, res) {
  const client = await pool.connect();

  try {
    const { rows } = await client.query("SELECT NOW()");
    res.status(200).json({ time: rows[0] });
  } finally {
    client.release();
  }
}
