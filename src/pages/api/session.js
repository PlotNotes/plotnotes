import { getSession, deleteExpiredSessions } from './sessionCmds'

let deletingExpiredSessions = false

export default async function loadSession(req, res) {

  const sessionId = req.cookies.sessionID

  if (!deletingExpiredSessions) {
    deletingExpiredSessions = true
    setInterval(async () => {
      await deleteExpiredSessions()
    }, 1000 * 60)
  }
  const session = await getSession(sessionId)

  if (session.rows.length > 0) {
    res.status(200).send({ sessionId: sessionId});
  } else {
    res.status(401).send({ error: 'You must be signed in to view the protected content on this page.'});
  }
}