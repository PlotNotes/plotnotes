import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../db';
import { getUserID } from '../shortStoryCmds';
import { continueChapters } from '../prompt';


export default async function chapterHistory(req: NextApiRequest, res: NextApiResponse) {

    if (req.method == "GET") {
        await getRequest(req, res);
    } else if (req.method == "POST") {
        await postRequest(req, res);
    }
}

async function getRequest(req: NextApiRequest, res: NextApiResponse) {
    const messageid = req.query.messageid as string;
    const sessionId = req.cookies.token;

    if (!sessionId) {
        res.status(401).send({ response: "no session id" });
        return;
    }

    const userId = await getUserID(sessionId);

    // Gets every chapter where the userid is the same as the userid of the chapter with the given messageid, and the messageid is less than or equal to the given messageid
    const seriesIDQuery = await query(
        `SELECT message, name, messageid FROM chapters WHERE seriesid = (SELECT seriesid FROM chapters WHERE messageid = $1) AND chapterid <= (SELECT chapterid FROM chapters WHERE messageid = $1) AND userid = $2 ORDER BY chapterid ASC`,
        [messageid, userId]
    );
    console.log("series id query: " + seriesIDQuery.rows.length);
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

async function postRequest(req: NextApiRequest, res: NextApiResponse) {
    console.log("post request");
    const { prompt, messageid } = req.body;

    const sessionId = req.cookies.token;

    if (!sessionId) {
        res.status(401).send({ response: "no session id" });
        return;
    }

    const userId = await getUserID(sessionId);
    console.log("user id: " + userId);
    // Since the messageid given is the id of the previous message, the messageid will have the needed seriesid and chapterid
    const seriesIDQuery = await query(
        `SELECT seriesid, chapterid FROM chapters WHERE messageid = $1`,
        [messageid]
    );

    const seriesID = (seriesIDQuery.rows[0] as any).seriesid;
    let chapterid = (seriesIDQuery.rows[0] as any).seriesid;
    chapterid = Number(chapterid) + 1;
    console.log("series id: " + seriesID);
    // Gets all previous chapters of the story, ordering with the lowest chapterid first
    const chaptersQuery = await query(
        `SELECT message FROM chapters WHERE seriesid = $1 ORDER BY chapterid ASC`,
        [seriesID]
    );

    let chapters: string[] = [];

    for (let i = 0; i < chaptersQuery.rows.length; i++) {
        chapters.push((chaptersQuery.rows[i] as any).message);
    }
    console.log("chapters: " + chapters);
    // Generates the next chapter
    const story = await continueChapters(prompt, chapters);
    // Inserts the chapter into the db

    const storyNameQuery = await query(
        `SELECT name FROM chapters WHERE seriesid = $1 ORDER BY chapterid DESC LIMIT 1`,
        [seriesID]
    );

    let storyName = (storyNameQuery.rows[0] as any).name;

    console.log("story name: " + storyName);
    console.log("story: " + story);
    console.log("user id: " + userId);
    console.log("chapter id: " + chapterid);
    console.log("series id: " + seriesID);
    
    await query(
        `INSERT INTO chapters (seriesid, chapterid, prompt, message, userid, name) VALUES ($1, $2, $3, $4, $5, $6)`,
        [seriesID, chapterid, prompt, story, userId, storyName]
    );

    res.status(200).send({ response: "success" });
}