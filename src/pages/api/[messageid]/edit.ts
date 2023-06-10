import { query } from "../db";
import { userLoggedIn } from "../authchecks";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
        const userid  = await userLoggedIn(req, res);

        if (userid == "") {
            res.status(401).send({ response: "Not logged in" });
            return;
        }

        if (req.method == "GET") {
            await getRequest(req, res, userid);
        } else if (req.method == "POST") {
            await postRequest(req, res, userid);
        }
}

async function postRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {
    console.log("post request");
    // Determines if the user accepted or rejected the edit along with the table they are editing
    const { accept, table } = req.body;
    const messageid = req.query.messageid as string;
    
    // If the user accepted the edit, retrieve the new message from the edits table and then add it to the table
    if (accept) {
        console.log("accept");
        const newMessageQuery = await query(
            `SELECT newmessage FROM edits WHERE userid = $1 AND messageid = $2 AND storytype = $3`,
            [userid, messageid, table]
        );
        console.log('userid: ' + userid + ' messageid: ' + messageid + ' table: ' + table)
        const newMessage = (newMessageQuery.rows[0] as any).newmessage;

        if (table == "shortstory") {
            await query(
                `UPDATE shortstories SET message = $1 WHERE messageid = $2`,
                [newMessage, messageid]
            );
        } else if (table == "chapter") {
            await query(
                `UPDATE chapters SET message = $1 WHERE messageid = $2`,
                [newMessage, messageid]
            );
        }
    } 
    console.log("removing from edits")
    // Deletes the edit from the edits table
    await query(
        `DELETE FROM edits WHERE userid = $1 AND messageid = $2`,
        [userid, messageid]
    );

    res.status(200).send({ response: "success" });
}

async function getRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {

    // Gets the two stories associated with the user from the edits table
    const editsQuery = await query(
        `SELECT oldmessage, newmessage FROM edits WHERE userid = $1 AND messageid = $2`,
        [userid, req.query.messageid]
    );

    if (editsQuery.rows.length == 0) {
        res.status(404).send({ response: "no edits" });
        return;
    }

    const oldMessage = (editsQuery.rows[0] as any).oldmessage;
    const newMessage = (editsQuery.rows[0] as any).newmessage;

    res.status(200).send({ oldMessage: oldMessage, newMessage: newMessage });
}