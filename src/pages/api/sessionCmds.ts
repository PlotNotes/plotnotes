import { NextApiRequest, NextApiResponse } from 'next';
import { query } from './db';
import Cookies from 'cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { username, password, usedGoogle } = req.body;
    try {
        if (usedGoogle) {
            const result = await query(
                `INSERT INTO users (name, usedGoogle) VALUES ($1, $2);`,
                [username, usedGoogle]
            );

            const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const expireDate = new Date();
            // sets the expiration date to be an hour from now
            expireDate.setHours(expireDate.getHours() + 1);
            const session = await query(
                `INSERT INTO sessions (id, userid, expiredate) VALUES ($1, $2, $3);`,
                [sessionId, username, expireDate]);
            
            const cookie = new Cookies(req, res);

            cookie.set('token', sessionId, {
                httpOnly: true,
              });
            res.status(200).send({ sessionId: sessionId});
        }
        else {
            const addUser = await query(
                `INSERT INTO users (name, usedGoogle) VALUES ($1, $2);`,
                [username, usedGoogle]
            );

            const idQuery = await query(
                `SELECT (id) FROM users WHERE name = $1`,
                [username]
            );

            const id = idQuery.rows[0].id;
            const addPassword = await query(
                `INSERT INTO userpasswords (id, password) VALUES ($1, $2);`,
                [id, password]
            );

            const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const expireDate = new Date();
            // sets the expiration date to be an hour from now
            expireDate.setHours(expireDate.getHours() + 1);
            const session = await query(
                `INSERT INTO sessions (id, userid, expiredate) VALUES ($1, $2, $3);`,
                [sessionId, username, expireDate]);
                
            const cookie = new Cookies(req, res);
            cookie.set('token', sessionId, {
                httpOnly: true,
                });

            res.status(200).send(addUser.rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err + ' error in queries' });
    }
}

export async function getUser(req: NextApiRequest, res: NextApiResponse) {
    const { username } = req.body;
    try {
        const result = await query(
            `SELECT * FROM users WHERE name = $1`,
            [username]
        );
        res.status(200).send(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err + ' error in queries' });
    }
}

export async function getPassword(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.body;
    try {
        const result = await query(
            `SELECT * FROM userpasswords WHERE id = $1`,
            [id]
        );
        res.status(200).send(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err + ' error in queries' });
    }
}

export async function createSession(req: NextApiRequest, res: NextApiResponse) {
    const expireDate = new Date();
    // sets the expiration date to be an hour from now
    expireDate.setHours(expireDate.getHours() + 1);
    try {
        const result = await query(
            `INSERT INTO sessions (id, expiredate) VALUES ($1, $2);`,
            [req.body, expireDate]
        );
        res.status(200).send(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err + ' error in queries' });
    }
}

export async function getSession(sessionId: string) {
    try {
        const result = await query(
            `SELECT * FROM sessions WHERE id = $1`,
            [sessionId]
        );
        return result;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function deleteExpiredSessions() {
    const currentDate = new Date();
    try {
        const result = await query(
            `DELETE FROM sessions WHERE expireDate < $1`,
            [currentDate]
        );
    } catch (err) {
        console.error(err);
        throw err;
    }
}