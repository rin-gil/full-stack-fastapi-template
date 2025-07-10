/**
 * @file Defines a custom Checkbox component.
 * @description Wraps the Chakra UI Checkbox with support for a custom icon and input props.
 * Renders a checkbox with an optional label and custom indicator.
 * @module Checkbox
 */

import { Checkbox as ChakraCheckbox } from "@chakra-ui/react"
import type { ForwardedRef } from "react"
import * as React from "react"

// region Type Aliases

/**
 * Props for the Checkbox component.
 * @interface CheckboxProps
 * @extends ChakraCheckbox.RootProps
 */
interface CheckboxProps extends ChakraCheckbox.RootProps {
  /**
   * Custom icon to replace the default checkbox indicator.
   * @type {React.ReactElement | undefined}
   */
  icon?: React.ReactElement
  /**
   * Additional props for the hidden input element.
   * @type {React.InputHTMLAttributes<HTMLInputElement> | undefined}
   */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

/**
 * Type alias for the Checkbox component.
 * @type {CheckboxComponent}
 */
type CheckboxComponent = React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLInputElement>>

// endregion

// region Main Code

/**
 * Custom Checkbox component with support for a custom icon and input props.
 * @param {CheckboxProps} props - The props for the component, destructured.
 * @param {React.ReactElement} [props.icon] - Custom icon to replace the default indicator.
 * @param {React.InputHTMLAttributes<HTMLInputElement>} [props.inputProps] - Props for the hidden input.
 * @param {ChakraCheckbox.RootProps} props.rest - Other Chakra UI Checkbox props.
 * @param {ForwardedRef<HTMLInputElement>} ref - Ref forwarded to the hidden input element.
 * @returns {React.ReactElement} The rendered Checkbox component.
 */
const Checkbox: CheckboxComponent = React.forwardRef(function Checkbox(
  { icon, inputProps, children, ...rest }: CheckboxProps,
  ref: ForwardedRef<HTMLInputElement>,
): React.ReactElement {
  return (
    <ChakraCheckbox.Root {...rest}>
      <ChakraCheckbox.HiddenInput ref={ref} {...inputProps} />
      <ChakraCheckbox.Control>{icon !== undefined ? icon : <ChakraCheckbox.Indicator />}</ChakraCheckbox.Control>
      {children && <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label>}
    </ChakraCheckbox.Root>
  )
})

// endregion

// region Optional Declarations

Checkbox.displayName = "Checkbox"

// endregion

export { Checkbox, type CheckboxProps }
