import { NextApiRequest, NextApiResponse } from 'next';
import { query } from './db';
import Cookies from 'cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { username, password, usedGoogle, email } = req.body;
    try {
        if (usedGoogle) {
            const sessionId = await signInWithGoogle(username, email);

            const cookie = new Cookies(req, res);

            cookie.set('token', sessionId, {
                httpOnly: true,
            });
            res.status(200).send({ sessionId: sessionId});
        }
        else {
            // Checks to see if a user with the same email already exists
            const emailQuery = await query(
                `SELECT * FROM users WHERE email = $1`,
                [email]
            );
            // If a user with the same email already exists, inform the user
            if (emailQuery.rows.length > 0) {
                res.status(200).send({ error: 'A user with the same email already exists' });
                return;
            }
            const sessionId = await signIn(username, password, email);
            const cookie = new Cookies(req, res);
            cookie.set('token', sessionId, {
                httpOnly: true,
                });

            res.status(200).send(sessionId);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err + ' error in queries' });
    }
}

async function signIn(username: string, password: string, email: string): Promise<string> {

    const addUser = await query(
        `INSERT INTO users (name, usedGoogle, email) VALUES ($1, $2, $3);`,
        [username, false, email]
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

    return createSession(id);
}

async function signInWithGoogle(username: string, email: string): Promise<string> {
    const user = await query(
        `INSERT INTO users (name, usedGoogle, email) VALUES ($1, $2, $3);`,
        [username, true, username]
    );

    const sessionId = await createSession(username);
    return sessionId;
}

export async function createSession(id: string): Promise<string> {
    try {
        const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expireDate = new Date();
        // sets the expiration date to be an hour from now
        expireDate.setHours(expireDate.getHours() + 1);

        const session = await query(
            `INSERT INTO sessions (id, userid, expiredate) VALUES ($1, $2, $3);`,
            [sessionId, id, expireDate]);
        return sessionId;
    } catch (err) {
        console.error(err);
        throw err;
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