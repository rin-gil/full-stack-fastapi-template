/**
 * @file Defines the application's theme and design system.
 * @description This file configures the global CSS, design tokens (e.g., colors),
 * and component-specific style recipes for Chakra UI. It combines these elements
 * to create and export the complete design system for the frontend.
 */

// biome-ignore lint/style/useImportType: <explanation>
import { SystemContext, createSystem, defaultConfig } from "@chakra-ui/react"
// Importing the 'recipe' for buttons
import { buttonRecipe } from "./theme/button.recipe"

/**
 * Global CSS rules applied to the entire application.
 * @type {Record<string, any>}
 */
const globalStyles: Record<string, any> = {
  html: {
    fontSize: "16px",
  },
  body: {
    fontSize: "0.875rem",
    margin: 0,
    padding: 0,
  },
  ".main-link": {
    color: "ui.main", // Color token reference
    fontWeight: "bold",
  },
}

/**
 * Custom color tokens for the application's theme.
 * @type {Record<string, any>}
 */
const colorTokens: Record<string, any> = {
  ui: {
    main: { value: "#009688" },
  },
}

/**
 * A collection of component-specific style recipes.
 * @type {Record<string, any>}
 */
const componentRecipes: Record<string, any> = {
  button: buttonRecipe,
}

/**
 * The complete design system for the application, created with Chakra UI's `createSystem`.
 * This object includes global styles, theme tokens, and component recipes.
 * @type {SystemContext}
 */
export const system: SystemContext = createSystem(defaultConfig, {
  globalCss: globalStyles,
  theme: {
    tokens: {
      colors: colorTokens,
    },
    recipes: componentRecipes,
  },
})
