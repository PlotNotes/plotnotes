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

}

async function getRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {

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