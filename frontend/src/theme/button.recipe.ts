/**
 * @file Chakra UI Recipe for the Button component.
 * This file defines the base styles and available variants (e.g., 'ghost')
 * for all Button components used throughout the application.
 * It centralizes button styling configuration, promoting consistency and maintainability.
 */

// biome-ignore lint/style/useImportType: <explanation>
import { RecipeDefinition, defineRecipe } from "@chakra-ui/react"

export const buttonRecipe: RecipeDefinition = defineRecipe({
  // Basic styles that apply to all buttons using this recipe
  base: {
    fontWeight: "bold", // Bold text
    display: "flex", // Uses flexbox to align content
    alignItems: "center", // Aligns elements vertically in the center
    justifyContent: "center", // Aligns elements horizontally in the center
    colorPalette: "teal", // Sets the color palette “teal” for the button.
  },
  // Button options (e.g., different styles for “primary,” “outline,” “ghost,” etc.)
  variants: {
    variant: {
      // The “ghost” option (ghost button)
      ghost: {
        bg: "transparent", // Transparent background
        _hover: {
          // Styles on hover (Chakra UI uses “_” for pseudo-selectors)
          bg: "gray.100", // Light gray background when hovering
        },
      },
      // Here you can add other options, for example:
      // solid: {
      //   bg: "teal.500",
      //   color: "white",
      //   _hover: {
      //     bg: "teal.600",
      //   },
      // },
      // outline: {
      //   border: "1px solid",
      //   borderColor: "teal.500",
      //   color: "teal.500",
      //   _hover: {
      //     bg: "teal.50",
      //   },
      // },
    },
  },
})
