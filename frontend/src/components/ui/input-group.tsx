/**
 * @file Defines the InputGroup component.
 * @description A layout container that enhances an input field with start and end elements,
 * such as icons. It works by cloning the child Input and injecting padding to make space
 * for the elements.
 * @module InputGroup
 */

import type { BoxProps, InputElementProps } from "@chakra-ui/react"
import { Group, InputElement } from "@chakra-ui/react"
import type React from "react"
import type { ForwardedRef, ReactElement, ReactNode } from "react"
import { Children, cloneElement, forwardRef } from "react"

// region Type Aliases

/**
 * Defines the props for the InputGroup component.
 * @interface InputGroupProps
 * @extends BoxProps
 */
interface InputGroupProps extends BoxProps {
  /**
   * Props to be passed to the start InputElement container.
   * @type {InputElementProps}
   */
  startElementProps?: InputElementProps
  /**
   * Props to be passed to the end InputElement container.
   * @type {InputElementProps}
   */
  endElementProps?: InputElementProps
  /**
   * The element to display at the start of the input.
   * @type {ReactNode}
   */
  startElement?: ReactNode
  /**
   * The element to display at the end of the input.
   * @type {ReactNode}
   */
  endElement?: ReactNode
  /**
   * The single child of the InputGroup, which must be an Input-like component.
   * @type {ReactElement<InputElementProps>}
   */
  children: ReactElement<InputElementProps>
}

/**
 * Type alias for the InputGroup component's type, combining InputGroupProps and ref attributes.
 */
type InputGroupComponent = React.ForwardRefExoticComponent<InputGroupProps & React.RefAttributes<HTMLDivElement>>

// endregion

// region Main Code

/**
 * A layout component that renders adornments (like icons) inside an input field.
 * It clones its single child (the input) and injects `ps` (padding-start) or `pe` (padding-end)
 * props to make space for the start and end elements. This approach replaces the
 * previous unreliable logic based on external CSS variables with a robust theme token.
 * @param {InputGroupProps} props - The props for the component, destructured.
 * @param {ReactNode} [props.startElement] - The element to display at the start of the input.
 * @param {InputElementProps} [props.startElementProps] - Props for the start InputElement container.
 * @param {ReactNode} [props.endElement] - The element to display at the end of the input.
 * @param {InputElementProps} [props.endElementProps] - Props for the end InputElement container.
 * @param {ReactElement<InputElementProps>} props.children - The single Input-like child component.
 * @param {BoxProps} props.rest - Other Chakra UI group props.
 * @param {ForwardedRef<HTMLDivElement>} ref - The ref forwarded to the underlying Group element.
 * @returns {React.ReactElement} The rendered InputGroup component.
 */
export const InputGroup: InputGroupComponent = forwardRef<HTMLDivElement, InputGroupProps>(function InputGroup(
  { startElement, startElementProps, endElement, endElementProps, children, ...rest }: InputGroupProps,
  ref: ForwardedRef<HTMLDivElement>,
): React.ReactElement {
  const child: ReactElement = Children.only(children)
  const propsToClone: { ps?: string; pe?: string } = {}
  if (startElement) {
    propsToClone.ps = "10"
  }
  if (endElement) {
    propsToClone.pe = "10"
  }
  return (
    <Group ref={ref} {...rest}>
      {startElement && (
        <InputElement pointerEvents="none" {...startElementProps}>
          {startElement}
        </InputElement>
      )}
      {cloneElement(child, { ...propsToClone, ...child.props })}
      {endElement && (
        <InputElement placement="end" {...endElementProps}>
          {endElement}
        </InputElement>
      )}
    </Group>
  )
})

// endregion

// region Optional Declarations

InputGroup.displayName = "InputGroup"

// endregion
