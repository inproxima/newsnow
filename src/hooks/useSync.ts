import type { PrimitiveMetadata } from "@shared/types"
import { useDebounce, useMount } from "react-use"
import { useLogin } from "./useLogin"
import { useToast } from "./useToast"
import { safeParseString } from "~/utils"

// Track pending sync state for beforeunload
let pendingMetadata: PrimitiveMetadata | null = null
let isSyncing = false

async function uploadMetadata(metadata: PrimitiveMetadata): Promise<boolean> {
  const jwt = safeParseString(localStorage.getItem("jwt"))
  console.log("[Sync] uploadMetadata called, hasJwt:", !!jwt)
  if (!jwt) return false
  await myFetch("/me/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: {
      data: metadata.data,
      preferences: metadata.preferences,
      updatedTime: metadata.updatedTime,
    },
  })
  console.log("[Sync] Upload successful")
  return true
}

// Synchronous version for beforeunload using sendBeacon
function uploadMetadataSync(metadata: PrimitiveMetadata): void {
  const jwt = safeParseString(localStorage.getItem("jwt"))
  if (!jwt) return

  const url = "/api/me/sync"
  const body = JSON.stringify({
    data: metadata.data,
    preferences: metadata.preferences,
    updatedTime: metadata.updatedTime,
  })

  // Use fetch with keepalive for reliable sync on page unload
  // Note: sendBeacon doesn't support custom headers, so we use fetch instead
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`,
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Ignore errors during unload
  })
}

async function downloadMetadata(): Promise<PrimitiveMetadata | undefined> {
  const jwt = safeParseString(localStorage.getItem("jwt"))
  console.log("[Sync] downloadMetadata called, hasJwt:", !!jwt)
  if (!jwt) return
  const { data, preferences, updatedTime } = await myFetch("/me/sync", {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  }) as PrimitiveMetadata
  console.log("[Sync] Downloaded metadata:", { hasData: !!data, hasPreferences: !!preferences, updatedTime })
  // 不用同步 action 字段
  if (data) {
    return {
      action: "sync",
      data,
      preferences,
      updatedTime,
    }
  }
}

export function useSync() {
  const [primitiveMetadata, setPrimitiveMetadata] = useAtom(primitiveMetadataAtom)
  const { logout, login, loggedIn } = useLogin()
  const toaster = useToast()

  // Track pending changes for beforeunload
  useEffect(() => {
    if (primitiveMetadata.action === "manual") {
      pendingMetadata = primitiveMetadata
    }
  }, [primitiveMetadata])

  // Handle page unload - sync pending changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingMetadata && !isSyncing) {
        uploadMetadataSync(pendingMetadata)
        pendingMetadata = null
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  // Debounced sync - reduced to 2 seconds for faster saves
  useDebounce(async () => {
    const fn = async () => {
      if (isSyncing) return
      isSyncing = true
      try {
        console.log("[Sync] Uploading metadata to server...")
        const success = await uploadMetadata(primitiveMetadata)
        if (success) {
          pendingMetadata = null // Clear pending after successful sync
          console.log("[Sync] Metadata uploaded and pending cleared")
        }
      } catch (e: any) {
        console.error("[Sync] Upload failed:", e)
        if (e.statusCode !== 506) {
          toaster("Sync failed. Please log in again.", {
            type: "error",
            action: {
              label: "Login",
              onClick: login,
            },
          })
          logout()
        }
      } finally {
        isSyncing = false
      }
    }

    console.log("[Sync] Debounce triggered, action:", primitiveMetadata.action, "loggedIn:", loggedIn)
    if (primitiveMetadata.action === "manual" && loggedIn) {
      fn()
    }
  }, 2000, [primitiveMetadata, loggedIn])

  // Download metadata on mount
  useMount(() => {
    const fn = async () => {
      try {
        const metadata = await downloadMetadata()
        if (metadata) {
          setPrimitiveMetadata(preprocessMetadata(metadata))
        }
      } catch (e: any) {
        if (e.statusCode !== 506) {
          toaster("Authentication failed, unable to sync. Please log in again", {
            type: "error",
            action: {
              label: "Login",
              onClick: login,
            },
          })
          logout()
        }
      }
    }
    fn()
  })
}
