import { Link } from "@tanstack/react-router"
import { useIsFetching } from "@tanstack/react-query"
import type { SourceID } from "@shared/types"
import { NavBar } from "../navbar"
import { Menu } from "./menu"
import { currentSourcesAtom, goToTopAtom } from "~/atoms"

function GoTop() {
  const { ok, fn: goToTop } = useAtomValue(goToTopAtom)
  return (
    <button
      type="button"
      title="Go To Top"
      className={$("i-ph:arrow-fat-up-duotone", ok ? "op-50 btn" : "op-0")}
      onClick={goToTop}
    />
  )
}

function Refresh() {
  const currentSources = useAtomValue(currentSourcesAtom)
  const { refresh } = useRefetch()
  const refreshAll = useCallback(() => refresh(...currentSources), [refresh, currentSources])

  const isFetchingCount = useIsFetching({
    predicate: (query) => {
      const [type, id] = query.queryKey as ["source" | "entire", SourceID]
      return (type === "source" && currentSources.includes(id)) || type === "entire"
    },
  })

  const isRefreshing = isFetchingCount > 0

  return (
    <button
      type="button"
      title="Refresh"
      disabled={isRefreshing}
      className={$(
        "i-ph:arrow-counter-clockwise-duotone btn",
        isRefreshing && "animate-spin i-ph:circle-dashed-duotone cursor-wait op-60 pointer-events-none",
      )}
      onClick={refreshAll}
    />
  )
}

export function Header() {
  return (
    <>
      <span className="flex justify-self-start">
        <Link to="/" className="flex gap-2 items-center">
          <div className="h-10 w-10 bg-cover" title="logo" style={{ backgroundImage: "url(/icon-briefcast.svg)" }} />
          <span className="text-2xl font-semibold line-height-none!">
            Briefcast
          </span>
        </Link>
      </span>
      <span className="justify-self-center">
        <span className="hidden md:(inline-block)">
          <NavBar />
        </span>
      </span>
      <span className="justify-self-end flex gap-2 items-center text-xl text-accent-600 dark:text-accent">
        <GoTop />
        <Refresh />
        <span className="w-px h-5 bg-accent-300 dark:bg-accent-500 mx-1" />
        <Menu />
      </span>
    </>
  )
}
