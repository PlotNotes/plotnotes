import { NextApiRequest, NextApiResponse } from 'next';
import { query } from './db';
import Cookies from 'js-cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method == "POST") {
        await addUser(req, res);
    } else if (req.method == "PUT") {
        await logInUser(req, res);
    } else if (req.method == "DELETE") {
        await logOutUser(req, res);
    }
}

async function logOutUser(req: NextApiRequest, res: NextApiResponse) {
    // Assumes the user has a cookie
    const sessionId = Cookies.get('sessionID');
    
    try {
        await query(
            `DELETE FROM sessions WHERE id = $1`,
            [sessionId]
        );
        res.status(200).send({ response: "success" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "error" });
    }
}

async function logInUser(req: NextApiRequest, res: NextApiResponse) {
    const { username, password } = req.body;
    try {
        
        if (!await userExists(username, password, false)) {
            res.status(200).send({ error: 'user does not exist' });
            return;
        }
        const userId = await getUserId(username);
        if (!await passwordMatches(userId, password)) {
            res.status(200).send({ error: 'password does not match' });
            return;
        }

        // Checks to see if the user already has a session
        const sessionQuery = await query(
            `SELECT * FROM sessions WHERE userid = $1`,
            [userId]
        );

        if (sessionQuery.rows.length != 0) {
            const sessionId = (sessionQuery.rows[0] as any).id;
            res.status(200).send({ sessionId: sessionId});
            return;
        }

        const sessionId = await createSession(`${userId}`);

        res.status(200).send({ sessionId: sessionId});
        return;
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: "error" });
    }
}

async function getUserId(username: string): Promise<number> {
    const userQuery = await query(
        `SELECT (id) FROM users WHERE name = $1`,
        [username]
    );
    return (userQuery.rows[0] as any).id;
}

async function addUser(req: NextApiRequest, res: NextApiResponse) {
    const { username, password, usedGoogle } = req.body;
    try {
        if (usedGoogle) {
            const sessionId = await signInWithGoogle(username);


            // Sets the user's cookie to expire the same day
            Cookies.set('sessionID', sessionId, {
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24,
            });
            res.status(200).send({ sessionId: sessionId});
        }
        else {
            if (await userExists(username, password, usedGoogle)) {
                res.status(200).send({ error: 'A user with the same username already exists' });
                return;
            }
            
            const sessionId = await signUp(username, password);
            Cookies.set('sessionID', sessionId, {
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24,
            });

            res.status(200).send(sessionId);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err + ' error in queries' });
    }
}

async function userExists(username: string, password: string, usedGoogle: boolean): Promise<boolean> {
    const userQuery = await query(
        `SELECT (name) FROM users WHERE name = $1`,
        [username]
    );
    if (userQuery.rows.length == 0) {
        return false;
    }

    return true;
}

async function passwordMatches(userId: number, password: string): Promise<boolean> {
    const passwordQuery = await query(
        `SELECT (password) FROM userpasswords WHERE id = $1`,
        [userId]
    );

    if ((passwordQuery.rows[0] as any).password == password) {
        return true;
    }

    return false;
}

async function signUp(username: string, password: string): Promise<string> {

    await query(
        `INSERT INTO users (name, usedGoogle) VALUES ($1, $2);`,
        [username, false]
    );

    const idQuery = await query(
        `SELECT (id) FROM users WHERE name = $1`,
        [username]
    );
    const id = (idQuery.rows[0] as any).id;
    await query(
        `INSERT INTO userpasswords (id, password) VALUES ($1, $2);`,
        [id, password]
    );
    
    await fetch(`${process.env.ZAPIER_WEBHOOK_URL}`, {
        method: 'POST',
        body: JSON.stringify({
            username,
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    return createSession(id);
}

async function signInWithGoogle(username: string): Promise<string> {

    // Checks to see if the user already exists, if so, just log them in
    const userQuery = await query(
        `SELECT (name) FROM users WHERE name = $1`,
        [username]
    );

    if (userQuery.rows.length != 0) {
        const userIDQuery = await query(
            `SELECT (id) FROM users WHERE name = $1`,
            [username]
        );

        const userID = (userIDQuery.rows[0] as any).id;

        const sessionId = await createSession(userID);
        return sessionId;
    }

    await query(
        `INSERT INTO users (name, usedGoogle) VALUES ($1, $2);`,
        [username, true]
    );

    const userIDQuery = await query(
        `SELECT (id) FROM users WHERE name = $1`,
        [username]
    );

    const userID = (userIDQuery.rows[0] as any).id;
    
    await fetch(`${process.env.ZAPIER_WEBHOOK_URL}`, {
        method: 'POST',
        body: JSON.stringify({
            username,
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const sessionId = await createSession(userID);
    return sessionId;
}

export async function createSession(id: string): Promise<string> {
    try {
        const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expireDate = new Date();
        // sets the expiration date to be an hour from now
        expireDate.setHours(expireDate.getHours() + 1);

        await query(
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
        await query(
            `DELETE FROM sessions WHERE expireDate < $1`,
            [currentDate]
        );
    } catch (err) {
        console.error(err);
        throw err;
    }
}