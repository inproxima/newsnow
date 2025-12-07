import type { NewsItem, SourceID, SourceResponse } from "@shared/types"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion, useInView } from "framer-motion"
import { useWindowSize } from "react-use"
import { forwardRef, useCallback, useImperativeHandle, useState } from "react"
import { OverlayScrollbar } from "../common/overlay-scrollbar"
import { safeParseString } from "~/utils"
import { useHideSource } from "~/hooks/useSourceVisibility"
import { panelColors, usePanelColorScheme } from "~/hooks/usePanelColorScheme"

/**
 * Get the icon URL for a given source ID
 * For sources with sub-sources (e.g., "github-trending-today"), use the base source ID
 */
function getSourceIconUrl(id: SourceID): string {
  const baseId = id.split("-")[0]
  return `/icons/${baseId}.png`
}

/**
 * Get favicon URL from a website URL using Google's favicon service
 */
function getFaviconUrl(homeUrl: string | undefined, size: number = 64): string | null {
  if (!homeUrl) return null
  try {
    const url = new URL(homeUrl)
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${size}`
  } catch {
    return null
  }
}

/**
 * Source icon component with fallback handling
 * Uses favicon service as primary source to get the correct logo from the website
 * Falls back to local icon if favicon service fails
 */
function SourceIcon({ id, className }: { id: SourceID, className?: string }) {
  const [iconState, setIconState] = useState<"favicon" | "local" | "default">("favicon")
  const localIconUrl = getSourceIconUrl(id)
  const faviconUrl = getFaviconUrl(sources[id].home)
  const defaultUrl = "/icons/default.png"

  const handleError = useCallback(() => {
    setIconState((prev) => {
      if (prev === "favicon") return "local"
      return "default"
    })
  }, [])

  // Determine current source URL based on state
  const currentSrc = iconState === "favicon" && faviconUrl
    ? faviconUrl
    : iconState === "local"
      ? localIconUrl
      : defaultUrl

  return (
    <img
      src={currentSrc}
      alt={`${sources[id].name} icon`}
      className={$("w-8 h-8 rounded-full object-cover bg-white", className)}
      onError={handleError}
    />
  )
}

export interface ItemsProps extends React.HTMLAttributes<HTMLDivElement> {
  id: SourceID
  /**
   * 是否显示透明度，拖动时原卡片的样式
   */
  isDragging?: boolean
  setHandleRef?: (ref: HTMLElement | null) => void
}

interface NewsCardProps {
  id: SourceID
  setHandleRef?: (ref: HTMLElement | null) => void
}

export const CardWrapper = forwardRef<HTMLElement, ItemsProps>(({ id, isDragging, setHandleRef, style, ...props }, dndRef) => {
  const ref = useRef<HTMLDivElement>(null)
  const { currentColor } = usePanelColorScheme(id, sources[id].color)

  const inView = useInView(ref, {
    once: true,
  })

  useImperativeHandle(dndRef, () => ref.current! as HTMLDivElement)

  return (
    <div
      ref={ref}
      className={$(
        "flex flex-col h-500px rounded-2xl p-4 cursor-default",
        // "backdrop-blur-5",
        "transition-opacity-300",
        isDragging && "op-50",
        `bg-${currentColor}-500 dark:bg-${currentColor} bg-op-40!`,
      )}
      style={{
        transformOrigin: "50% 50%",
        ...style,
      }}
      {...props}
    >
      {inView && <NewsCard id={id} setHandleRef={setHandleRef} />}
    </div>
  )
})

function ColorPicker({ id }: { id: SourceID }) {
  const { currentColor, setColor, resetColor, isCustomColor } = usePanelColorScheme(id, sources[id].color)
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        title="Change panel color"
        className={$("btn i-ph:palette-duotone", isCustomColor && "text-accent")}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="absolute right-0 top-8 z-50 bg-base rounded-lg shadow-lg p-2 min-w-48">
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {panelColors.map(color => (
              <button
                key={color}
                type="button"
                title={color}
                className={$(
                  "w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110",
                  `bg-${color}-500`,
                  currentColor === color && "ring-2 ring-offset-2 ring-offset-base ring-accent",
                )}
                onClick={() => {
                  setColor(color)
                  setIsOpen(false)
                }}
              />
            ))}
          </div>
          {isCustomColor && (
            <button
              type="button"
              className="w-full text-xs text-center py-1 hover:bg-neutral-400/20 rounded transition-colors"
              onClick={() => {
                resetColor()
                setIsOpen(false)
              }}
            >
              Reset to default
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function NewsCard({ id, setHandleRef }: NewsCardProps) {
  const { refresh } = useRefetch()
  const { currentColor } = usePanelColorScheme(id, sources[id].color)
  const { data, isFetching, isError } = useQuery({
    queryKey: ["source", id],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1] as SourceID
      let url = `/s?id=${id}`
      const headers: Record<string, any> = {}
      if (refetchSources.has(id)) {
        url = `/s?id=${id}&latest`
        const jwt = safeParseString(localStorage.getItem("jwt"))
        if (jwt) headers.Authorization = `Bearer ${jwt}`
        refetchSources.delete(id)
      } else if (cacheSources.has(id)) {
        // wait animation
        await delay(200)
        return cacheSources.get(id)
      }

      const response: SourceResponse = await myFetch(url, {
        headers,
      })

      function diff() {
        try {
          if (response.items && sources[id].type === "hottest" && cacheSources.has(id)) {
            response.items.forEach((item, i) => {
              const o = cacheSources.get(id)!.items.findIndex(k => k.id === item.id)
              item.extra = {
                ...item?.extra,
                diff: o === -1 ? undefined : o - i,
              }
            })
          }
        } catch (e) {
          console.error(e)
        }
      }

      diff()

      cacheSources.set(id, response)
      return response
    },
    placeholderData: prev => prev,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const { isFocused, toggleFocus } = useFocusWith(id)
  const { removeSource } = useHideSource(id)

  return (
    <>
      <div className={$("flex justify-between mx-2 mt-0 mb-2 items-center")}>
        <div className="flex gap-2 items-center">
          <a
            className="flex-shrink-0"
            target="_blank"
            href={sources[id].home}
            title={sources[id].desc}
          >
            <SourceIcon id={id} />
          </a>
          <span className="flex flex-col">
            <span className="flex items-center gap-2">
              <span
                className="text-xl font-bold"
                title={sources[id].desc}
              >
                {sources[id].name}
              </span>
              {sources[id]?.title && <span className={$("text-sm", `color-${currentColor} bg-base op-80 bg-op-50! px-1 rounded`)}>{sources[id].title}</span>}
            </span>
            <span className="text-xs op-70"><UpdatedTime isError={isError} updatedTime={data?.updatedTime} /></span>
          </span>
        </div>
        <div className={$("flex gap-2 text-lg", `color-${currentColor}`)}>
          <button
            type="button"
            title="Refresh"
            className={$("btn i-ph:arrow-counter-clockwise-duotone", isFetching && "animate-spin i-ph:circle-dashed-duotone")}
            onClick={() => refresh(id)}
          />
          <button
            type="button"
            title={isFocused ? "Remove from favorites" : "Add to favorites"}
            className={$("btn", isFocused ? "i-ph:star-fill" : "i-ph:star-duotone")}
            onClick={toggleFocus}
          />
          <ColorPicker id={id} />
          <button
            type="button"
            title="Remove this panel"
            className="btn i-ph:x-circle-duotone hover:text-red-500"
            onClick={removeSource}
          />
          {/* firefox cannot drag a button */}
          {setHandleRef && (
            <div
              ref={setHandleRef}
              className={$("btn", "i-ph:dots-six-vertical-duotone", "cursor-grab")}
            />
          )}
        </div>
      </div>

      <OverlayScrollbar
        className={$([
          "h-full p-2 overflow-y-auto rounded-2xl bg-base bg-op-70!",
          isFetching && `animate-pulse`,
          `sprinkle-${currentColor}`,
        ])}
        options={{
          overflow: { x: "hidden" },
        }}
        defer
      >
        <div className={$("transition-opacity-500", isFetching && "op-20")}>
          {!!data?.items?.length && (sources[id].type === "hottest" ? <NewsListHot items={data.items} /> : <NewsListTimeLine items={data.items} />)}
        </div>
      </OverlayScrollbar>
    </>
  )
}

function UpdatedTime({ isError, updatedTime }: { updatedTime: any, isError: boolean }) {
  const relativeTime = useRelativeTime(updatedTime ?? "")
  if (relativeTime) return `Updated ${relativeTime}`
  if (isError) return "Failed to load"
  return "Loading..."
}

function DiffNumber({ diff }: { diff: number }) {
  const [shown, setShown] = useState(true)
  useEffect(() => {
    setShown(true)
    const timer = setTimeout(() => {
      setShown(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [setShown, diff])

  return (
    <AnimatePresence>
      { shown && (
        <motion.span
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 0.5, y: -7 }}
          exit={{ opacity: 0, y: -15 }}
          className={$("absolute left-0 text-xs", diff < 0 ? "text-green" : "text-red")}
        >
          {diff > 0 ? `+${diff}` : diff}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
function ExtraInfo({ item }: { item: NewsItem }) {
  if (item?.extra?.info) {
    return <>{item.extra.info}</>
  }
  if (item?.extra?.icon) {
    const { url, scale } = typeof item.extra.icon === "string" ? { url: item.extra.icon, scale: undefined } : item.extra.icon
    return (
      <img
        src={url}
        style={{
          transform: `scale(${scale ?? 1})`,
        }}
        className="h-4 inline mt--1"
        onError={e => e.currentTarget.style.display = "none"}
      />
    )
  }
}

function NewsUpdatedTime({ date }: { date: string | number }) {
  const relativeTime = useRelativeTime(date)
  return <>{relativeTime}</>
}
function NewsListHot({ items }: { items: NewsItem[] }) {
  const { width } = useWindowSize()
  return (
    <ol className="flex flex-col gap-2">
      {items?.map((item, i) => (
        <a
          href={width < 768 ? item.mobileUrl || item.url : item.url}
          target="_blank"
          rel="noopener noreferrer"
          key={item.id}
          title={item.extra?.hover}
          className={$(
            "flex gap-2 items-center items-stretch relative cursor-pointer [&_*]:cursor-pointer transition-all",
            "hover:bg-neutral-400/10 rounded-md pr-1 visited:(text-neutral-400)",
          )}
        >
          <span className={$("bg-neutral-400/10 min-w-6 flex justify-center items-center rounded-md text-sm")}>
            {i + 1}
          </span>
          {!!item.extra?.diff && <DiffNumber diff={item.extra.diff} />}
          <span className="self-start line-height-none">
            <span className="mr-2 text-base">
              {item.title}
            </span>
            <span className="text-xs text-neutral-400/80 truncate align-middle">
              <ExtraInfo item={item} />
            </span>
          </span>
        </a>
      ))}
    </ol>
  )
}

function NewsListTimeLine({ items }: { items: NewsItem[] }) {
  const { width } = useWindowSize()
  return (
    <ol className="border-s border-neutral-400/50 flex flex-col ml-1">
      {items?.map(item => (
        <li key={`${item.id}-${item.pubDate || item?.extra?.date || ""}`} className="flex flex-col">
          <span className="flex items-center gap-1 text-neutral-400/50 ml--1px">
            <span className="">-</span>
            <span className="text-xs text-neutral-400/80">
              {(item.pubDate || item?.extra?.date) && <NewsUpdatedTime date={(item.pubDate || item?.extra?.date)!} />}
            </span>
            <span className="text-xs text-neutral-400/80">
              <ExtraInfo item={item} />
            </span>
          </span>
          <a
            className={$(
              "ml-2 px-1 hover:bg-neutral-400/10 rounded-md visited:(text-neutral-400/80)",
              "cursor-pointer [&_*]:cursor-pointer transition-all",
            )}
            href={width < 768 ? item.mobileUrl || item.url : item.url}
            title={item.extra?.hover}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  )
}
