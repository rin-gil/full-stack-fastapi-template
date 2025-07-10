/**
 * @file Defines custom Radio and RadioGroup components.
 * @description Wraps Chakra UI Radio components with custom props and styling.
 * Provides accessible radio buttons for form inputs and grouped radio selections.
 * @module Radio
 */

import { RadioGroup as ChakraRadioGroup } from "@chakra-ui/react"
import type { ForwardedRef } from "react"
import * as React from "react"

// region Type Aliases

/**
 * Supported button variants for radio components.
 * @type {Variant}
 */
type Variant = "solid" | "ghost" | "outline" | "subtle" | "surface" | "plain"

/**
 * Props for the Radio component.
 * @interface RadioItemProps
 * @extends ChakraRadioGroup.ItemProps
 */
interface RadioItemProps extends ChakraRadioGroup.ItemProps {
  /**
   * The content to display inside the radio item.
   * @type {React.ReactNode | undefined}
   */
  children?: React.ReactNode
  /**
   * Additional props for the hidden input element.
   * @type {React.InputHTMLAttributes<HTMLInputElement> | undefined}
   */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
  /**
   * The button style variant (e.g., "solid", "ghost").
   * @type {Variant | undefined}
   */
  variant?: Variant
}

/**
 * Props for the RadioGroup component.
 * @interface RadioGroupProps
 * @extends React.ComponentProps<typeof ChakraRadioGroup.Root>
 */
interface RadioGroupProps extends React.ComponentProps<typeof ChakraRadioGroup.Root> {}

/**
 * Type alias for the Radio component.
 * @type {RadioComponent}
 */
type RadioComponent = React.ForwardRefExoticComponent<RadioItemProps & React.RefAttributes<HTMLInputElement>>

/**
 * Type alias for the RadioGroup component.
 * @type {RadioGroupComponent}
 */
type RadioGroupComponent = React.ForwardRefExoticComponent<RadioGroupProps & React.RefAttributes<HTMLDivElement>>

// endregion

// region Main Code

/**
 * Custom Radio component for styled radio buttons.
 * @param {RadioItemProps} props - Props for the component, destructured.
 * @param {React.ReactNode} [props.children] - The content to display inside the radio item.
 * @param {React.InputHTMLAttributes<HTMLInputElement>} [props.inputProps] - Additional props for the hidden input.
 * @param {ChakraRadioGroup.ItemProps} props.rest - Other Chakra UI props for the radio item.
 * @param {ForwardedRef<HTMLInputElement>} ref - Ref forwarded to the hidden input element.
 * @returns {React.ReactElement} The rendered Radio component.
 */
const Radio: RadioComponent = React.forwardRef(function Radio(
  { children, inputProps, variant = "solid", ...rest }: RadioItemProps,
  ref: ForwardedRef<HTMLInputElement>,
): React.ReactElement {
  return (
    <ChakraRadioGroup.Item {...rest}>
      <ChakraRadioGroup.ItemHiddenInput ref={ref} {...inputProps} />
      <ChakraRadioGroup.ItemIndicator />
      {children && <ChakraRadioGroup.ItemText>{children}</ChakraRadioGroup.ItemText>}
    </ChakraRadioGroup.Item>
  )
})

/**
 * Custom RadioGroup component for grouping radio buttons.
 * @param {RadioGroupProps} props - Props for the component, destructured.
 * @param {React.ComponentProps<typeof ChakraRadioGroup.Root>} props.rest - Chakra UI props for the radio group.
 * @param {ForwardedRef<HTMLDivElement>} ref - Ref forwarded to the root element.
 * @returns {React.ReactElement} The rendered RadioGroup component.
 */
const RadioGroup: RadioGroupComponent = React.forwardRef(function RadioGroup(
  props: RadioGroupProps,
  ref: ForwardedRef<HTMLDivElement>,
): React.ReactElement {
  return <ChakraRadioGroup.Root ref={ref} {...props} />
})

// endregion

// region Optional Declarations

Radio.displayName = "Radio"
RadioGroup.displayName = "RadioGroup"

// endregion

export { Radio, RadioGroup, type RadioItemProps, type RadioGroupProps }
