import { Pool } from 'pg';

const pool = new Pool();

export async function query(text, params) {
    return pool.query(text, params)
}