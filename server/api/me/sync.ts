import process from "node:process"
import { jwtVerify } from "jose"
import { UserTable } from "#/database/user"

export default defineEventHandler(async (event) => {
  try {
    const db = useDatabase()
    if (!db) throw new Error("Not found database")
    const userTable = new UserTable(db)
    if (process.env.INIT_TABLE !== "false") await userTable.init()

    // Handle beacon requests (sendBeacon doesn't support custom headers)
    const query = getQuery(event)
    let userId = event.context.user?.id

    if (query.beacon === "1" && event.method === "POST") {
      const body = await readBody(event)
      if (body.jwt && process.env.JWT_SECRET) {
        try {
          const { payload } = await jwtVerify(
            body.jwt,
            new TextEncoder().encode(process.env.JWT_SECRET),
          ) as { payload?: { id: string } }
          if (payload?.id) {
            userId = payload.id
          }
        } catch {
          // JWT verification failed, ignore beacon request
          return { success: false, reason: "Invalid JWT" }
        }
      }
    }

    if (!userId) {
      throw createError({ statusCode: 401, message: "Unauthorized" })
    }

    if (event.method === "GET") {
      const { data, updated } = await userTable.getData(userId)
      if (data) {
        const parsed = JSON.parse(data)
        // Handle both old format (just column data) and new format (with preferences)
        if (parsed.data) {
          // New format: { data: {...}, preferences: {...} }
          return {
            data: parsed.data,
            preferences: parsed.preferences,
            updatedTime: updated,
          }
        } else {
          // Old format: column data directly
          return {
            data: parsed,
            updatedTime: updated,
          }
        }
      }
      return {
        data: undefined,
        updatedTime: updated,
      }
    } else if (event.method === "POST") {
      const body = await readBody(event)
      verifyPrimitiveMetadata(body)
      const { updatedTime, data, preferences } = body
      // Store both data and preferences together
      await userTable.setData(userId, JSON.stringify({ data, preferences }), updatedTime)
      return {
        success: true,
        updatedTime,
      }
    }
  } catch (e) {
    logger.error(e)
    throw createError({
      statusCode: 500,
      message: e instanceof Error ? e.message : "Internal Server Error",
    })
  }
})
