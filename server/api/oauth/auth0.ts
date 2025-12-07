import process from "node:process"
import { SignJWT } from "jose"
import { UserTable } from "#/database/user"

export default defineEventHandler(async (event) => {
  const db = useDatabase()
  const userTable = db ? new UserTable(db) : undefined
  if (!userTable) throw new Error("db is not defined")
  if (process.env.INIT_TABLE !== "false") await userTable.init()

  const query = getQuery(event)
  const code = query.code as string

  if (!code) {
    throw createError({ statusCode: 400, message: "Missing authorization code" })
  }

  // Exchange code for tokens
  const tokenResponse: {
    access_token: string
    id_token: string
    token_type: string
    expires_in: number
  } = await myFetch(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        grant_type: "authorization_code",
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: process.env.AUTH0_CALLBACK_URL,
      },
    },
  )

  // Get user info from Auth0
  const userInfo: {
    sub: string
    name: string
    nickname: string
    picture: string
    email: string
    email_verified: boolean
  } = await myFetch(
    `https://${process.env.AUTH0_DOMAIN}/userinfo`,
    {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    },
  )

  // Use the Auth0 sub (subject) as user ID
  const userID = userInfo.sub
  await userTable.addUser(userID, userInfo.email || "", "auth0")

  // Create JWT for your app
  const jwtToken = await new SignJWT({
    id: userID,
    type: "auth0",
  })
    .setExpirationTime("60d")
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(process.env.JWT_SECRET!))

  const params = new URLSearchParams({
    login: "auth0",
    jwt: jwtToken,
    user: JSON.stringify({
      avatar: userInfo.picture,
      name: userInfo.name || userInfo.nickname,
    }),
  })

  return sendRedirect(event, `/?${params.toString()}`)
})
