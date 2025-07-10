/**
 * @file Defines utilities and components for managing color modes.
 * @description Provides a provider, hooks, and components for toggling and rendering light/dark themes using next-themes.
 * Includes a button for theme switching and a wrapper for forcing specific themes.
 * @module ColorMode
 */

import type { IconButtonProps, SpanProps } from "@chakra-ui/react"
import { ClientOnly, IconButton, Skeleton, Span } from "@chakra-ui/react"
import { ThemeProvider, type ThemeProviderProps, useTheme } from "next-themes"
import type { ForwardedRef } from "react"
import * as React from "react"
import { LuMoon, LuSun } from "react-icons/lu"

// region Type Aliases

/**
 * Props for the ColorModeProvider component.
 * @interface ColorModeProviderProps
 * @extends ThemeProviderProps
 */
interface ColorModeProviderProps extends ThemeProviderProps {
  /**
   * The children to render within the ThemeProvider.
   * @type {React.ReactNode}
   */
  children?: React.ReactNode
}

/**
 * Supported color modes.
 * @type {ColorMode}
 */
type ColorMode = "light" | "dark" | "system"

/**
 * Return type for the useColorMode hook.
 * @interface UseColorModeReturn
 */
interface UseColorModeReturn {
  /** Current color mode. */
  colorMode: ColorMode
  /** Function to set the color mode. */
  setColorMode: (colorMode: ColorMode) => void
  /** Function to toggle between light and dark modes. */
  toggleColorMode: () => void
}

/**
 * Props for the ColorModeButton component.
 * @interface ColorModeButtonProps
 * @extends IconButtonProps
 */
interface ColorModeButtonProps extends Omit<IconButtonProps, "aria-label"> {
  /**
   * Accessible label for the button.
   * @type {string | undefined}
   */
  "aria-label"?: string
}

/**
 * Props for the ColorModeWrapper component.
 * @interface ColorModeWrapperProps
 * @extends SpanProps
 */
interface ColorModeWrapperProps extends SpanProps {
  /**
   * The color mode to enforce.
   * @type {ColorMode}
   */
  mode: ColorMode
}

/**
 * Type alias for the ColorModeButton component.
 * @type {ColorModeButtonComponent}
 */
type ColorModeButtonComponent = React.ForwardRefExoticComponent<
  ColorModeButtonProps & React.RefAttributes<HTMLButtonElement>
>

/**
 * Type alias for the ColorModeWrapper component.
 * @type {ColorModeWrapperComponent}
 */
type ColorModeWrapperComponent = React.ForwardRefExoticComponent<
  ColorModeWrapperProps & React.RefAttributes<HTMLSpanElement>
>

// endregion

// region Main Code

/**
 * Provider for managing color modes using next-themes.
 * @param {ColorModeProviderProps} props - Props for the ThemeProvider, including children.
 * @param {React.ReactNode} [props.children] - The children to render within the provider.
 * @param {ThemeProviderProps} props.rest - Other next-themes props.
 * @returns {React.ReactElement} The rendered ThemeProvider component.
 */
function ColorModeProvider({ children, ...props }: ColorModeProviderProps): React.ReactElement {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props}>
      {children}
    </ThemeProvider>
  )
}

/**
 * Hook for accessing and managing the current color mode.
 * @returns {UseColorModeReturn} Object containing the current color mode, setter, and toggle function.
 */
function useColorMode(): UseColorModeReturn {
  const { theme, setTheme } = useTheme()
  const toggleColorMode = (): void => {
    setTheme(theme === "dark" ? "light" : "dark")
  }
  return {
    colorMode: (theme as ColorMode) ?? "system",
    setColorMode: setTheme,
    toggleColorMode,
  }
}

/**
 * Component that renders an icon based on the current color mode.
 * @returns {React.ReactElement} The rendered icon (moon for dark, sun for light).
 */
function ColorModeIcon(): React.ReactElement {
  const { colorMode } = useColorMode()
  return colorMode === "dark" ? <LuMoon /> : <LuSun />
}

/**
 * Button for toggling between light and dark color modes.
 * @param {ColorModeButtonProps} props - Props for the component, destructured.
 * @param {string} [props.aria-label] - Accessible label for the button.
 * @param {IconButtonProps} props.rest - Other Chakra UI IconButton props.
 * @param {ForwardedRef<HTMLButtonElement>} ref - Ref forwarded to the button element.
 * @returns {React.ReactElement} The rendered ColorModeButton component.
 */
const ColorModeButton: ColorModeButtonComponent = React.forwardRef(function ColorModeButton(
  { "aria-label": ariaLabel, ...rest }: ColorModeButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  const { toggleColorMode, colorMode } = useColorMode()
  const defaultAriaLabel = colorMode === "dark" ? "Switch to light mode" : "Switch to dark mode"
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <IconButton
        onClick={toggleColorMode}
        variant="ghost"
        aria-label={ariaLabel ?? defaultAriaLabel}
        size="sm"
        boxSize="8"
        ref={ref}
        {...rest}
      >
        <ColorModeIcon />
      </IconButton>
    </ClientOnly>
  )
})

/**
 * Wrapper component for enforcing a specific color mode.
 * @param {ColorModeWrapperProps} props - Props for the component, destructured.
 * @param {ColorMode} props.mode - The color mode to enforce (light, dark, or system).
 * @param {SpanProps} props.rest - Other Chakra UI Span props.
 * @param {ForwardedRef<HTMLSpanElement>} ref - Ref forwarded to the span element.
 * @returns {React.ReactElement} The rendered ColorModeWrapper component.
 */
const ColorModeWrapper: ColorModeWrapperComponent = React.forwardRef(function ColorModeWrapper(
  { mode, ...rest }: ColorModeWrapperProps,
  ref: ForwardedRef<HTMLSpanElement>,
): React.ReactElement {
  return (
    <Span
      color="fg"
      display="contents"
      className={`chakra-theme ${mode}`}
      colorPalette="gray"
      colorScheme={mode}
      ref={ref}
      {...rest}
    />
  )
})

// endregion

// region Optional Declarations

ColorModeButton.displayName = "ColorModeButton"
ColorModeWrapper.displayName = "ColorModeWrapper"

// endregion

export {
  ColorModeButton,
  ColorModeProvider,
  ColorModeWrapper,
  useColorMode,
  type ColorMode,
  type ColorModeButtonProps,
  type ColorModeProviderProps,
  type ColorModeWrapperProps,
  type UseColorModeReturn,
}
