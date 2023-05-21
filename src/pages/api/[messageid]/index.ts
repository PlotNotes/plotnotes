import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../db';
import Cookies from 'cookies';
import { getUserID } from '../storyCmds';

export default async function storyHistory(req: NextApiRequest, res: NextApiResponse) {
    if (req.method == "POST")
    {
        // await postRequest(req, res);
    }
    else if (req.method == "GET")
    {
        await getRequest(req, res);
    }
}

async function getRequest(req: NextApiRequest, res: NextApiResponse) {
    const messageid = req.query.messageid;
    const sessionId = req.cookies.token;
    if (!sessionId) {
        res.status(401).send({ response: "no session id" });
        return;
    }

    // Checks to see if the messageID belongs to the user requesting it
    const userId = await getUserID(sessionId);

    const messageIDQuery = await query(
        `SELECT (message) FROM history WHERE userid = $1 AND messageid = $2`,
        [userId, messageid]
    );

    if (messageIDQuery.rows.length == 0) {
        res.status(401).send({ error: "messageID does not belong to user" });
        return;
    }

    // Gets the parent story from the database
    const parentIdQuery = await query(
        `SELECT (parentid) FROM history WHERE messageid = $1`,
        [messageid]
    );
    const parentStoryID = parentIdQuery.rows[0].parentid;
    console.log("parent story id: " + parentStoryID);
    // If there is no parentID, meaning it is 0, then it is the first story and should be returned
    if (parentStoryID == 0) {
        console.log("no parent story");
        res.status(200).send({ response: messageIDQuery.rows[0].message });
        return;
    }

    const parentStoryQuery = await query(
        `SELECT (message) FROM history WHERE messageid = $1`,
        [parentStoryID]
    );
    
    // Returns the parent and every story that has the parentID as the parent as an array of strings
    const parentStory = parentStoryQuery.rows[0].message;
    const childStoriesQuery = await query(
        `SELECT (message) FROM history WHERE parentid = $1`,
        [parentStoryID]
    );

    const childStories = childStoriesQuery.rows;
    const childStoriesArray = [];
    for (let i = 0; i < childStories.length; i++) {
        childStoriesArray.push(childStories[i].message);
    }

    res.status(200).send({ parentStory: parentStory, childStories: childStoriesArray });
}