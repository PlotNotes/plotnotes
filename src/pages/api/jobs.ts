import { NextApiRequest, NextApiResponse } from "next";
import { userLoggedIn } from "./authchecks";
import Queue from "bull";
import { getStory } from "./prompt";
import express from "express";
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
console.log("Websocket server created");
console.log(wss);
wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('close', () => {
      console.log('Client disconnected');
    });
    
    ws.on('message', (message) => {
      console.log(`Received: ${message}`);
    });
});
  
server.listen(8080);

const shortStoryQueue = new Queue("shortStoryQueue");

shortStoryQueue.process(async (job) => {
    console.log("Processing short story job\n\n");
    const prompt = job.data.prompt as string;
    const userid = job.data.userid as string;
    console.log("Prompt: " + prompt);

    // const { story, storyName } = await getStory(prompt, userid);
    
    console.log("Done processing short story job\n");
    // console.log("Story: " + story);
    // console.log("Story name: " + storyName);
    
    // Sends the story and storyname to the correct client
    
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