/**
 * @file Defines the custom Field component.
 * @description This module exports a wrapper component around the Chakra UI Field
 * component parts (Root, Label, HelperText, ErrorText). It simplifies the creation
 * of consistent form fields by providing a single, unified interface.
 * @module Field
 */

import { Field as ChakraField } from "@chakra-ui/react"
import * as React from "react"

// region Type Aliases

/**
 * Props for the Field component.
 */
interface FieldProps extends Omit<ChakraField.RootProps, "label"> {
  /**
   * The content to be rendered as the label for the field.
   * @type {React.ReactNode}
   */
  label?: React.ReactNode
  /**
   * Additional helper text to be displayed below the field.
   * @type {React.ReactNode}
   */
  helperText?: React.ReactNode
  /**
   * Error message to be displayed below the field, typically on validation failure.
   * @type {React.ReactNode}
   */
  errorText?: React.ReactNode
  /**
   * Text or a node to display when the field is not required.
   * This is used as a fallback for the required indicator.
   * @type {React.ReactNode}
   */
  optionalText?: React.ReactNode
}

/**
 * Type alias for the Field component's type, combining FieldProps and ref attributes.
 */
type FieldComponent = React.ForwardRefExoticComponent<FieldProps & React.RefAttributes<HTMLDivElement>>

// endregion

// region Main Code

/**
 * A wrapper component that standardizes the layout of form fields, including a label,
 * helper text, and error message. It is built on top of Chakra UI's Field component.
 * @param {FieldProps} props - The props for the component, destructured.
 * @param {React.ReactNode} [props.label] - The content to be rendered as the label.
 * @param {React.ReactNode} props.children - The input or control element of the field.
 * @param {React.ReactNode} [props.helperText] - Additional helper text for the field.
 * @param {React.ReactNode} [props.errorText] - Error message for validation failures.
 * @param {React.ReactNode} [props.optionalText] - Fallback text for non-required fields.
 * @param {Omit<ChakraField.RootProps, "label">} props.rest - Other Chakra UI field props.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to forward to the underlying ChakraField.Root element.
 * @returns {React.ReactElement} The rendered Field component.
 */
export const Field: FieldComponent = React.forwardRef<HTMLDivElement, FieldProps>(function Field(
  { label, children, helperText, errorText, optionalText, ...rest }: FieldProps,
  ref: React.Ref<HTMLDivElement>,
): React.ReactElement {
  return (
    <ChakraField.Root ref={ref} {...rest}>
      {label && (
        <ChakraField.Label>
          {label}
          <ChakraField.RequiredIndicator fallback={optionalText} />
        </ChakraField.Label>
      )}
      {children}
      {helperText && <ChakraField.HelperText>{helperText}</ChakraField.HelperText>}
      {errorText && <ChakraField.ErrorText>{errorText}</ChakraField.ErrorText>}
    </ChakraField.Root>
  )
})

// endregion

// region Optional Declarations

Field.displayName = "Field"

// endregion
