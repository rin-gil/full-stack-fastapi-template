/**
 * @file Defines the appearance settings page component.
 * @description Provides the UI and logic for selecting the application theme (system, light, or dark).
 * Handles theme selection using next-themes and renders radio buttons for theme options.
 * @module Appearance
 */

import { Container, Heading, Stack } from "@chakra-ui/react"
import { useTheme } from "next-themes"
import type { FC, ReactElement } from "react"

import { Radio, RadioGroup } from "@/components/ui/radio"
// @ts-ignore
import type { ValueChangeDetails } from "@chakra-ui/react/dist/types/components/radio-group/namespace"

// region Type Aliases

/**
 * Type alias for the Appearance component.
 * @type {AppearanceComponent}
 */
type AppearanceComponent = FC

// endregion

// region Main Code

/**
 * Main component for the appearance settings page.
 * @description Renders a radio group for selecting the application theme and updates it via next-themes.
 * @returns {ReactElement} The rendered appearance settings component.
 */
const Appearance: AppearanceComponent = (): ReactElement => {
  const { theme, setTheme } = useTheme()

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        Appearance
      </Heading>
      <RadioGroup
        onValueChange={(e: ValueChangeDetails): void => setTheme(e.value)}
        value={theme ?? "system"}
        colorPalette="teal"
      >
        <Stack>
          <Radio value="system">System</Radio>
          <Radio value="light">Light Mode</Radio>
          <Radio value="dark">Dark Mode</Radio>
        </Stack>
      </RadioGroup>
    </Container>
  )
}

// endregion

// region Optional Declarations

Appearance.displayName = "Appearance"

// endregion

export default Appearance
