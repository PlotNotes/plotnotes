import { NextApiRequest, NextApiResponse } from 'next';
import { query } from './db';
import { userLoggedIn } from './authchecks';

export default async function insertStory(req: NextApiRequest, res: NextApiResponse) {
    const userid = await userLoggedIn(req, res);

    if (userid == "") {
        res.status(401).send({ response: "Not logged in" });
        return;
    }

    if (req.method == "POST") {
        await postRequest(req, res, userid);
    } else if (req.method == "GET") {
        await getRequest(req, res, userid);
    } else if (req.method == "PUT") {
        await putRequest(req, res, userid);
    } else if (req.method == "DELETE") {
        await deleteRequest(req, res, userid);
    }
}

async function deleteRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {
    const messageid = req.query.messageid as string;

    // Deletes all stories related to the given messageid, starting by getting the parentid
    const parentIDQuery = await query(
        `SELECT (parentid) FROM shortstories WHERE messageid = $1`,
        [messageid]
    );

    let parentID = (parentIDQuery.rows[0] as any).parentid;

    if (parentID == 0) {
        parentID = messageid;
    }

    await query(
        `DELETE FROM shortstories WHERE parentid = $1`,
        [parentID]
    );

    await query(
        `DELETE FROM shortstories WHERE messageid = $1`,
        [parentID]
    );


    res.status(200).send({ response: "success" });
}

async function putRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {

    const story = req.body.story as string;
    const messageid = req.body.messageid as string;
    
    await query(
        `UPDATE shortstories SET message = $1 WHERE messageid = $2 AND userid = $3`,
        [story, messageid, userid]
    );

    res.status(200).send({ response: "story updated" });
}

async function getRequest(req: NextApiRequest, res: NextApiResponse, userId: string) {

    // Returns the stories, checking the iterationID and parentID to keep only the most recent version of each story
    const stories = await updateStories(userId);
    const prompts = await updatePrompts(stories);
    const titles = await updateTitles(stories);
    const messageIDs = await updateMessageIDs(stories);
    

    res.status(200).send({ stories: stories, prompts: prompts, titles: titles, messageIDs: messageIDs });
}


async function updateStories(userID: string): Promise<string[]> {
    const storyQuery = await query(`SELECT (messageid) FROM shortstories WHERE parentid = 0 AND userid = $1`, [userID]);

    // Loops through the stories and makes a query for a message whose parentID is the story's messageID, and replaces the story with the most recent version
    let stories: string[] = [];
    for (let i = 0; i < storyQuery.rows.length; i++) {
        const storyID = (storyQuery.rows[i] as any).messageid;

        const childrenStoryQuery = await query(
            `SELECT (message) FROM shortstories WHERE parentid = $1 ORDER BY iterationid DESC LIMIT 1`,
            [storyID]
        );

        if (childrenStoryQuery.rows.length != 0) {
            stories.push((childrenStoryQuery.rows[0] as any).message);
            continue;
        }

        const parentStoryQuery = await query(
            `SELECT (message) FROM shortstories WHERE messageid = $1`,
            [storyID]
        );

        stories.push((parentStoryQuery.rows[0] as any).message);
    }

    return stories;
}

async function updatePrompts(stories: string[]): Promise<string[]> {

    // For each story in stories, get the prompt from the database and add it to the prompts array
    let prompts: string[] = [];

    for (let i = 0; i < stories.length; i++) {
        const story = stories[i];

        const promptQuery = await query(
            `SELECT (prompt) FROM shortstories WHERE message = $1`,
            [story]
        );

        prompts.push((promptQuery.rows[0] as any).prompt);
    }

    return prompts;
}

async function updateTitles(stories: string[]): Promise<string[]> {

    // For each story in stories, get the title from the database and add it to the titles array
    let titles: string[] = [];

    for (let i = 0; i < stories.length; i++) {
        const story = stories[i];

        const titleQuery = await query(
            `SELECT (title) FROM shortstories WHERE message = $1`,
            [story]
        );

        titles.push((titleQuery.rows[0] as any).title);
    }

    return titles;
}

async function updateMessageIDs(stories: string[]): Promise<string[]> {

    // For each story in stories, get the messageID from the database and add it to the messageIDs array
    let messageIDs: string[] = [];

    for (let i = 0; i < stories.length; i++) {
        const story = stories[i];

        const messageIDQuery = await query(
            `SELECT (messageid) FROM shortstories WHERE message = $1`,
            [story]
        );

        messageIDs.push((messageIDQuery.rows[0] as any).messageid);
    }

    return messageIDs;
}

async function postRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {
    const { story, storyName, prompt, iterationId } = req.body;
    try {
        const storyIdQuery = await query(
            `INSERT INTO shortstories (iterationid, userid, message, prompt, title, parentid) VALUES ($1, $2, $3, $4, $5, $6)`,
            [iterationId, userid, story, prompt, storyName, 0]
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
        const story = (storyQuery.rows[0] as any).story;
        return story;
    } catch (err) {
        console.error(err);
        throw err;
    }
}