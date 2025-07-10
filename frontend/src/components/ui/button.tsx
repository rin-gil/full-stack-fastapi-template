/**
 * @file Defines the custom Button component.
 * @description This file contains the implementation of a custom Button component
 * that extends the Chakra UI Button with built-in loading states.
 * @module Button
 */

import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react"
import { AbsoluteCenter, Button as ChakraButton, Span, Spinner } from "@chakra-ui/react"
import * as React from "react"

// region Type Aliases

/**
 * Defines the props for managing the button's loading state.
 */
interface ButtonLoadingProps {
  /**
   * If `true`, the button will be in a loading state.
   * @type {boolean}
   */
  loading?: boolean
  /**
   * The label to show in the button when `loading` is true.
   * If no `loadingText` is provided, the spinner is centered and the button's
   * children are rendered transparently.
   * @type {React.ReactNode}
   */
  loadingText?: React.ReactNode
}

/**
 * Combined props for the custom Button component.
 * @extends ChakraButtonProps
 * @extends ButtonLoadingProps
 */
interface ButtonProps extends Omit<ChakraButtonProps, keyof ButtonLoadingProps>, ButtonLoadingProps {}

/**
 * Type alias for the Button component's type, combining ButtonProps and ref attributes.
 */
type ButtonComponent = React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>

// endregion

// region Main Code

/**
 * A custom Button component that extends Chakra UI's Button to include
 * built-in loading state management. It handles different display variants
 * for a loading button, both with and without loading text.
 * @param {ButtonProps} props - The props for the component, destructured.
 * @param {boolean} [props.loading] - If true, the button is in a loading state.
 * @param {boolean} [props.disabled] - If true, the button is disabled.
 * @param {React.ReactNode} [props.loadingText] - The text to show during loading.
 * @param {React.ReactNode} props.children - The content of the button.
 * @param {Omit<ChakraButtonProps, keyof ButtonLoadingProps>} props.rest - Other Chakra UI button props.
 * @param {React.Ref<HTMLButtonElement>} ref - The ref forwarded to the underlying button element.
 * @returns {React.ReactElement} The rendered Button component.
 */
export const Button: ButtonComponent = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { loading, disabled, loadingText, children, ...rest }: ButtonProps,
  ref: React.Ref<HTMLButtonElement>,
): React.ReactElement {
  /**
   * Renders the content of the button based on the loading state.
   * @returns {React.ReactNode} The content to be rendered inside the button.
   */
  const renderContent = (): React.ReactNode => {
    if (!loading) {
      return children
    }
    return (
      <>
        <AbsoluteCenter display="inline-flex">
          <Spinner size="inherit" color="inherit" mr={loadingText ? 2 : 0} />
          {loadingText}
        </AbsoluteCenter>
        {loading && <Span opacity={0}>{children}</Span>}
      </>
    )
  }

  return (
    <ChakraButton disabled={loading || disabled} ref={ref} {...rest}>
      {renderContent()}
    </ChakraButton>
  )
})

// endregion

// region Optional Declarations

Button.displayName = "Button"

// endregion
