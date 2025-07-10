/**
 * @file Defines a custom CloseButton component.
 * @description Wraps the Chakra UI IconButton to render a close button with a default cross icon.
 * Supports custom children and a customizable aria-label for accessibility.
 * @module CloseButton
 */

import type { IconButtonProps } from "@chakra-ui/react"
import { IconButton as ChakraIconButton } from "@chakra-ui/react"
import type { ForwardedRef } from "react"
import * as React from "react"
import { LuX } from "react-icons/lu"

// region Type Aliases

/**
 * Props for the CloseButton component.
 * @interface CloseButtonProps
 * @extends IconButtonProps
 */
interface CloseButtonProps extends IconButtonProps {
  /**
   * Custom content to replace the default cross icon.
   * @type {React.ReactNode | undefined}
   */
  children?: React.ReactNode
  /**
   * Accessible label for the button.
   * @type {string | undefined}
   * @default "Close"
   */
  "aria-label"?: string
}

/**
 * Type alias for the CloseButton component.
 * @type {CloseButtonComponent}
 */
type CloseButtonComponent = React.ForwardRefExoticComponent<CloseButtonProps & React.RefAttributes<HTMLButtonElement>>

// endregion

// region Main Code

/**
 * Custom CloseButton component with a default cross icon.
 * @param {CloseButtonProps} props - The props for the component, destructured.
 * @param {React.ReactNode} [props.children] - Custom content to replace the default cross icon.
 * @param {string} [props.aria-label="Close"] - Accessible label for the button.
 * @param {IconButtonProps} props.rest - Other Chakra UI IconButton props.
 * @param {ForwardedRef<HTMLButtonElement>} ref - Ref forwarded to the button element.
 * @returns {React.ReactElement} The rendered CloseButton component.
 */
const CloseButton: CloseButtonComponent = React.forwardRef(function CloseButton(
  { children, "aria-label": ariaLabel = "Close", ...rest }: CloseButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  return (
    <ChakraIconButton variant="ghost" aria-label={ariaLabel} ref={ref} {...rest}>
      {children ?? <LuX />}
    </ChakraIconButton>
  )
})

// endregion

// region Optional Declarations

CloseButton.displayName = "CloseButton"

// endregion

export { CloseButton, type CloseButtonProps }
