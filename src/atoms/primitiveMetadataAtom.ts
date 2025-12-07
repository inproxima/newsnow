import type { PrimitiveAtom } from "jotai"
import type { FixedColumnID, PrimitiveMetadata, SourceID, UserPreferences } from "@shared/types"
import type { Update } from "./types"
import { loadPreferences, savePreferences } from "~/utils/preferences"

// Migrate old localStorage preferences to new format
function migrateOldPreferences(): UserPreferences {
  try {
    // First try to load from new preferences system
    const newPrefs = loadPreferences()
    if (newPrefs && Object.keys(newPrefs).length > 0) {
      return newPrefs
    }

    // Fallback to old panel colors
    const oldPanelColors = localStorage.getItem("panelColors")
    if (oldPanelColors) {
      const parsed = JSON.parse(oldPanelColors)
      // Clean up old key after migration
      localStorage.removeItem("panelColors")
      return { panelColors: parsed }
    }
  } catch { }
  return {}
}

function createPrimitiveMetadataAtom(
  key: string,
  initialValue: PrimitiveMetadata,
  preprocess: ((stored: PrimitiveMetadata) => PrimitiveMetadata),
): PrimitiveAtom<PrimitiveMetadata> {
  const getInitialValue = (): PrimitiveMetadata => {
    const item = localStorage.getItem(key)
    const migratedPrefs = migrateOldPreferences()
    try {
      if (item) {
        const stored = JSON.parse(item) as PrimitiveMetadata
        verifyPrimitiveMetadata(stored)
        // Merge migrated preferences with stored preferences
        const mergedPreferences = {
          ...stored.preferences,
          ...migratedPrefs,
          panelColors: {
            ...stored.preferences?.panelColors,
            ...migratedPrefs.panelColors,
          },
        }
        return preprocess({
          ...stored,
          preferences: Object.keys(mergedPreferences.panelColors ?? {}).length > 0 ? mergedPreferences : stored.preferences,
          action: "init",
        })
      }
    } catch { }
    // If no stored data, return initial value with migrated preferences
    if (Object.keys(migratedPrefs).length > 0) {
      return {
        ...initialValue,
        preferences: migratedPrefs,
      }
    }
    return initialValue
  }
  const baseAtom = atom(getInitialValue())
  const derivedAtom = atom(get => get(baseAtom), (get, set, update: Update<PrimitiveMetadata>) => {
    const nextValue = update instanceof Function ? update(get(baseAtom)) : update
    const currentValue = get(baseAtom)

    // Always apply sync action (server is source of truth after login)
    // For manual actions, only apply if timestamp is newer
    const shouldUpdate = nextValue.action === "sync"
      || nextValue.updatedTime > currentValue.updatedTime

    console.log("[Atom] Update check:", {
      action: nextValue.action,
      nextTime: nextValue.updatedTime,
      currentTime: currentValue.updatedTime,
      shouldUpdate,
    })

    if (shouldUpdate) {
      set(baseAtom, nextValue)
      localStorage.setItem(key, JSON.stringify(nextValue))
      // Also save preferences to the new unified preferences system
      if (nextValue.preferences) {
        savePreferences(nextValue.preferences)
      }
      console.log("[Atom] State updated with:", { action: nextValue.action, focusCount: nextValue.data?.focus?.length })
    }
  })
  return derivedAtom
}

const initialMetadata = typeSafeObjectFromEntries(typeSafeObjectEntries(metadata)
  .filter(([id]) => fixedColumnIds.includes(id as any))
  .map(([id, val]) => [id, val.sources] as [FixedColumnID, SourceID[]]))
export function preprocessMetadata(target: PrimitiveMetadata) {
  return {
    data: {
      ...initialMetadata,
      ...typeSafeObjectFromEntries(
        typeSafeObjectEntries(target.data)
          .filter(([id]) => initialMetadata[id])
          .map(([id, s]) => {
            if (id === "focus") return [id, s.filter(k => sources[k]).map(k => sources[k].redirect ?? k)]
            const oldS = s.filter(k => initialMetadata[id].includes(k)).map(k => sources[k].redirect ?? k)
            const newS = initialMetadata[id].filter(k => !oldS.includes(k))
            return [id, [...oldS, ...newS]]
          }),
      ),
    },
    preferences: target.preferences,
    action: target.action,
    updatedTime: target.updatedTime,
  } as PrimitiveMetadata
}

export const primitiveMetadataAtom = createPrimitiveMetadataAtom("metadata", {
  updatedTime: 0,
  data: initialMetadata,
  action: "init",
}, preprocessMetadata)
