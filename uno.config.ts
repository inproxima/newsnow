import { defineConfig, presetIcons, presetWind3, transformerDirectives, transformerVariantGroup } from "unocss"
import { hex2rgba } from "@unocss/rule-utils"
import { sources } from "./shared/sources"

// Custom color palette
const customColors = {
  // #6B7A8F - Slate blue-gray
  slate: {
    50: "#f0f2f4",
    100: "#e1e5e9",
    200: "#c3cbd3",
    300: "#a5b1bd",
    400: "#8797a7",
    500: "#6B7A8F",
    600: "#566272",
    700: "#404956",
    800: "#2b313a",
    900: "#15181d",
    DEFAULT: "#6B7A8F",
  },
  // #F7882F - Orange (primary)
  accent: {
    50: "#fef5ed",
    100: "#fdebdb",
    200: "#fbd7b7",
    300: "#f9c393",
    400: "#f8a661",
    500: "#F7882F",
    600: "#c66d26",
    700: "#94521c",
    800: "#633613",
    900: "#311b09",
    DEFAULT: "#F7882F",
  },
  // #F7C331 - Yellow/gold (secondary)
  gold: {
    50: "#fefaed",
    100: "#fdf5db",
    200: "#fbeab7",
    300: "#f9e093",
    400: "#f8d162",
    500: "#F7C331",
    600: "#c69c27",
    700: "#94751d",
    800: "#634e14",
    900: "#31270a",
    DEFAULT: "#F7C331",
  },
  // #EFEFEF - Light gray (background)
  cream: {
    50: "#ffffff",
    100: "#EFEFEF",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    DEFAULT: "#EFEFEF",
  },
}

export default defineConfig({
  mergeSelectors: false,
  transformers: [transformerDirectives(), transformerVariantGroup()],
  presets: [
    presetWind3(),
    presetIcons({
      scale: 1.2,
    }),
  ],
  theme: {
    colors: customColors,
  },
  rules: [
    [/^sprinkle-(.+)$/, ([_, d], { theme }) => {
      // @ts-expect-error >_<
      let hex: any = theme.colors?.[d]?.[400]
      // Fallback for custom palette names
      if (!hex && d === "primary") {
        hex = customColors.accent[400]
      }
      if (hex) {
        return {
          "background-image": `radial-gradient(ellipse 80% 80% at 50% -30%,
         rgba(${hex2rgba(hex)?.join(", ")}, 0.3), rgba(255, 255, 255, 0));`,
        }
      }
    }],
    [
      "font-brand",
      {
        "font-family": `"Baloo 2", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace; `,
      },
    ],
  ],
  shortcuts: {
    "color-base": "color-slate-700 dark:color-cream-200",
    "bg-base": "bg-[#EFEFEF] dark:bg-slate-800",
    "btn": "op50 hover:op85 cursor-pointer transition-all",
  },
  safelist: [
    // Include all panel colors that users can choose from
    ...["orange", "accent", "gold", "cream", "slate", "red", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose", "gray", ...new Set(Object.values(sources).map(k => k.color))].map(k =>
      `bg-${k} color-${k} border-${k} sprinkle-${k} shadow-${k}
       bg-${k}-500 color-${k}-500
       dark:bg-${k} dark:color-${k}`.trim().split(/\s+/)).flat(),
  ],
  extendTheme: (theme) => {
    // @ts-expect-error >_<
    theme.colors.primary = customColors.accent
    return theme
  },
})
