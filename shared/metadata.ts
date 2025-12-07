import { sources } from "./sources"
import { typeSafeObjectEntries, typeSafeObjectFromEntries } from "./type.util"
import type { ColumnID, HiddenColumnID, Metadata, SourceID } from "./types"

export const columns = {
  canada: {
    name: "Canada",
  },
  world: {
    name: "World",
  },
  tech: {
    name: "Tech",
  },
  finance: {
    name: "Finance",
  },
  academic: {
    name: "Academic",
  },
  weather: {
    name: "Weather",
  },
  lifestyle: {
    name: "Lifestyle",
  },
  focus: {
    name: "Favourites",
  },
  realtime: {
    name: "Latest",
  },
  hottest: {
    name: "Trending",
  },
} as const

export const fixedColumnIds = ["focus", "hottest", "realtime"] as const satisfies Partial<ColumnID>[]
export const hiddenColumns = Object.keys(columns).filter(id => !fixedColumnIds.includes(id as any)) as HiddenColumnID[]

// Sources that should appear in both Trending and Latest
const trendingSources: SourceID[] = ["cbc", "globalnews"]

export const metadata: Metadata = typeSafeObjectFromEntries(typeSafeObjectEntries(columns).map(([k, v]) => {
  switch (k) {
    case "focus":
      return [k, {
        name: v.name,
        sources: [] as SourceID[],
      }]
    case "hottest":
      return [k, {
        name: v.name,
        sources: [
          ...typeSafeObjectEntries(sources).filter(([, v]) => v.type === "hottest" && !v.redirect).map(([k]) => k),
          ...trendingSources,
        ],
      }]
    case "realtime":
      return [k, {
        name: v.name,
        sources: typeSafeObjectEntries(sources).filter(([, v]) => v.type === "realtime" && !v.redirect).map(([k]) => k),
      }]
    default:
      return [k, {
        name: v.name,
        sources: typeSafeObjectEntries(sources).filter(([, v]) => v.column === k && !v.redirect).map(([k]) => k),
      }]
  }
}))
