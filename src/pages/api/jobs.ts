import { NextApiRequest, NextApiResponse } from "next";
import { userLoggedIn } from "./authchecks";
import Queue from "bull";
import { getStory } from "./prompt";
import express from "express";
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { query } from "./db";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Creates a key value pair where the key is the userid and the value is the websocket for each client
let clients: { [key: string]: any } = {};

wss.on('connection', (ws) => {

    let id = "";
    console.log('Client connected');

    // Attaches the generated id to the users cookie

    ws.on('close', () => {
        console.log(`Client ${id} disconnected`);
    });
    
    ws.on('message', (message) => {
      console.log(`Received: ${message}`);
      if (message.toString().startsWith("session:")) {
        id = message.toString().split(": ")[1];
        clients[id] = ws;
        console.log(`id: ${id}`)
      }
    });

});
  
server.listen(8080);

const shortStoryQueue = new Queue("shortStoryQueue");

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

    const { story, storyName } = await getStory(prompt, userid);
    console.log("Story: " + story);
    console.log("Story name: " + storyName);
    console.log("Done processing short story job\n");
    // console.log("Story: " + story);
    // console.log("Story name: " + storyName);
    
    // Waits 5 seconds
    // await new Promise(r => setTimeout(r, 5000));

    // Inserts the story into the database
    console.log("Inserting story into database");

    try {
        const storyIdQuery = await query(
            `INSERT INTO shortstories (userid, message, prompt, title, parentid) VALUES ($1, $2, $3, $4, $5) RETURNING messageid`,
            [userid, story, prompt, storyName, 0]
        );
        
        const messageID = (storyIdQuery.rows[0] as any).messageid;
        console.log("MessageID: " + messageID);
        // Sends the story and storyname to the correct client
        clients[sessionid].send(`story:Your prompt ${prompt} finished generating. messageid:${messageID}`);
        console.log(`Sending story to client ${sessionid}`);

    } catch (err) {
        console.error(err);
    }
});


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    }
}