import { NextApiRequest, NextApiResponse } from "next";
import { query } from "./db";
import { getUserID } from "./shortStoryCmds";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method == "POST") {
        await addChapter(req, res);
    }
}

async function addChapter(req: NextApiRequest, res: NextApiResponse) {

    try {
        const { sessionid, prompt, story, storyName } = req.body;
        const userID = await getUserID(sessionid);
        console.log("userID: ", userID);
        // Since this is called only for the first chapters of a series, find the largest seriesid in the db and add 1 to it
        const seriesIDQuery = await query(
            `SELECT (seriesid) FROM chapters ORDER BY seriesid DESC LIMIT 1`
        );
        
        let seriesID = 1;

        if (seriesIDQuery.rows.length != 0) {
            seriesID = (seriesIDQuery.rows[0] as any).seriesid + 1;
        }
        console.log("seriesID: ", seriesID);
        const insertChapterQuery = await query(
            `INSERT INTO chapters (seriesid, chapterid, prompt, message, userid, name) VALUES ($1, $2, $3, $4, $5, $6)`,
            [seriesID, 1, prompt, story, userID, storyName]
        );
        console.log("chapter added");
        res.status(200).send({ response: "chapter added" });
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: err });
    }
}
