import { query } from "../db";
import { getUserID } from "../shortStoryCmds";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const sessionid = req.cookies.token as string;
        const userid = await getUserID(sessionid);

        if (req.method == "GET") {
            await getRequest(req, res);
        }
    } catch (e) {
         // If the userid cannot be found from the sessionid, route the user back to the login page
         if (e instanceof TypeError && e.message == "Cannot read properties of undefined (reading 'userid')") {
            res.status(401).send({ response: "no session id" });
            return;
        }
    }
}

async function getRequest(req: NextApiRequest, res: NextApiResponse) {

    // Checks that the user is logged in
    const sessionid = req.cookies.token as string;
    
    if (!sessionid) {
        res.status(401).send({ response: "no session id" });
        return;
    }

    const userid = await getUserID(sessionid);

    // Gets the two stories associated with the user from the edits table
    const editsQuery = await query(
        `SELECT oldmessage, newmessage FROM edits WHERE userid = $1 AND messageid = $2`,
        [userid, req.query.messageid]
    );

    console.log("edits query: " + editsQuery.rows);

    if (editsQuery.rows.length == 0) {
        res.status(404).send({ response: "no edits" });
        return;
    }

    const oldMessage = (editsQuery.rows[0] as any).oldmessage;
    const newMessage = (editsQuery.rows[0] as any).newmessage;

    res.status(200).send({ oldMessage: oldMessage, newMessage: newMessage });
}