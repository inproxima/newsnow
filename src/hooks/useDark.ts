import { useCallback, useEffect } from "react"
import { useMedia } from "react-use"

export declare type ColorScheme = "dark" | "light" | "system"

const THEME_KEY = "theme"

function getInitialTheme(): ColorScheme {
  if (typeof window === "undefined") return "system"
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed === "dark" || parsed === "light" || parsed === "system") {
        return parsed
      }
    }
  } catch {}
  return "system"
}

// Create a simple shared atom for theme
const themeAtom = atom<ColorScheme>(getInitialTheme())

export function useDark() {
  const [theme, setTheme] = useAtom(themeAtom)
  const prefersDarkMode = useMedia("(prefers-color-scheme: dark)")

  const isDark = theme === "dark" || (theme === "system" && prefersDarkMode)

  // Sync the dark class whenever isDark changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  const setDark = useCallback((value: ColorScheme) => {
    setTheme(value)
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(value))
    } catch {}
  }, [setTheme])

  const toggleDark = useCallback(() => {
    const newValue = isDark ? "light" : "dark"
    setTheme(newValue)
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(newValue))
    } catch {}
    // Immediately update the DOM class
    document.documentElement.classList.toggle("dark", newValue === "dark")
  }, [isDark, setTheme])

  return { isDark, setDark, toggleDark, colorScheme: theme }
}
