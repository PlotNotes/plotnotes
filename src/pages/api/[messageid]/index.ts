import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../db';
import Cookies from 'cookies';
import { getUserID } from '../storyCmds';
import { continueStory } from '../prompt';

export default async function storyHistory(req: NextApiRequest, res: NextApiResponse) {
    if (req.method == "GET") {
        await getRequest(req, res);
    } else if (req.method == "POST") {
        await postRequest(req, res);
    }
}

async function postRequest(req: NextApiRequest, res: NextApiResponse) {
    const messageid = req.query.messageid as string;
    const prompt = req.body.prompt as string;
    const sessionId = req.cookies.token;

    if (!sessionId) {
        res.status(401).send({ response: "no session id" });
        return;
    }

    const userId = await getUserID(sessionId);

    // Gets the iterationID of the story associated with the given messageID
    const iterationIDQuery = await query(
        `SELECT (iterationid) FROM history WHERE messageid = $1`,
        [messageid]
    );
    const iterationID = (iterationIDQuery.rows[0] as any).iterationid;
    let parentID = "0";
    if (iterationID == 0) {
        parentID = messageid;
    } else {
        // Gets the parentID of the story associated with the given messageID
        const parentIDQuery = await query(
            `SELECT (parentid) FROM history WHERE messageid = $1`,
            [messageid]
        );

        parentID = (parentIDQuery.rows[0] as any).parentid;
    }

    // Gets the title of the parent story
    const parentTitle = await getTitle(messageid);

    // Gets every previous story in this iteration and puts it in a string array
    const storiesQuery = await query(
        `SELECT (message) FROM history WHERE messageid = $1 OR parentid = $1`,
        [parentID]
    );

    let stories: string[] = [];

    for (let i = 0; i < storiesQuery.rows.length; i++) {
        stories.push((storiesQuery.rows[i] as any).message);
    }

    const story = await continueStory(prompt, stories);

    // Inserts the new story into the database, adding 1 to the iterationID
    await query(
        `INSERT INTO history (iterationid, userid, message, prompt, title, parentid) VALUES ($1, $2, $3, $4, $5, $6)`,
        [iterationID + 1, userId, story, prompt, parentTitle, parentID]
    );

    const messageIDQuery = await query(
        `SELECT (messageid) FROM history WHERE message = $1`,
        [story]
    );

    const messageID = (messageIDQuery.rows[0] as any).messageid;

    res.status(200).send({ messageID: messageID });
}

async function getRequest(req: NextApiRequest, res: NextApiResponse) {
    const messageid = req.query.messageid as string;
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
    console.log(parentIdQuery.rows);
    const parentStoryID = (parentIdQuery.rows[0] as any ).parentid;

    // If there is no parentID, meaning it is 0, then it is the first story and should be returned along with the title
    if (parentStoryID == 0) {
        const parentTitle = await getTitle(messageid);
        res.status(200).send({ stories: [(messageIDQuery.rows[0] as any).message], parentTitle: parentTitle, messageIDs: [messageid] });
        return;
    }

    const parentStoryQuery = await query(
        `SELECT (message) FROM history WHERE messageid = $1`,
        [parentStoryID]
    );
    
    // Returns the parent and every story that has the parentID as the parent as an array of strings, so long as the messageID is
    // less than the given one
    const parentStory = (parentStoryQuery.rows[0] as any).message;
    const childStoriesQuery = await query(
        `SELECT (message, messageid) FROM history WHERE parentid = $1 AND messageid <= $2`,
        [parentStoryID, messageid]
    );
    const childStories = childStoriesQuery.rows;
    const childStoriesArray = [];

    const messageIDArray = [];
    messageIDArray.push(parentStoryID)
    for (let i = 0; i < childStories.length; i++) {
        const messageId = (childStories[i] as any).row.split(',').pop().trim().replace(')', ''); // This gets the message ID
        let message = (childStories[i] as any).row.split(',"')[0].trim().replace('("', ''); // This gets the message
        const removeIndex = message.lastIndexOf('",');
        message = message.substring(0, removeIndex);
        childStoriesArray.push(message);
        messageIDArray.push(messageId);
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
        `SELECT (title) FROM history WHERE messageid = $1`,
        [messageid]
    );
    
    const parentTitle = parentTitleQuery.rows[0];
    return (parentTitle as any).title;
}