import type { Color, FixedColumnID, SourceID, UserPreferences } from "@shared/types"
import type { Update } from "./types"
import { loadPreferences, savePreferences } from "~/utils/preferences"

export const focusSourcesAtom = atom((get) => {
  return get(primitiveMetadataAtom).data.focus
}, (get, set, update: Update<SourceID[]>) => {
  const _ = update instanceof Function ? update(get(focusSourcesAtom)) : update
  set(primitiveMetadataAtom, {
    updatedTime: Date.now(),
    action: "manual",
    data: {
      ...get(primitiveMetadataAtom).data,
      focus: _,
    },
    preferences: get(primitiveMetadataAtom).preferences,
  })
})

// User preferences atom - synced with server and localStorage
export const userPreferencesAtom = atom((get) => {
  return get(primitiveMetadataAtom).preferences ?? loadPreferences()
}, (get, set, update: Update<UserPreferences>) => {
  const currentPrefs = get(primitiveMetadataAtom).preferences ?? loadPreferences()
  const newPrefs = update instanceof Function ? update(currentPrefs) : update
  // Save to the new preferences system immediately
  savePreferences(newPrefs)
  set(primitiveMetadataAtom, {
    updatedTime: Date.now(),
    action: "manual",
    data: get(primitiveMetadataAtom).data,
    preferences: newPrefs,
  })
})

// Panel color preferences derived from userPreferencesAtom
export const panelColorsAtom = atom((get) => {
  return get(userPreferencesAtom).panelColors ?? {}
}, (get, set, update: Update<Record<string, Color>>) => {
  const currentColors = get(userPreferencesAtom).panelColors ?? {}
  const newColors = update instanceof Function ? update(currentColors) : update
  set(userPreferencesAtom, {
    ...get(userPreferencesAtom),
    panelColors: newColors,
  })
})

// Current column being viewed
export const currentColumnIDAtom = atom<FixedColumnID>("focus")

// Track last active column in preferences
export const lastActiveColumnAtom = atom((get) => {
  return get(userPreferencesAtom).lastActiveColumn ?? "focus"
}, (get, set, columnId: FixedColumnID) => {
  set(userPreferencesAtom, {
    ...get(userPreferencesAtom),
    lastActiveColumn: columnId,
  })
})

export const currentSourcesAtom = atom((get) => {
  const id = get(currentColumnIDAtom)
  return get(primitiveMetadataAtom).data[id]
}, (get, set, update: Update<SourceID[]>) => {
  const columnId = get(currentColumnIDAtom)
  const _ = update instanceof Function ? update(get(currentSourcesAtom)) : update

  // Update the primitiveMetadataAtom
  set(primitiveMetadataAtom, {
    updatedTime: Date.now(),
    action: "manual",
    data: {
      ...get(primitiveMetadataAtom).data,
      [columnId]: _,
    },
    preferences: get(primitiveMetadataAtom).preferences,
  })

  // Also update panel order in preferences
  const currentPrefs = get(userPreferencesAtom)
  set(userPreferencesAtom, {
    ...currentPrefs,
    panelOrder: {
      ...currentPrefs.panelOrder,
      [columnId]: _,
    },
  })
})

// Hidden sources per column (stored in preferences)
export const hiddenSourcesAtom = atom((get) => {
  const columnId = get(currentColumnIDAtom)
  return get(userPreferencesAtom).hiddenSources?.[columnId] ?? []
}, (get, set, update: Update<SourceID[]>) => {
  const columnId = get(currentColumnIDAtom)
  const currentHidden = get(userPreferencesAtom).hiddenSources?.[columnId] ?? []
  const newHidden = update instanceof Function ? update(currentHidden) : update

  set(userPreferencesAtom, {
    ...get(userPreferencesAtom),
    hiddenSources: {
      ...get(userPreferencesAtom).hiddenSources,
      [columnId]: newHidden,
    },
  })
})

// Derived atom that filters out hidden sources from current sources
export const visibleSourcesAtom = atom((get) => {
  const currentSources = get(currentSourcesAtom)
  const hiddenSources = get(hiddenSourcesAtom)
  return currentSources.filter(id => !hiddenSources.includes(id))
})

// Theme preference atom
export const themePreferenceAtom = atom((get) => {
  return get(userPreferencesAtom).theme ?? "system"
}, (get, set, theme: "light" | "dark" | "system") => {
  set(userPreferencesAtom, {
    ...get(userPreferencesAtom),
    theme,
  })
})

export const goToTopAtom = atom({
  ok: false,
  el: undefined as HTMLElement | undefined,
  fn: undefined as (() => void) | undefined,
})
