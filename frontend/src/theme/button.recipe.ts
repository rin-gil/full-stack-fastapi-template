/**
 * @file Defines the style recipe for the Button component.
 * @description Centralizes base styles and variants (e.g., 'ghost') for Button components
 * to ensure consistency and maintainability across the application.
 * @module buttonRecipe
 */

import { type RecipeDefinition, defineRecipe } from "@chakra-ui/react"

// region Main Code

/**
 * Style recipe for Button components, including base styles and variants.
 * @type {RecipeDefinition}
 */
export const buttonRecipe: RecipeDefinition = defineRecipe({
  base: { fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", colorPalette: "teal" },
  variants: { variant: { ghost: { bg: "transparent", _hover: { bg: "gray.100" } } } },
})

// endregion
