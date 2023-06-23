import { NextApiRequest, NextApiResponse } from "next";
import { userLoggedIn } from "./authchecks";
import Queue from "bull";
import { getStory, getChapter } from "./prompt";
import { query } from "./db";
import { clients } from "./auth/webSocketServer";

const shortStoryQueue = new Queue("shortStoryQueue");
const chapterQueue = new Queue("chapterQueue");

shortStoryQueue.process(async (job) => {
    console.log("Processing short story job\n\n");
    const prompt = job.data.prompt as string;
    const userid = job.data.userid as string;
    console.log("Prompt: " + prompt);

    const sessionidQuery = await query(
        `SELECT id FROM sessions WHERE userid = $1`,
        [userid]
    );

    const sessionid = (sessionidQuery.rows[0] as any).id;
    console.log("Sessionid: " + sessionid);
    const { story, storyName } = await getStory(prompt, userid);
    console.log("Story: " + story);
    console.log("Story name: " + storyName);
    console.log("Done processing short story job\n");

    console.log("Inserting story into database");

    try {
        const storyIdQuery = await query(
            `INSERT INTO shortstories (userid, message, prompt, title, parentid, iterationid) VALUES ($1, $2, $3, $4, $5, $5) RETURNING messageid`,
            [userid, story, prompt, storyName, 0]
        );
        
        const messageID = (storyIdQuery.rows[0] as any).messageid;
        console.log("MessageID: " + messageID);
        // Sends the story and storyname to the correct client
        clients[sessionid].send(`story:Your prompt "${prompt}" finished generating. :${messageID}`);
        console.log(`Sending story to client ${sessionid}`);

    } catch (err) {
        console.error(err);
    }
});


chapterQueue.process(async (job) => {
    console.log("Processing chapter job\n\n");
    const prompt = job.data.prompt as string;
    const userid = job.data.userid as string;
    console.log("Prompt: " + prompt);

    const sessionidQuery = await query(
        `SELECT id FROM sessions WHERE userid = $1`,
        [userid]
    );

    const sessionid = (sessionidQuery.rows[0] as any).id;
    console.log("Sessionid: " + sessionid);
    const { chapter, storyName } = await getChapter(prompt, userid);
    console.log("Chapter: " + chapter);
    console.log("Story name: " + storyName);
    console.log("Done processing chapter job\n");

    console.log("Inserting chapter into database");
    
    try {

        // Gets the highest seriesid and adds 1 to it
        const seriesIDQuery = await query(
            `SELECT seriesid FROM chapters ORDER BY seriesid DESC LIMIT 1`
        );

        let seriesID = (seriesIDQuery.rows[0] as any).seriesid;
        seriesID = Number(seriesID) + 1;

        const storyIdQuery = await query(
            `INSERT INTO chapters (userid, prompt, message, name, seriesid, chapterid) VALUES ($1, $2, $3, $4, $5, $6) RETURNING messageid`,
            [userid, prompt, chapter, storyName, seriesID, 0]
        );
        
        const messageID = (storyIdQuery.rows[0] as any).messageid;
        console.log("MessageID: " + messageID);
        // Sends the story and storyname to the correct client
        clients[sessionid].send(`story:Your prompt "${prompt}" finished generating. :${messageID}`);
        console.log(`Sending story to client ${sessionid}`);

    } catch (err) {
        console.error(err);
    }
});


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method == "GET") {
        res.status(200).send({ queue: await shortStoryQueue.getJobs(["waiting", "active"]) });
        return;
    }

    console.log("Creating job");
    const userid = await userLoggedIn(req, res);    

    if (userid == "") {
        res.status(401).send({ response: "Not logged in" });
        return;
    }
    console.log("Userid: " + userid);
    createJob(req, userid);

    res.status(200).send({ response: "success" });
}

async function createJob(req: NextApiRequest, userid: string) {

    const method = req.body.method as string;
    console.log("Method: " + method);
    if (method == "shortStory") {
        console.log("Adding short story job");
        shortStoryQueue.add({
            userid: userid,
            prompt: req.body.prompt,
        });
    } else if (method == "chapter") {
        console.log("Adding chapter job");
        chapterQueue.add({
            userid: userid,
            prompt: req.body.prompt,
        });
    }
}