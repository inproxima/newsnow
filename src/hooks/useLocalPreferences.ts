import type { Color, FixedColumnID, SourceID, UserPreferences } from "@shared/types"
import { useCallback, useEffect, useMemo } from "react"
import { userPreferencesAtom } from "~/atoms"
import {
  clearPreferences,
  exportPreferences,
  getDefaultPreferences,
  importPreferences,
  loadPreferences,
  savePreferences,
} from "~/utils/preferences"

/**
 * Hook for managing user preferences with auto-save functionality
 * All preference changes are automatically persisted to localStorage
 */
export function useLocalPreferences() {
  const [preferences, setPreferences] = useAtom(userPreferencesAtom)

  // Load preferences on mount
  useEffect(() => {
    const stored = loadPreferences()
    setPreferences(stored)
  }, [setPreferences])

  // Auto-save whenever preferences change
  useEffect(() => {
    if (preferences && Object.keys(preferences).length > 0) {
      savePreferences(preferences)
    }
  }, [preferences])

  // Update a specific preference
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => {
    setPreferences(current => ({
      ...current,
      [key]: value,
    }))
  }, [setPreferences])

  // Get hidden sources for a column
  const getHiddenSources = useCallback((columnId: FixedColumnID): SourceID[] => {
    return preferences.hiddenSources?.[columnId] ?? []
  }, [preferences.hiddenSources])

  // Hide a source in a column
  const hideSource = useCallback((columnId: FixedColumnID, sourceId: SourceID) => {
    setPreferences((current) => {
      const currentHidden = current.hiddenSources?.[columnId] ?? []
      if (currentHidden.includes(sourceId)) return current

      return {
        ...current,
        hiddenSources: {
          ...current.hiddenSources,
          [columnId]: [...currentHidden, sourceId],
        },
      }
    })
  }, [setPreferences])

  // Show a previously hidden source
  const showSource = useCallback((columnId: FixedColumnID, sourceId: SourceID) => {
    setPreferences((current) => {
      const currentHidden = current.hiddenSources?.[columnId] ?? []
      return {
        ...current,
        hiddenSources: {
          ...current.hiddenSources,
          [columnId]: currentHidden.filter(id => id !== sourceId),
        },
      }
    })
  }, [setPreferences])

  // Check if a source is hidden
  const isSourceHidden = useCallback((columnId: FixedColumnID, sourceId: SourceID): boolean => {
    return preferences.hiddenSources?.[columnId]?.includes(sourceId) ?? false
  }, [preferences.hiddenSources])

  // Get panel order for a column
  const getPanelOrder = useCallback((columnId: FixedColumnID): SourceID[] => {
    return preferences.panelOrder?.[columnId] ?? []
  }, [preferences.panelOrder])

  // Update panel order for a column
  const updatePanelOrder = useCallback((columnId: FixedColumnID, order: SourceID[]) => {
    setPreferences(current => ({
      ...current,
      panelOrder: {
        ...current.panelOrder,
        [columnId]: order,
      },
    }))
  }, [setPreferences])

  // Get panel color for a source
  const getPanelColor = useCallback((sourceId: SourceID): Color | undefined => {
    return preferences.panelColors?.[sourceId]
  }, [preferences.panelColors])

  // Update panel color for a source
  const updatePanelColor = useCallback((sourceId: SourceID, color: Color | undefined) => {
    setPreferences((current) => {
      const newColors = { ...current.panelColors }
      if (color === undefined) {
        delete newColors[sourceId]
      } else {
        newColors[sourceId] = color
      }
      return {
        ...current,
        panelColors: newColors,
      }
    })
  }, [setPreferences])

  // Theme management
  const theme = useMemo(() => preferences.theme ?? "system", [preferences.theme])

  const setTheme = useCallback((theme: "light" | "dark" | "system") => {
    setPreferences(current => ({
      ...current,
      theme,
    }))
  }, [setPreferences])

  // Last active column
  const lastActiveColumn = useMemo(() => preferences.lastActiveColumn ?? "focus", [preferences.lastActiveColumn])

  const setLastActiveColumn = useCallback((columnId: FixedColumnID) => {
    setPreferences(current => ({
      ...current,
      lastActiveColumn: columnId,
    }))
  }, [setPreferences])

  // Export/Import
  const exportAll = useCallback(() => {
    return exportPreferences()
  }, [])

  const importAll = useCallback((jsonString: string) => {
    const success = importPreferences(jsonString)
    if (success) {
      const loaded = loadPreferences()
      setPreferences(loaded)
    }
    return success
  }, [setPreferences])

  // Reset preferences
  const resetAll = useCallback(() => {
    clearPreferences()
    setPreferences(getDefaultPreferences())
  }, [setPreferences])

  return {
    preferences,
    updatePreference,
    // Hidden sources
    getHiddenSources,
    hideSource,
    showSource,
    isSourceHidden,
    // Panel order
    getPanelOrder,
    updatePanelOrder,
    // Panel colors
    getPanelColor,
    updatePanelColor,
    // Theme
    theme,
    setTheme,
    // Last active column
    lastActiveColumn,
    setLastActiveColumn,
    // Export/Import
    exportAll,
    importAll,
    resetAll,
  }
}

/**
 * Hook specifically for managing hidden sources in the current column
 */
export function useHiddenSources(columnId: FixedColumnID) {
  const { getHiddenSources, hideSource, showSource, isSourceHidden } = useLocalPreferences()

  return {
    hiddenSources: getHiddenSources(columnId),
    hide: (sourceId: SourceID) => hideSource(columnId, sourceId),
    show: (sourceId: SourceID) => showSource(columnId, sourceId),
    isHidden: (sourceId: SourceID) => isSourceHidden(columnId, sourceId),
  }
}

/**
 * Hook for managing panel colors
 */
export function usePanelColors() {
  const { getPanelColor, updatePanelColor, preferences } = useLocalPreferences()

  return {
    colors: preferences.panelColors ?? {},
    getColor: getPanelColor,
    setColor: updatePanelColor,
    resetColor: (sourceId: SourceID) => updatePanelColor(sourceId, undefined),
  }
}
