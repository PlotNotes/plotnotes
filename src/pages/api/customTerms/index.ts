import { query } from "../db";
import { userLoggedIn } from "../authchecks";
import { NextApiResponse, NextApiRequest } from "next";
import { createEmbedding } from "../openai";

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

    const term = req.body.term as string;
    const context = req.body.context as string;

    // Inserts the term and context into the userterms table
    await query(
        `INSERT INTO userterms (userid, term, context) VALUES ($1, $2, $3)`,
        [userid, term, context]
    );

    // Gets the termid of the term just inserted
    const termidQuery = await query(
        `SELECT termid FROM userterms WHERE userid = $1 AND term = $2`,
        [userid, term]
    );

    const termid = (termidQuery.rows[0] as any).termid;

    // Breaks the context into sentences and inserts them into the usercontext table
    const sentences = context.split(". ");

    for (let i = 1; i <= sentences.length; i++) {
        const embedding = await createEmbedding(sentences[i-1]);
        await query(
            `INSERT INTO usercontext (termid, context, sentenceid, embedding) VALUES ($1, $2, $3, $4)`,
            [termid, sentences[i-1], i, embedding]
        );
    }
}