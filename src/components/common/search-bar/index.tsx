import { Command } from "cmdk"
import { useMount } from "react-use"
import type { SourceID } from "@shared/types"
import { useCallback, useMemo, useRef, useState } from "react"
import pinyin from "@shared/pinyin.json"
import { OverlayScrollbar } from "../overlay-scrollbar"
import { currentSourcesAtom } from "~/atoms"
import { CardWrapper } from "~/components/column/card"

import "./cmdk.css"

interface SourceItemProps {
  id: SourceID
  name: string
  title?: string
  column: any
  pinyin: string
}

function groupByColumn(items: SourceItemProps[]) {
  return items.reduce((acc, item) => {
    const k = acc.find(i => i.column === item.column)
    if (k) k.sources = [...k.sources, item]
    else acc.push({ column: item.column, sources: [item] })
    return acc
  }, [] as {
    column: string
    sources: SourceItemProps[]
  }[]).sort((m, n) => {
    if (m.column === "Tech") return -1
    if (n.column === "Tech") return 1

    if (m.column === "Uncategorized") return 1
    if (n.column === "Uncategorized") return -1

    return m.column < n.column ? -1 : 1
  })
}

export function SearchBar() {
  const { opened, toggle } = useSearchBar()
  const sourceItems = useMemo(
    () =>
      groupByColumn(typeSafeObjectEntries(sources)
        .filter(([_, source]) => !source.redirect)
        .map(([k, source]) => ({
          id: k,
          title: source.title,
          column: source.column ? columns[source.column].name : "Uncategorized",
          name: source.name,
          pinyin: pinyin?.[k as keyof typeof pinyin] ?? "",
        })))
    , [],
  )
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [value, setValue] = useState<SourceID>("github-trending-today")

  useMount(() => {
    inputRef?.current?.focus()
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener("keydown", keydown)
    return () => {
      document.removeEventListener("keydown", keydown)
    }
  })

  return (
    <Command.Dialog
      open={opened}
      onOpenChange={toggle}
      value={value}
      onValueChange={(v) => {
        if (v in sources) {
          setValue(v as SourceID)
        }
      }}
    >
      <Command.Input
        ref={inputRef}
        autoFocus
        placeholder="Search sources..."
      />
      <div className="md:flex pt-2">
        <OverlayScrollbar defer className="overflow-y-auto md:min-w-275px">
          <Command.List>
            <Command.Empty>No results found.</Command.Empty>
            {
              sourceItems.map(({ column, sources }) => (
                <Command.Group heading={column} key={column}>
                  {
                    sources.map(item => <SourceItem item={item} key={item.id} />)
                  }
                </Command.Group>
              ),
              )
            }
          </Command.List>
        </OverlayScrollbar>
        <div className="flex-1 pt-2 px-4 min-w-350px max-md:hidden">
          <CardWrapper id={value} />
        </div>
      </div>
    </Command.Dialog>
  )
}

function SourceItem({ item }: {
  item: SourceItemProps
}) {
  const { isFocused, toggleFocus } = useFocusWith(item.id)
  const [currentSources, setCurrentSources] = useAtom(currentSourcesAtom)
  const isInCurrentView = currentSources.includes(item.id)

  const toggleInView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isInCurrentView) {
      setCurrentSources(currentSources.filter(s => s !== item.id))
    } else {
      setCurrentSources([...currentSources, item.id])
    }
  }, [currentSources, setCurrentSources, item.id, isInCurrentView])

  const handleToggleFocus = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFocus()
  }, [toggleFocus])

  return (
    <Command.Item
      keywords={[item.name, item.title ?? "", item.pinyin]}
      value={item.id}
      className="flex justify-between items-center p-2"
      onSelect={toggleInView}
    >
      <span className="flex gap-2 items-center">
        <span
          className={$("w-4 h-4 rounded-md bg-cover")}
          style={{
            backgroundImage: `url(/icons/${item.id.split("-")[0]}.png)`,
          }}
        />
        <span>{item.name}</span>
        <span className="text-xs text-neutral-400/80 self-end mb-3px">{item.title}</span>
      </span>
      <span className="flex gap-2 items-center">
        <button
          type="button"
          title={isInCurrentView ? "Remove from view" : "Add to view"}
          onClick={toggleInView}
          className={$(
            isInCurrentView ? "i-ph-eye-fill text-green-500" : "i-ph-eye-slash-duotone",
            "op-60 hover:op-100 transition-opacity",
          )}
        />
        <button
          type="button"
          title={isFocused ? "Remove from favorites" : "Add to favorites"}
          onClick={handleToggleFocus}
          className={$(isFocused ? "i-ph-star-fill" : "i-ph-star-duotone", "bg-gold op-60 hover:op-100 transition-opacity")}
        />
      </span>
    </Command.Item>
  )
}
