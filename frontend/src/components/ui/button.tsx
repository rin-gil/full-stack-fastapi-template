/**
 * @file Defines the custom Button component.
 * @description This file contains the implementation of a custom Button component
 * that extends the Chakra UI Button with built-in loading states.
 */

import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react"
import {
  AbsoluteCenter,
  Button as ChakraButton,
  Span,
  Spinner,
} from "@chakra-ui/react"
import * as React from "react"

/**
 * @interface ButtonLoadingProps
 * @description Defines the props for managing the button's loading state.
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
 * @interface ButtonProps
 * @description Combined props for the custom Button component.
 * @extends ChakraButtonProps
 * @extends ButtonLoadingProps
 */
export interface ButtonProps extends ChakraButtonProps, ButtonLoadingProps {}

/**
 * A custom Button component that extends Chakra UI's Button to include
 * built-in loading state management. It handles different display variants
 * for a loading button, both with and without loading text.
 *
 * @param {ButtonProps} props - The props for the component, destructured.
 * @param {React.Ref<HTMLButtonElement>} ref - The ref forwarded to the
 * underlying button element.
 * @returns {React.ReactElement} The rendered Button component.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { loading, disabled, loadingText, children, ...rest }: ButtonProps,
    ref: React.Ref<HTMLButtonElement>,
  ) {
    /**
     * Renders the content of the button based on the loading state.
     * @returns {React.ReactNode} The content to be rendered inside the button.
     */
    const renderContent = (): React.ReactNode => {
      if (!loading) {
        return children
      }

      if (loadingText) {
        return (
          <>
            <Spinner size="inherit" color="inherit" mr={2} />
            {loadingText}
          </>
        )
      }

      return (
        <>
          {/* Spinner is absolutely centered */}
          <AbsoluteCenter display="inline-flex">
            <Spinner size="inherit" color="inherit" />
          </AbsoluteCenter>
          {/* The original children are rendered transparently to maintain button width */}
          <Span opacity={0}>{children}</Span>
        </>
      )
    }

    return (
      <ChakraButton disabled={loading || disabled} ref={ref} {...rest}>
        {renderContent()}
      </ChakraButton>
    )
  },
)

Button.displayName = "Button"
