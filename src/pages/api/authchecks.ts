import { query } from "./db";
import { NextApiRequest, NextApiResponse } from "next";


// If the user is logged in, return an object that contains the userid and sessionid, otherwise have them null
export async function userLoggedIn(req: NextApiRequest, res: NextApiResponse): Promise<string> {
    
    let sessionid = "";
    let userid = "";
    try {
        sessionid = req.cookies.sessionID as string;

        if (!sessionid) {            
            return "";
        }

        userid = await getUserID(sessionid);
        
    } catch (e) {
        // If the userid cannot be found from the sessionid, route the user back to the login page
        if (e instanceof TypeError && e.message == "Cannot read properties of undefined (reading 'userid')") {
            return "";
        }
    }

    return userid;
}

export async function getUserID(sessionId: string): Promise<string>
{
    const userIdQuery = await query(
        `SELECT (userid) FROM sessions WHERE id = $1`,
        [sessionId]
    );

    const userId = (userIdQuery.rows[0] as any).userid;
    return userId;
}