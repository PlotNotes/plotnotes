import { NextApiRequest, NextApiResponse } from "next";
import { getSession, createSession, deleteExpiredSessions } from './queries'
import cookie from 'cookie'

export default async function loadSession(req:NextApiRequest, res:NextApiResponse) {
  res.setHeader("Set-Cookie", cookie.serialize("token", req.body, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    maxAge: 60 * 60,
    sameSite: "strict",
    path: "/",
  }))

  let session = await getSession(req, res)
  if (session.rows.length === 0) {
    session = await createSession(req, res)
  }

}