import { query } from './db';

export default async function handler(req, res) {
    const { username, password, usedGoogle } = req.body;
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 1);
    try {
        if (usedGoogle) {
            const result = await query(
                `INSERT INTO users (name, usedGoogle, expireDate) VALUES ($1, $2, $3);`,
                [username, usedGoogle, expireDate]
            );
            res.status(200).json(result.rows[0]);
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

            res.status(200).json(addUser.rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message + ' error in queries' });
    }
}