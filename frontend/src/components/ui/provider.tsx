/**
 * @file Defines a custom provider for Chakra UI and related components.
 * @description Wraps the application with ChakraProvider, ColorModeProvider, and Toaster for theme and notification support.
 * @module Provider
 */

"use client"

import { ChakraProvider } from "@chakra-ui/react"
import type * as React from "react"
import type { FC, PropsWithChildren } from "react"
import { system } from "../../theme"
import { ColorModeProvider } from "./color-mode"
import { Toaster } from "./toaster"

// region Type Aliases

/**
 * Props for the CustomProvider component.
 * @interface CustomProviderProps
 */
interface CustomProviderProps extends PropsWithChildren {}

/**
 * Type alias for the CustomProvider component.
 * @type {CustomProviderComponent}
 */
type CustomProviderComponent = FC<CustomProviderProps>

// endregion

// region Main Code

/**
 * CustomProvider component for wrapping the application with Chakra UI, color mode, and toaster.
 * @param {CustomProviderProps} props - Props for the component.
 * @returns {React.ReactElement} The rendered CustomProvider component.
 */
export const CustomProvider: CustomProviderComponent = function CustomProvider(
  props: CustomProviderProps,
): React.ReactElement {
  const { children } = props
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider defaultTheme="light">{children}</ColorModeProvider>
      <Toaster />
    </ChakraProvider>
  )
}

// endregion

// region Optional Declarations

CustomProvider.displayName = "CustomProvider"

// endregion
