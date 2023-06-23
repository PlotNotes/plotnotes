import { NextApiRequest, NextApiResponse } from 'next';
import { query } from './db';
import { getStory } from './prompt';
import { userLoggedIn } from './authchecks';

export default async function insertStory(req: NextApiRequest, res: NextApiResponse) {
    const userid = await userLoggedIn(req, res);

    if (userid == "") {
        res.status(401).send({ response: "Not logged in" });
        return;
    }

    if (req.method == "GET") {
        await getRequest(req, res, userid);
    }

    // if (req.method == "POST") {
    //     await postRequest(req, res, userid);
    // } else if (req.method == "PUT") {
    //     await putRequest(req, res, userid);
    // } else if (req.method == "DELETE") {
    //     await deleteRequest(req, res, userid);
    // }
}

export async function generateShortStory(prompt: string, userid: string) {

    const { story, storyName } = await getStory(prompt, userid);

}

async function deleteRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {
    const messageid = req.headers.messageid as string;

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
    console.log("Getting stories");
    // Returns the stories, checking the iterationID and parentID to keep only the most recent version of each story
    const { stories, prompts, titles, messageIDs } = await updateStories(userId);

    res.status(200).send({ stories: stories, prompts: prompts, titles: titles, messageIDs: messageIDs });
}


async function updateStories(userID: string) {
    console.log("Updating stories");

    // Gets all the stories that the user has written, and with the highest iterationID for each story
    const storyQuery = await query(`WITH numbered_rows AS (
        SELECT 
            message,
            prompt,
            messageid,
            title,
            ROW_NUMBER() OVER(PARTITION BY seriesid ORDER BY iterationid DESC) as row_num
        FROM 
            shortstories
        WHERE 
            userid = $1
    )
    SELECT 
        message,
        prompt,
        messageid,
        title
    FROM 
        numbered_rows
    WHERE 
        row_num = 1;`, [userID]);
    console.log("getting stories and prompts");

    const stories = storyQuery.rows.map((row) => { 
        return (row as any).message;
    });

    const prompts = storyQuery.rows.map((row) => {
        return (row as any).prompt;
    });

    const messageIDs = storyQuery.rows.map((row) => {
        return (row as any).messageid;
    });

    const titles = storyQuery.rows.map((row) => {
        return (row as any).title;
    });
    
    // returns all the stories, prompts, titles, and messageIDs
    return { stories: stories, prompts: prompts, titles: titles, messageIDs: messageIDs };
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
