/**
 * @file This module defines the InputGroup component.
 * @description A layout container that enhances an input field with start and end elements,
 * such as icons. It works by cloning the child Input and injecting padding to make space
 * for the elements.
 */

import type { BoxProps, InputElementProps } from "@chakra-ui/react"
import { Group, InputElement } from "@chakra-ui/react"
import type {
  ForwardRefExoticComponent,
  ForwardedRef,
  ReactElement,
  ReactNode,
} from "react"
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
export const InputGroup: ForwardRefExoticComponent<InputGroupProps> =
  forwardRef<HTMLDivElement, InputGroupProps>(function InputGroup(
    props: InputGroupProps,
    ref: ForwardedRef<HTMLDivElement>,
  ): ReactNode {
    const {
      startElement,
      startElementProps,
      endElement,
      endElementProps,
      children,
      ...rest
    } = props
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
  })

// Set the display name for better debugging in React DevTools
InputGroup.displayName = "InputGroup"
