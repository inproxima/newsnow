import { useRegisterSW } from "virtual:pwa-register/react"
import { useMount } from "react-use"
import { useToast } from "./useToast"

export function usePWA() {
  const toaster = useToast()
  const { updateServiceWorker, needRefresh: [needRefresh] } = useRegisterSW()

  useMount(async () => {
    const update = () => {
      updateServiceWorker().then(() => localStorage.setItem("updated", "1"))
    }
    await delay(1000)
    if (localStorage.getItem("updated")) {
      localStorage.removeItem("updated")
      toaster("Update successful, try it out!", {
        action: {
          label: "View updates",
          onClick: () => {
            window.open(`${Homepage}/releases/tag/v${Version}`)
          },
        },
      })
    } else if (needRefresh) {
      if (!navigator) return

      if ("connection" in navigator && !navigator.onLine) return

      const resp = await myFetch("/latest")

      if (resp.v && resp.v !== Version) {
        toaster("Update available, auto-updating in 5 seconds", {
          action: {
            label: "Update now",
            onClick: update,
          },
          onDismiss: update,
        })
      }
    }
  })
}
