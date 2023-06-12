import { query } from "./db";
import { userLoggedIn } from "./authchecks";
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
}

async function postRequest(req: NextApiRequest, res: NextApiResponse, userid: string) {

}