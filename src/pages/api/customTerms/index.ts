import { query } from "../db";
import { userLoggedIn } from "../authchecks";
import { NextApiResponse, NextApiRequest } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const userid = await userLoggedIn(req, res);

    if (userid == "") {
        res.status(401).send({ response: "Not logged in" });
        return;
    }

    if (req.method == "POST") {
        await postRequest(req, res, userid);
    } else if (req.method == "GET") {
        await getRequest(req, res, userid);
    }
}

async function getRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {

    // Gets all custom terms associated with the userID
    const customTermsQuery = await query(
        `SELECT term, context, termid FROM userterms WHERE userid = $1`,
        [userid]
    );
    const contexts = customTermsQuery.rows.map((row) => (row as any).context);
    const termids = customTermsQuery.rows.map(row => (row as any).termid);
    const terms = customTermsQuery.rows.map(row => (row as any).term);

    res.status(200).send({ terms: terms, contexts: contexts, termids: termids });
}

async function postRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {

}