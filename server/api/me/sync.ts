import process from "node:process"
import { UserTable } from "#/database/user"

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.user
    const db = useDatabase()
    if (!db) throw new Error("Not found database")
    const userTable = new UserTable(db)
    if (process.env.INIT_TABLE !== "false") await userTable.init()
    if (event.method === "GET") {
      const { data, updated } = await userTable.getData(id)
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
      await userTable.setData(id, JSON.stringify({ data, preferences }), updatedTime)
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
