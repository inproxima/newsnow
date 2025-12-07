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

  // Use sendBeacon for reliable sync on page unload
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" })
    // Note: sendBeacon doesn't support custom headers, so we use a special endpoint
    // For now, we'll try the regular fetch with keepalive
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
}

async function downloadMetadata(): Promise<PrimitiveMetadata | undefined> {
  const jwt = safeParseString(localStorage.getItem("jwt"))
  if (!jwt) return
  const { data, preferences, updatedTime } = await myFetch("/me/sync", {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  }) as PrimitiveMetadata
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
        const success = await uploadMetadata(primitiveMetadata)
        if (success) {
          pendingMetadata = null // Clear pending after successful sync
        }
      } catch (e: any) {
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
