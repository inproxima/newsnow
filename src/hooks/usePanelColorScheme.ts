import type { Color, SourceID } from "@shared/types"
import { panelColorsAtom } from "~/atoms"

// Available colors for panel customization
export const panelColors: Color[] = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "gray",
  "slate",
]

// Color display names for UI
export const colorLabels: Record<Color, string> = {
  primary: "Primary",
  red: "Red",
  orange: "Orange",
  amber: "Amber",
  yellow: "Yellow",
  lime: "Lime",
  green: "Green",
  emerald: "Emerald",
  teal: "Teal",
  cyan: "Cyan",
  sky: "Sky",
  blue: "Blue",
  indigo: "Indigo",
  violet: "Violet",
  purple: "Purple",
  fuchsia: "Fuchsia",
  pink: "Pink",
  rose: "Rose",
  gray: "Gray",
  slate: "Slate",
  zinc: "Zinc",
  neutral: "Neutral",
  stone: "Stone",
}

/**
 * Hook to manage color scheme for a specific panel/source
 * Uses Jotai atom synced with server for persistence across sessions
 */
export function usePanelColorScheme(id: SourceID, defaultColor: Color) {
  const [colorPreferences, setColorPreferences] = useAtom(panelColorsAtom)

  const currentColor = colorPreferences[id] ?? defaultColor

  const setColor = useCallback((color: Color) => {
    setColorPreferences((prev) => {
      return { ...prev, [id]: color }
    })
  }, [id, setColorPreferences])

  const resetColor = useCallback(() => {
    setColorPreferences((prev) => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
  }, [id, setColorPreferences])

  const isCustomColor = id in colorPreferences

  return {
    currentColor,
    setColor,
    resetColor,
    isCustomColor,
    availableColors: panelColors,
  }
}
