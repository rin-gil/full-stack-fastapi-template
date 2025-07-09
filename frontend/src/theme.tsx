/**
 * @file Configures the application's theme and design system.
 * @description Defines global CSS, design tokens (e.g., colors), and component-specific style recipes
 * for Chakra UI, combining them into a complete design system for the frontend.
 * @module theme
 */

import {
  type RecipeDefinition,
  type SystemContext,
  type SystemStyleObject,
  createSystem,
  defaultConfig,
} from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

// region Type Aliases

/**
 * @type ThemeTokens
 * @description Structure for theme tokens, such as colors, compatible with Chakra UI.
 */
type ThemeTokens = { colors: { ui: { main: { value: string } } } }

/**
 * @type ComponentRecipes
 * @description Collection of component-specific style recipes.
 */
type ComponentRecipes = Record<string, RecipeDefinition<any>>

/**
 * @type GlobalStyles
 * @description Global CSS styles applied to the entire application.
 */
type GlobalStyles = Record<string, SystemStyleObject>

// endregion

// region Main Code

/**
 * Global CSS rules applied to the entire application.
 * @type {GlobalStyles}
 */
const globalStyles: GlobalStyles = {
  html: { fontSize: "16px" },
  body: { fontSize: "0.875rem", margin: 0, padding: 0 },
  ".main-link": { color: "ui.main", fontWeight: "bold" },
}

/**
 * Custom color tokens for the application's theme.
 * @type {ThemeTokens}
 */
const colorTokens: ThemeTokens = { colors: { ui: { main: { value: "#009688" } } } }

/**
 * Collection of component-specific style recipes.
 * @type {ComponentRecipes}
 */
const componentRecipes: ComponentRecipes = {
  button: buttonRecipe,
}

/**
 * Complete design system for the application, created with Chakra UI's createSystem.
 * @type {SystemContext}
 */
export const system: SystemContext = createSystem(defaultConfig, {
  globalCss: globalStyles,
  theme: { tokens: colorTokens, recipes: componentRecipes },
})

// endregion
