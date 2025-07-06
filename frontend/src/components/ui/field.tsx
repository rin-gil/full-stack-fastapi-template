/**
 * @file Defines the custom 'Field' component.
 * @description This module exports a wrapper component around the Chakra UI Field
 * component parts (Root, Label, HelperText, ErrorText). It simplifies the creation
 * of consistent form fields by providing a single, unified interface.
 */

import { Field as ChakraField } from "@chakra-ui/react"
import * as React from "react"

/**
 * Props for the Field component.
 */
export interface FieldProps extends Omit<ChakraField.RootProps, "label"> {
  /**
   * The content to be rendered as the label for the field.
   */
  label?: React.ReactNode
  /**
   * Additional helper text to be displayed below the field.
   */
  helperText?: React.ReactNode
  /**
   * Error message to be displayed below the field, typically on validation failure.
   */
  errorText?: React.ReactNode
  /**
   * Text or a node to display when the field is not required.
   * This is used as a fallback for the required indicator.
   */
  optionalText?: React.ReactNode
}

/**
 * A wrapper component that standardizes the layout of form fields, including a label,
 * helper text, and error message. It is built on top of Chakra UI's Field component.
 * @param {FieldProps} props - The props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to forward to the underlying ChakraField.Root element.
 * @returns {React.ReactElement} The rendered Field component.
 */
export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  function Field(
    {
      label,
      children,
      helperText,
      errorText,
      optionalText,
      ...rest
    }: FieldProps,
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
        {helperText && (
          <ChakraField.HelperText>{helperText}</ChakraField.HelperText>
        )}
        {errorText && (
          <ChakraField.ErrorText>{errorText}</ChakraField.ErrorText>
        )}
      </ChakraField.Root>
    )
  },
)

Field.displayName = "Field"
