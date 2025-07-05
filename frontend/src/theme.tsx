/**
 * @file Frontend theme configuration for Chakra UI.
 * This file defines the global CSS styles, design tokens (colors),
 * and component-specific style recipes (like for buttons) for the application.
 * It extends Chakra UI's defaultConfig to establish a custom design system.
 */

// biome-ignore lint/style/useImportType: <explanation>
import { SystemContext, createSystem, defaultConfig } from "@chakra-ui/react"
// Importing the 'recipe' for buttons
import { buttonRecipe } from "./theme/button.recipe"

// Move global CSS rules to a separate constant
const globalStyles = {
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

// Move color token definitions to a separate constant
const colorTokens = {
  ui: {
    main: { value: "#009688" },
  },
}

// Move the definitions of component 'recipes' to a separate constant
const componentRecipes = {
  button: buttonRecipe,
}

// Create and export a design system using Chakra UI
export const system: SystemContext = createSystem(defaultConfig, {
  globalCss: globalStyles,
  theme: {
    tokens: {
      colors: colorTokens,
    },
    recipes: componentRecipes,
  },
})
