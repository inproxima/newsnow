import { createFileRoute } from "@tanstack/react-router"
import { focusSourcesAtom, lastActiveColumnAtom } from "~/atoms"
import { Column } from "~/components/column"

export const Route = createFileRoute("/")({
  component: IndexComponent,
})

function IndexComponent() {
  const focusSources = useAtomValue(focusSourcesAtom)
  const lastActiveColumn = useAtomValue(lastActiveColumnAtom)

  // Determine initial column: use last active, or fallback to focus/hottest
  // We intentionally only compute this once on mount (empty deps)
  const id = useMemo(() => {
    // If user has a preferred last active column and it makes sense, use it
    if (lastActiveColumn && lastActiveColumn !== "focus") {
      return lastActiveColumn
    }
    // Otherwise, show focus if it has sources, else hottest
    return focusSources.length ? "focus" : "hottest"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Column id={id} />
}
