import type { Color, FixedColumnID, SourceID, UserPreferences } from "@shared/types"

// Current preferences schema version - increment when making breaking changes
const PREFERENCES_VERSION = 1

// Storage keys
const PREFERENCES_KEY = "briefcast_preferences"
const LEGACY_METADATA_KEY = "metadata"
const LEGACY_HIDDEN_SOURCES_KEY = "hiddenSources"
const LEGACY_PANEL_COLORS_KEY = "panelColors"

export interface StoredPreferences {
  version: number
  updatedAt: number
  preferences: UserPreferences
}

/**
 * Get default preferences
 */
export function getDefaultPreferences(): UserPreferences {
  return {
    panelColors: {},
    hiddenSources: {
      focus: [],
      hottest: [],
      realtime: [],
    },
    panelOrder: {
      focus: [],
      hottest: [],
      realtime: [],
    },
    lastActiveColumn: "focus",
    theme: "system",
    version: PREFERENCES_VERSION,
  }
}

/**
 * Migrate legacy localStorage data to new preferences format
 */
function migrateLegacyData(): Partial<UserPreferences> {
  const migrated: Partial<UserPreferences> = {}

  try {
    // Migrate legacy panel colors
    const legacyColors = localStorage.getItem(LEGACY_PANEL_COLORS_KEY)
    if (legacyColors) {
      migrated.panelColors = JSON.parse(legacyColors) as Record<string, Color>
      localStorage.removeItem(LEGACY_PANEL_COLORS_KEY)
    }

    // Migrate legacy hidden sources
    const legacyHidden = localStorage.getItem(LEGACY_HIDDEN_SOURCES_KEY)
    if (legacyHidden) {
      const hiddenArray = JSON.parse(legacyHidden) as SourceID[]
      // Store as global hidden (will be applied to all columns)
      migrated.hiddenSources = {
        focus: [...hiddenArray],
        hottest: [...hiddenArray],
        realtime: [...hiddenArray],
      }
      localStorage.removeItem(LEGACY_HIDDEN_SOURCES_KEY)
    }

    // Migrate from legacy metadata preferences
    const legacyMetadata = localStorage.getItem(LEGACY_METADATA_KEY)
    if (legacyMetadata) {
      const parsed = JSON.parse(legacyMetadata)
      if (parsed.preferences) {
        if (parsed.preferences.panelColors && !migrated.panelColors) {
          migrated.panelColors = parsed.preferences.panelColors
        }
      }
    }
  } catch (e) {
    console.warn("Failed to migrate legacy preferences:", e)
  }

  return migrated
}

/**
 * Load preferences from localStorage with migration support
 */
export function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY)

    if (stored) {
      const parsed = JSON.parse(stored) as StoredPreferences
      // Apply any pending migrations
      const preferences = migratePreferences(parsed.preferences)
      return {
        ...getDefaultPreferences(),
        ...preferences,
      }
    }

    // Try to migrate legacy data
    const legacyData = migrateLegacyData()
    if (Object.keys(legacyData).length > 0) {
      const preferences = {
        ...getDefaultPreferences(),
        ...legacyData,
      }
      // Save migrated preferences
      savePreferences(preferences)
      return preferences
    }
  } catch (e) {
    console.warn("Failed to load preferences:", e)
  }

  return getDefaultPreferences()
}

/**
 * Save preferences to localStorage
 */
export function savePreferences(preferences: UserPreferences): void {
  try {
    const stored: StoredPreferences = {
      version: PREFERENCES_VERSION,
      updatedAt: Date.now(),
      preferences: {
        ...preferences,
        version: PREFERENCES_VERSION,
      },
    }
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(stored))
  } catch (e) {
    console.error("Failed to save preferences:", e)
  }
}

/**
 * Migrate preferences to current schema version
 */
function migratePreferences(preferences: UserPreferences): UserPreferences {
  const version = preferences.version ?? 0

  // No migrations needed yet (version 1 is current)
  if (version < PREFERENCES_VERSION) {
    // Future migrations go here
    // if (version < 2) { ... migrate to v2 ... }
  }

  return {
    ...preferences,
    version: PREFERENCES_VERSION,
  }
}

/**
 * Update a specific preference field
 */
export function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K],
): UserPreferences {
  const current = loadPreferences()
  const updated = {
    ...current,
    [key]: value,
  }
  savePreferences(updated)
  return updated
}

/**
 * Update hidden sources for a specific column
 */
export function updateHiddenSources(
  columnId: FixedColumnID,
  sources: SourceID[],
): void {
  const current = loadPreferences()
  const updated: UserPreferences = {
    ...current,
    hiddenSources: {
      ...current.hiddenSources,
      [columnId]: sources,
    },
  }
  savePreferences(updated)
}

/**
 * Update panel order for a specific column
 */
export function updatePanelOrder(
  columnId: FixedColumnID,
  order: SourceID[],
): void {
  const current = loadPreferences()
  const updated: UserPreferences = {
    ...current,
    panelOrder: {
      ...current.panelOrder,
      [columnId]: order,
    },
  }
  savePreferences(updated)
}

/**
 * Update panel color for a source
 */
export function updatePanelColor(
  sourceId: SourceID,
  color: Color | undefined,
): void {
  const current = loadPreferences()
  const newColors = { ...current.panelColors }

  if (color === undefined) {
    delete newColors[sourceId]
  } else {
    newColors[sourceId] = color
  }

  const updated: UserPreferences = {
    ...current,
    panelColors: newColors,
  }
  savePreferences(updated)
}

/**
 * Export all preferences as a JSON string (for backup/sharing)
 */
export function exportPreferences(): string {
  const preferences = loadPreferences()
  const metadata = localStorage.getItem(LEGACY_METADATA_KEY)

  return JSON.stringify({
    preferences,
    metadata: metadata ? JSON.parse(metadata) : null,
    exportedAt: new Date().toISOString(),
    version: PREFERENCES_VERSION,
  }, null, 2)
}

/**
 * Import preferences from a JSON string
 */
export function importPreferences(jsonString: string): boolean {
  try {
    const imported = JSON.parse(jsonString)

    if (imported.preferences) {
      savePreferences(imported.preferences)
    }

    if (imported.metadata) {
      localStorage.setItem(LEGACY_METADATA_KEY, JSON.stringify(imported.metadata))
    }

    return true
  } catch (e) {
    console.error("Failed to import preferences:", e)
    return false
  }
}

/**
 * Clear all preferences and reset to defaults
 */
export function clearPreferences(): void {
  localStorage.removeItem(PREFERENCES_KEY)
  localStorage.removeItem(LEGACY_METADATA_KEY)
  localStorage.removeItem(LEGACY_HIDDEN_SOURCES_KEY)
  localStorage.removeItem(LEGACY_PANEL_COLORS_KEY)
}
