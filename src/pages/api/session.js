import { NextApiRequest, NextApiResponse } from "next";
import { getSession, createSession, deleteExpiredSessions } from './sessionCmds'
import cookie from 'cookie'

export default async function loadSession(sessionId) {
  // res.setHeader("Set-Cookie", cookie.serialize("token", req.body, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV !== "development",
  //   maxAge: 60 * 60,
  //   sameSite: "strict",
  //   path: "/",
  // }))

  const session = await getSession(sessionId)

  if (session.rows.length > 0) {
    return session
  } else {
    return null
  }
}