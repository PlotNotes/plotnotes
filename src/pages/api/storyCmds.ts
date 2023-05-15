import { NextApiRequest, NextApiResponse } from 'next';
import { query } from './db';
import Cookies from 'cookies';

export default async function insertStory(req: NextApiRequest, res: NextApiResponse) {
    if (req.method == "POST")
    {
        await postRequest(req, res);
    }
    else if (req.method == "GET")
    {
        await getRequest(req, res);
    }
}

async function getRequest(req: NextApiRequest, res: NextApiResponse) {
    // Gets the sessionId from the cookie
    const sessionId = req.cookies.token;
    if (!sessionId) {
        res.status(401).send({ response: "no session id" });
        return;
    }

    const userId = await getUserID(sessionId);

    // Gets all stories attached to the userId
    const storyQuery = await query(
        `SELECT (message, prompt, title) FROM history WHERE userid = $1`,
        [userId]
    );

    // Returns the stories
    const stories = storyQuery.rows;
    res.status(200).send({ history: stories });
}


async function postRequest(req: NextApiRequest, res: NextApiResponse) {
    const { sessionId, story, storyName, prompt } = req.body;

    try {
        const userId = await getUserID(sessionId);
        const storyIdQuery = await query(
            `INSERT INTO history (userid, message, prompt, title) VALUES ($1, $2, $3, $4)`,
            [userId, story, prompt, storyName]
        );

        res.status(200).send({ response: "success" });
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

async function getUserID(sessionId: string): Promise<string>
{
    const userIdQuery = await query(
        `SELECT (userid) FROM sessions WHERE id = $1`,
        [sessionId]
    );

    const userId = userIdQuery.rows[0].userid;
    return userId;
}