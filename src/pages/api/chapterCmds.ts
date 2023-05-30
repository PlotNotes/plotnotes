import { NextApiRequest, NextApiResponse } from "next";
import { query } from "./db";
import { getUserID } from "./shortStoryCmds";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method == "POST") {
        await addChapter(req, res);
    } else if (req.method == "GET") {
        await getChapter(req, res);
    }
}

async function getChapter(req: NextApiRequest, res: NextApiResponse) {
    const sessionid = req.cookies.token;

    if (!sessionid) {
        res.status(401).send({ response: "no session id" });
        return;
    }

    const userID = await getUserID(sessionid);

    // Gets all chapters associated with the userID and has the highest chapterid
    const chapterQuery = await query(
        `SELECT message, name, messageid FROM chapters WHERE userid = $1 ORDER BY chapterid DESC LIMIT 1`,
        [userID]
    );

    if (chapterQuery.rows.length == 0) {
        res.status(200).send({ response: "no chapters" });
        return;
    }
    // Returns the chapters, story names, and messageIDs as arrays
    const chapters: string[] = [];
    const storyNames: string[] = [];
    const messageIDs: string[] = [];

    for (let i = 0; i < chapterQuery.rows.length; i++) {
        chapters.push((chapterQuery.rows[i] as any).message);
        storyNames.push((chapterQuery.rows[i] as any).name);
        messageIDs.push((chapterQuery.rows[i] as any).messageid);
    }

    res.status(200).send({ chapters: chapters, storyNames: storyNames, messageIDs: messageIDs });

}

async function addChapter(req: NextApiRequest, res: NextApiResponse) {

    try {
        const { sessionid, prompt, story, storyName } = req.body;
        const userID = await getUserID(sessionid);

        // Since this is called only for the first chapters of a series, find the largest seriesid in the db and add 1 to it
        const seriesIDQuery = await query(
            `SELECT (seriesid) FROM chapters ORDER BY seriesid DESC LIMIT 1`
        );
        
        let seriesID = 1;

        if (seriesIDQuery.rows.length != 0) {
            seriesID = (seriesIDQuery.rows[0] as any).seriesid;
            seriesID = Number(seriesID) + 1;
        }

        const insertChapterQuery = await query(
            `INSERT INTO chapters (seriesid, chapterid, prompt, message, userid, name) VALUES ($1, $2, $3, $4, $5, $6)`,
            [seriesID, 1, prompt, story, userID, storyName]
        );

        res.status(200).send({ response: "chapter added" });
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: err });
    }
}
