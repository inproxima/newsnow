import process from "node:process"

export default defineEventHandler(async () => {
  // Check if Auth0 is configured
  const hasAuth0 = ["AUTH0_DOMAIN", "AUTH0_CLIENT_ID", "AUTH0_CLIENT_SECRET", "AUTH0_CALLBACK_URL"].every(k => process.env[k])
  // Check if GitHub is configured
  const hasGithub = ["G_CLIENT_ID", "G_CLIENT_SECRET"].every(k => process.env[k])

  if (hasAuth0) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.AUTH0_CLIENT_ID!,
      redirect_uri: process.env.AUTH0_CALLBACK_URL!,
      scope: "openid profile email",
    })
    return {
      enable: true,
      url: `https://${process.env.AUTH0_DOMAIN}/authorize?${params.toString()}`,
    }
  }

  if (hasGithub) {
    return {
      enable: true,
      url: `https://github.com/login/oauth/authorize?client_id=${process.env.G_CLIENT_ID}`,
    }
  }

  return {
    enable: false,
  }
})
