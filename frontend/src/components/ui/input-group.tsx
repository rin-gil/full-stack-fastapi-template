/**
 * @file This module defines the InputGroup component.
 * @description A layout container that enhances an input field with start and end elements,
 * such as icons. It works by cloning the child Input and injecting padding to make space
 * for the elements.
 */

import type { BoxProps, InputElementProps } from "@chakra-ui/react"
// Use the components that are actually available in this project's setup.
import { Group, InputElement } from "@chakra-ui/react"
import type { ReactElement, ReactNode } from "react"
// Bring back cloneElement, as it's necessary for the padding logic.
import { Children, cloneElement, forwardRef } from "react"

export interface InputGroupProps extends BoxProps {
  startElementProps?: InputElementProps
  endElementProps?: InputElementProps
  startElement?: ReactNode
  endElement?: ReactNode
  children: ReactElement<InputElementProps>
}

/**
 * A layout component that renders adornments (like icons) inside an input field.
 *
 * It clones its single child (the input) and injects `ps` (padding-start) or `pe` (padding-end)
 * props to make space for the start and end elements. This approach replaces the
 * previous unreliable logic based on external CSS variables with a robust theme token.
 */
export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  function InputGroup(props, ref): ReactNode {
    const {
      startElement,
      startElementProps,
      endElement,
      endElementProps,
      children,
      ...rest
    } = props

    const child = Children.only(children)

    const propsToClone: { ps?: string; pe?: string } = {}

    // Based on browser inspection, the required padding to offset the icon
    // corresponds to the theme's size token "10" (which is 2.5rem).
    // This is a reliable, self-contained approach.
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

        {cloneElement(child, {
          ...propsToClone,
          ...child.props,
        })}

        {endElement && (
          <InputElement placement="end" {...endElementProps}>
            {endElement}
          </InputElement>
        )}
      </Group>
    )
  },
)
