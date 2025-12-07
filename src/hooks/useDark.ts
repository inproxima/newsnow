import { useEffect, useMemo } from "react"
import { useMedia } from "react-use"
import { themePreferenceAtom } from "~/atoms"

export declare type ColorScheme = "dark" | "light" | "auto" | "system"

// Legacy storage atom for backwards compatibility during migration
const legacyColorSchemeAtom = atomWithStorage<ColorScheme>("color-scheme", "light")

export function useDark() {
  // Use the new theme preference atom
  const [themePreference, setThemePreference] = useAtom(themePreferenceAtom)
  const [legacyScheme, setLegacyScheme] = useAtom(legacyColorSchemeAtom)
  const prefersDarkMode = useMedia("(prefers-color-scheme: dark)")

  // Migrate legacy preference on first load
  useEffect(() => {
    if (legacyScheme && legacyScheme !== "light" && themePreference === "system") {
      // Migrate from legacy to new system
      const mappedTheme = legacyScheme === "auto" ? "system" : legacyScheme
      setThemePreference(mappedTheme as "light" | "dark" | "system")
    }
  }, [legacyScheme, themePreference, setThemePreference])

  // Use the main theme preference, normalizing "auto" to "system"
  const colorScheme = useMemo(() => {
    const theme = themePreference ?? "system"
    return theme === "system" ? "system" : theme
  }, [themePreference])

  const isDark = useMemo(() => {
    if (colorScheme === "system" || colorScheme === "auto") {
      return prefersDarkMode
    }
    return colorScheme === "dark"
  }, [colorScheme, prefersDarkMode])

  // Sync the dark class on mount and when isDark changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  const setDark = (value: ColorScheme) => {
    const mappedValue = value === "auto" ? "system" : value
    setThemePreference(mappedValue as "light" | "dark" | "system")
    setLegacyScheme(value) // Keep legacy in sync for compatibility
  }

  const toggleDark = () => {
    const newValue = isDark ? "light" : "dark"
    setDark(newValue)
  }

  return { isDark, setDark, toggleDark, colorScheme }
}
