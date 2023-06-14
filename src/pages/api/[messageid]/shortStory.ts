import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../db';
import { userLoggedIn } from '../authchecks';
import { continueStory, editExcerpt } from '../prompt';

export default async function storyHistory(req: NextApiRequest, res: NextApiResponse) {

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
        `DELETE FROM shortstories WHERE messageid = $1 AND userid = $2`,
        [messageid, userid]
    );

    res.status(200).send({ response: "success" });
}

async function putRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {
    const messageid = req.query.messageid as string;
    const prompt = req.body.prompt as string;

    // Given the prompt, get the message associated with the messageid and edit the story according to the prompt
    const messageQuery = await query(
        `SELECT message FROM shortstories WHERE messageid = $1 AND userid = $2`,
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
        `INSERT INTO edits (userid, oldmessage, newmessage, messageid, storytype) VALUES ($1, $2, $3, $4, 'shortstory')`,
        [userid, message, newMessage, messageid]
    );

    // Sends the new message information back to the user so they can view it before they submit it
    res.status(200).send({ response: "success" });
}
async function postRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {
    const messageid = req.query.messageid as string;
    const prompt = req.body.prompt as string;

    // Gets the iterationID of the story associated with the given messageID
    const iterationIDQuery = await query(
        `SELECT (iterationid) FROM shortstories WHERE messageid = $1`,
        [messageid]
    );
    const iterationID = (iterationIDQuery.rows[0] as any).iterationid;
    let parentID = "0";
    if (iterationID == 0) {
        parentID = messageid;
    } else {
        // Gets the parentID of the story associated with the given messageID
        const parentIDQuery = await query(
            `SELECT (parentid) FROM shortstories WHERE messageid = $1`,
            [messageid]
        );

        parentID = (parentIDQuery.rows[0] as any).parentid;
    }
    
    // Gets the title of the parent story
    const parentTitle = await getTitle(messageid);
    
    // Gets every previous story in this iteration and puts it in a string array
    const storiesQuery = await query(
        `SELECT (message) FROM shortstories WHERE messageid = $1 OR parentid = $1`,
        [parentID]
    );

    let stories: string[] = [];

    for (let i = 0; i < storiesQuery.rows.length; i++) {
        stories.push((storiesQuery.rows[i] as any).message);        
    }

    const story = await continueStory(prompt, stories, userid);

    // Inserts the new story into the database, adding 1 to the iterationID
    await query(
        `INSERT INTO shortstories (iterationid, userid, message, prompt, title, parentid) VALUES ($1, $2, $3, $4, $5, $6)`,
        [iterationID + 1, userid, story, prompt, parentTitle, parentID]
    );

    const messageIDQuery = await query(
        `SELECT (messageid) FROM shortstories WHERE message = $1`,
        [story]
    );

    const messageID = (messageIDQuery.rows[0] as any).messageid;

    res.status(200).send({ messageID: messageID });
}

async function getRequest(req: NextApiRequest, res: NextApiResponse, userId: string) {
    const messageid = req.query.messageid as string;


    // Checks to see if the messageID belongs to the user requesting it
    const messageIDQuery = await query(
        `SELECT (message) FROM shortstories WHERE userid = $1 AND messageid = $2`,
        [userId, messageid]
    );

    if (messageIDQuery.rows.length == 0) {
        res.status(401).send({ error: "messageID does not belong to user" });
        return;
    }

    // Gets the parent story from the database
    const parentIdQuery = await query(
        `SELECT (parentid) FROM shortstories WHERE messageid = $1`,
        [messageid]
    );
    const parentStoryID = (parentIdQuery.rows[0] as any ).parentid;

    // If there is no parentID, meaning it is 0, then it is the first story and should be returned along with the title
    if (parentStoryID == 0) {
        const parentTitle = await getTitle(messageid);
        res.status(200).send({ stories: [(messageIDQuery.rows[0] as any).message], parentTitle: parentTitle, messageIDs: [messageid] });
        return;
    }

    const parentStoryQuery = await query(
        `SELECT (message) FROM shortstories WHERE messageid = $1`,
        [parentStoryID]
    );
    
    // Returns the parent and every story that has the parentID as the parent as an array of strings, so long as the messageID is
    // less than the given one
    const parentStory = (parentStoryQuery.rows[0] as any).message;
    const childStoriesQuery = await query(
        `SELECT message, messageid FROM shortstories WHERE parentid = $1 AND messageid <= $2`,
        [parentStoryID, messageid]
    );
    const childStories = childStoriesQuery.rows;
    
    let childStoriesArray: string[] = [];
    let messageIDArray: string[] = [];
    messageIDArray.push(parentStoryID);
    for (let i = 0; i < childStories.length; i++) {
        childStoriesArray.push((childStories[i] as any).message);
        messageIDArray.push((childStories[i] as any).messageid);
    }

    const parentTitle = await getTitle(parentStoryID);
    let stories = [];
    stories.push(parentStory);

    for (let i = 0; i < childStoriesArray.length; i++) {
        stories.push(childStoriesArray[i]);
    }

    res.status(200).send({ stories: stories, parentTitle: parentTitle, messageIDs: messageIDArray });
}

async function getTitle(messageid: string): Promise<string> {
    // Gets the title of the parent story
    const parentTitleQuery = await query(
        `SELECT (title) FROM shortstories WHERE messageid = $1`,
        [messageid]
    );
    
    const parentTitle = parentTitleQuery.rows[0];
    return (parentTitle as any).title;
}