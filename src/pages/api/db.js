import { Pool } from 'pg';


export async function query(text, params) {
    const pool = new Pool();
    const query = pool.query(text, params)
    pool.end()
    return query;
}