import { Pool } from 'pg';

// create a pool at the top level of your application
const pool = new Pool();

export async function query(text, params) {
    // use the existing pool for queries
    return pool.query(text, params);
}
