import { NextApiRequest, NextApiResponse } from 'next';
import { query } from './db';

export default async function insertStory(req: NextApiRequest, res: NextApiResponse) {
    const { sessionId, story } = req.body;

    try {
        const userIdQuery = await query(
            `SELECT (userid) FROM sessions WHERE id = $1`,
            [sessionId]
        );
        const userId = userIdQuery.rows[0].userid;
        console.log(userId)
        const storyIdQuery = await query(
            `INSERT INTO history (userid, message) VALUES ($1, $2)`,
            [userId, story]
        );

        const userHistoryQuery = await query(
            `SELECT (messageID, message) FROM history WHERE userid = $1`,
            [userId]
        );

        console.log(userHistoryQuery.rows[0])
        const storyId = userHistoryQuery.rows;
        res.status(200).send({ storyId: storyId });
    } catch (err) {
        console.error(err);
        throw err;
    }        
}

export async function getStory(storyID: string): Promise<string> {
    try {
        const storyQuery = await query(
            `SELECT (story) FROM stories WHERE id = $1`,
            [storyID]
        );
        const story = storyQuery.rows[0].story;
        return story;
    } catch (err) {
        console.error(err);
        throw err;
    }
}