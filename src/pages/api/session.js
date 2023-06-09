import { getSession, deleteExpiredSessions } from './sessionCmds'

let deletingExpiredSessions = false

export default async function loadSession(sessionId) {
  if (!deletingExpiredSessions) {
    deletingExpiredSessions = true
    setInterval(async () => {
      await deleteExpiredSessions()
    }, 1000 * 60)
  }
  const session = await getSession(sessionId)

  if (session.rows.length > 0) {
    return session
  } else {
    return null
  }
}