import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
})

export async function query(text, params) {
    // use the existing pool for queries
    return pool.query(text, params);
}
