// Parse OAuth callback URL params and store in localStorage
function handleOAuthCallback() {
  if (typeof window === "undefined") return

  const params = new URLSearchParams(window.location.search)
  const jwt = params.get("jwt")
  const user = params.get("user")
  const login = params.get("login")

  console.log("[OAuth] Checking URL params:", { hasJwt: !!jwt, hasUser: !!user, hasLogin: !!login })

  if (jwt && login) {
    console.log("[OAuth] Storing JWT and user info in localStorage")
    // Store JWT in localStorage
    localStorage.setItem("jwt", JSON.stringify(jwt))

    // Store user info if present
    if (user) {
      try {
        const userInfo = JSON.parse(user)
        localStorage.setItem("user", JSON.stringify(userInfo))
        console.log("[OAuth] User info stored:", userInfo)
      } catch (e) {
        console.warn("[OAuth] Failed to parse user info from OAuth callback:", e)
      }
    }

    // Clean the URL by removing OAuth params
    const cleanUrl = new URL(window.location.href)
    cleanUrl.searchParams.delete("jwt")
    cleanUrl.searchParams.delete("user")
    cleanUrl.searchParams.delete("login")
    window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search)
    console.log("[OAuth] URL cleaned, JWT stored successfully")

    // Force page reload to ensure atoms pick up the new localStorage values
    window.location.reload()
  }
}

// Run OAuth callback handling immediately on load
handleOAuthCallback()

const userAtom = atomWithStorage<{
  name?: string
  avatar?: string
}>("user", {})

const jwtAtom = atomWithStorage("jwt", "")

const enableLoginAtom = atomWithStorage<{
  enable: boolean
  url?: string
}>("login", {
  enable: true,
})

enableLoginAtom.onMount = (set) => {
  myFetch("/enable-login").then((r) => {
    set(r)
  }).catch((e) => {
    if (e.statusCode === 506) {
      set({ enable: false })
      localStorage.removeItem("jwt")
    }
  })
}

export function useLogin() {
  const userInfo = useAtomValue(userAtom)
  const jwt = useAtomValue(jwtAtom)
  const enableLogin = useAtomValue(enableLoginAtom)

  const login = useCallback(() => {
    window.location.href = enableLogin.url || "/api/login"
  }, [enableLogin])

  const logout = useCallback(() => {
    window.localStorage.clear()
    window.location.reload()
  }, [])

  return {
    loggedIn: !!jwt,
    userInfo,
    enableLogin: !!enableLogin.enable,
    logout,
    login,
  }
}
