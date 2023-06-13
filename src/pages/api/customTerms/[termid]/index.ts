import { query } from "../../db";
import { userLoggedIn } from "../../authchecks";
import { NextApiResponse, NextApiRequest } from "next";
import { createEmbedding } from "../../openai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const userid = await userLoggedIn(req, res);

    if (userid == "") {
        res.status(401).send({ response: "Not logged in" });
        return;
    }

    if (req.method == "PUT") {
        await putRequest(req, res, userid);
    } else if (req.method == "GET") {
        await getRequest(req, res, userid);
    } else if (req.method == "DELETE") {
        await deleteRequest(req, res, userid);
    }
}

async function deleteRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {

    // Deletes the term from the userterms table
    const termid = req.query.termid as string;

    await query(
        `DELETE FROM userterms WHERE userid = $1 AND termid = $2`,
        [userid, termid]
    );

    // Deletes all sentences associated with the termid
    await query(
        `DELETE FROM usercontext WHERE termid = $1`,
        [termid]
    );

    res.status(200).send({ response: "success" });
}

async function getRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {

   // Gets the context for the specified term
   const termid = req.query.termid as string;

    const contextQuery = await query(
        `SELECT context, term FROM userterms WHERE userid = $1 AND termid = $2`,
        [userid, termid]
    );

    const term = (contextQuery.rows[0] as any).term;
    const context = (contextQuery.rows[0] as any).context;

    res.status(200).send({ context: context, term: term });
}

async function putRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {
    const termid = req.query.termid as string;
    const context = req.body.context as string;

    await query(
        `UPDATE userterms SET context = $1 WHERE userid = $2 AND termid = $3`,
        [context, userid, termid]
    );

    // Deletes all sentences associated with the termid
    await query(
        `DELETE FROM usercontext WHERE termid = $1`,
        [termid]
    );

    // Breaks the context into individual sentences, and for each sentence, add it to the usercontext table in the database
    const sentences = context.split(". ");
    
    try {
        for (let i = 1; i <= sentences.length; i++) {

            const sentence = sentences[i - 1];
            const embedding = await createEmbedding(sentence);

            await query(
                `INSERT INTO usercontext (context, termid, sentenceid, embedding) VALUES ($1, $2, $3, $4)`,
                [sentence, termid, i, embedding]
            );
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: e });
    }

    res.status(200).send({ response: "success" });
}