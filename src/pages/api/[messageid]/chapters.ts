import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../db';
import { userLoggedIn } from '../authchecks';
import { continueChapters } from '../prompt';
import { editExcerpt } from '../prompt';


export default async function chapterHistory(req: NextApiRequest, res: NextApiResponse) {

    const userid = await userLoggedIn(req, res);

    if (userid == "") {
        res.status(401).send({ response: "Not logged in" });
        return;
    }

    if (req.method == "GET") {
        await getRequest(req, res, userid);
    } else if (req.method == "POST") {
        await postRequest(req, res, userid);
    } else if (req.method == "PUT") {
        await putRequest(req, res, userid);
    } else if (req.method == "DELETE") {
        await deleteRequest(req, res, userid);
    }
}

async function deleteRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {
    const messageid = req.query.messageid as string;

    // Deletes the story from the database
    await query(
        `DELETE FROM chapters WHERE messageid = $1 AND userid = $2`,
        [messageid, userid]
    );

    res.status(200).send({ response: "success" });
}

async function putRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {
    const messageid = req.query.messageid as string;
    const prompt = req.body.prompt as string;

    // Given the prompt, get the message associated with the messageid and edit the story according to the prompt
    const messageQuery = await query(
        `SELECT message FROM chapters WHERE messageid = $1 AND userid = $2`,
        [messageid, userid]
    );
    
    if (messageQuery.rows.length == 0) {
        res.status(200).send({ response: "no chapters" });
        return;
    }

    const message = (messageQuery.rows[0] as any).message;
    
    const newMessage = await editExcerpt(message, prompt);
    
    // Inserts the old and new stories into the edits table
    await query(
        `INSERT INTO edits (userid, oldmessage, newmessage, messageid, storytype) VALUES ($1, $2, $3, $4, 'chapter')`,
        [userid, message, newMessage, messageid]
    );

    // Sends the new message information back to the user so they can view it before they submit it
    res.status(200).send({ response: "success" });
}


async function getRequest(req: NextApiRequest, res: NextApiResponse, userId: string) {
    const messageid = req.query.messageid as string;

    // Gets every chapter where the userid is the same as the userid of the chapter with the given messageid, and the messageid is less than or equal to the given messageid
    const seriesIDQuery = await query(
        `SELECT message, name, messageid FROM chapters WHERE seriesid = (SELECT seriesid FROM chapters WHERE messageid = $1) AND chapterid <= (SELECT chapterid FROM chapters WHERE messageid = $1) AND userid = $2 ORDER BY chapterid ASC`,
        [messageid, userId]
    );
    
    if (seriesIDQuery.rows.length == 0) {
        res.status(200).send({ response: "no chapters" });
        return;
    }

    // Returns the chapters, story names, and messageIDs as arrays
    const chapters: string[] = [];
    const storyNames: string[] = [];
    const messageIDs: string[] = [];

    for (let i = 0; i < seriesIDQuery.rows.length; i++) {
        chapters.push((seriesIDQuery.rows[i] as any).message);
        storyNames.push((seriesIDQuery.rows[i] as any).name);
        messageIDs.push((seriesIDQuery.rows[i] as any).messageid);
    }

    res.status(200).send({ chapters: chapters, storyNames: storyNames, messageIDs: messageIDs });
}



async function postRequest(req: NextApiRequest, res: NextApiResponse, userId: string) {
    
    const { prompt, messageid } = req.body;

    // Since the messageid given is the id of the previous message, the messageid will have the needed seriesid and chapterid
    const seriesIDQuery = await query(
        `SELECT seriesid, chapterid FROM chapters WHERE messageid = $1`,
        [messageid]
    );

    const seriesID = (seriesIDQuery.rows[0] as any).seriesid;
    let chapterid = (seriesIDQuery.rows[0] as any).chapterid;
    chapterid = Number(chapterid) + 1;

    // Gets all previous chapters of the story, ordering with the lowest chapterid first
    const chaptersQuery = await query(
        `SELECT message FROM chapters WHERE seriesid = $1 ORDER BY chapterid ASC`,
        [seriesID]
    );

    let chapters: string[] = [];

    for (let i = 0; i < chaptersQuery.rows.length; i++) {
        chapters.push((chaptersQuery.rows[i] as any).message);
    }
    // Generates the next chapter
    const story = await continueChapters(prompt, chapters, userId);

    const storyNameQuery = await query(
        `SELECT name FROM chapters WHERE seriesid = $1 ORDER BY chapterid DESC LIMIT 1`,
        [seriesID]
    );

    let storyName = (storyNameQuery.rows[0] as any).name;
    
    await query(
        `INSERT INTO chapters (seriesid, chapterid, prompt, message, userid, name) VALUES ($1, $2, $3, $4, $5, $6)`,
        [seriesID, chapterid, prompt, story, userId, storyName]
    );

    const newMessageIDQuery = await query(
        `SELECT messageid FROM chapters WHERE seriesid = $1 AND chapterid = $2`,
        [seriesID, chapterid]
    );

    const newMessageID = (newMessageIDQuery.rows[0] as any).messageid;

    res.status(200).send({ messageid: newMessageID });
}