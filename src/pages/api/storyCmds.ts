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


    // Returns the stories, checking the iterationID and parentID to keep only the most recent version of each story
    const stories = await updateStories();
    const prompts = await updatePrompts(stories);
    const titles = await updateTitles(stories);
    const messageIDs = await updateMessageIDs(stories);
    

    res.status(200).send({ stories: stories, prompts: prompts, titles: titles, messageIDs: messageIDs });
}


async function updateStories(): Promise<string[]> {
    const storyQuery = await query(`SELECT (messageid) FROM history WHERE parentid = 0`);

    // Loops through the stories and makes a query for a message whose parentID is the story's messageID, and replaces the story with the most recent version
    let stories: string[] = [];
    for (let i = 0; i < storyQuery.rows.length; i++) {
        const storyID = storyQuery.rows[i].messageid;

        const childrenStoryQuery = await query(
            `SELECT (message) FROM history WHERE parentid = $1 ORDER BY iterationid DESC LIMIT 1`,
            [storyID]
        );

        if (childrenStoryQuery.rows.length != 0) {
            stories.push(childrenStoryQuery.rows[0].message);
            continue;
        }

        const parentStoryQuery = await query(
            `SELECT (message) FROM history WHERE messageid = $1`,
            [storyID]
        );

        stories.push(parentStoryQuery.rows[0].message);
    }

    return stories;
}

async function updatePrompts(stories: string[]): Promise<string[]> {

    // For each story in stories, get the prompt from the database and add it to the prompts array
    let prompts: string[] = [];

    for (let i = 0; i < stories.length; i++) {
        const story = stories[i];

        const promptQuery = await query(
            `SELECT (prompt) FROM history WHERE message = $1`,
            [story]
        );

        prompts.push(promptQuery.rows[0].prompt);
    }

    return prompts;
}

async function updateTitles(stories: string[]): Promise<string[]> {

    // For each story in stories, get the title from the database and add it to the titles array
    let titles: string[] = [];

    for (let i = 0; i < stories.length; i++) {
        const story = stories[i];

        const titleQuery = await query(
            `SELECT (title) FROM history WHERE message = $1`,
            [story]
        );

        titles.push(titleQuery.rows[0].title);
    }

    return titles;
}

async function updateMessageIDs(stories: string[]): Promise<string[]> {

    // For each story in stories, get the messageID from the database and add it to the messageIDs array
    let messageIDs: string[] = [];

    for (let i = 0; i < stories.length; i++) {
        const story = stories[i];

        const messageIDQuery = await query(
            `SELECT (messageid) FROM history WHERE message = $1`,
            [story]
        );

        messageIDs.push(messageIDQuery.rows[0].messageid);
    }

    return messageIDs;
}

async function postRequest(req: NextApiRequest, res: NextApiResponse) {
    const { sessionId, story, storyName, prompt, iterationId } = req.body;
    try {
        const userId = await getUserID(sessionId);
        const storyIdQuery = await query(
            `INSERT INTO history (iterationid, userid, message, prompt, title, parentid) VALUES ($1, $2, $3, $4, $5, $6)`,
            [iterationId, userId, story, prompt, storyName, 0]
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

export async function getUserID(sessionId: string): Promise<string>
{
    const userIdQuery = await query(
        `SELECT (userid) FROM sessions WHERE id = $1`,
        [sessionId]
    );

    const userId = userIdQuery.rows[0].userid;
    return userId;
}