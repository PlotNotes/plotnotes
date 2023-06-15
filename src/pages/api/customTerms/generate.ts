import { query } from "../db";
import { userLoggedIn } from "../authchecks";
import { NextApiResponse, NextApiRequest } from "next";
import { createEmbedding } from "../openai";
import { createCustomTerm } from "../prompt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const userid = await userLoggedIn(req, res);

    if (userid == "") {
        res.status(401).send({ response: "Not logged in" });
        return;
    }

    if (req.method == "GET") {
        await getRequest(req, res, userid);
    }
}

async function getRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {

    // Gets the term names of all terms the user already has
    const termNamesQuery = await query(
        `SELECT term FROM userterms WHERE userid = $1`,
        [userid]
    );
    const providedTermName = req.headers.term as string;
    const termNames = termNamesQuery.rows.map(row => (row as any).term);

    // Generates a new custom term and context and then adds it to the user's custom terms list
    const { termName, termDescription } = await createCustomTerm(termNames, providedTermName);

    // Inserts the term into the userterms table
    await query(
        `INSERT INTO userterms (userid, term, context) VALUES ($1, $2, $3)`,
        [userid, termName, termDescription]
    );

    // Breaks the context into paragraphs and inserts them into the usercontext table
    const paragraphs = termDescription.split("\n");
    const termIDQuery = await query(
        `SELECT termid FROM userterms WHERE userid = $1 AND term = $2 AND context = $3`,
        [userid, termName, termDescription]
    );

    const termID = (termIDQuery.rows[0] as any).termid;

    for (let i = 1; i <= paragraphs.length; i++) {
        await query(
            `INSERT INTO usercontext (termid, context, sentenceid) VALUES ($1, $2, $3)`,
            [termID, paragraphs[i - 1], i]
        );
    }

    res.status(200).send({ termid: termID })
}