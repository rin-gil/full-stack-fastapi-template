/** @file Unit tests for src/components/ui/field.tsx.
 * @description Tests the rendering and behavior of the Field component, ensuring it correctly renders
 *              Chakra UI Field components with provided props and handles conditional rendering.
 * @module FieldTests
 */

import { Field } from "@/components/ui/field"
import { render, screen } from "@testing-library/react"
import * as React from "react"
import { describe, expect, it } from "vitest"

// region Main Code

describe("Field Component", (): void => {
  /**
   * Tests rendering of the Field component with only required props (children).
   * @description Ensures the component renders children inside ChakraField.Root without label, helperText, or errorText.
   */
  it("renders with only children", (): void => {
    const input: React.ReactElement = <input data-testid="input" />
    render(<Field>{input}</Field>)

    expect(screen.getByTestId("field-root")).toBeInTheDocument()
    expect(screen.getByTestId("input")).toBeInTheDocument()
    expect(screen.queryByTestId("field-label")).not.toBeInTheDocument()
    expect(screen.queryByTestId("field-helper-text")).not.toBeInTheDocument()
    expect(screen.queryByTestId("field-error-text")).not.toBeInTheDocument()
    expect(screen.queryByTestId("field-required-indicator")).not.toBeInTheDocument()
  })

  /**
   * Tests rendering with label prop.
   * @description Ensures the label is rendered inside ChakraField.Label with RequiredIndicator.
   */
  it("renders with label", (): void => {
    const labelText = "Test Label"
    const input: React.ReactElement = <input data-testid="input" />
    render(<Field label={labelText}>{input}</Field>)

    expect(screen.getByTestId("field-root")).toBeInTheDocument()
    expect(screen.getByTestId("field-label")).toHaveTextContent(labelText)
    expect(screen.getByTestId("field-required-indicator")).toBeInTheDocument()
    expect(screen.getByTestId("input")).toBeInTheDocument()
    expect(screen.queryByTestId("field-helper-text")).not.toBeInTheDocument()
    expect(screen.queryByTestId("field-error-text")).not.toBeInTheDocument()
  })

  /**
   * Tests rendering with helperText prop.
   * @description Ensures helperText is rendered inside ChakraField.HelperText.
   */
  it("renders with helperText", (): void => {
    const helperText = "Helper text"
    const input: React.ReactElement = <input data-testid="input" />
    render(<Field helperText={helperText}>{input}</Field>)

    expect(screen.getByTestId("field-root")).toBeInTheDocument()
    expect(screen.getByTestId("field-helper-text")).toHaveTextContent(helperText)
    expect(screen.getByTestId("input")).toBeInTheDocument()
    expect(screen.queryByTestId("field-label")).not.toBeInTheDocument()
    expect(screen.queryByTestId("field-error-text")).not.toBeInTheDocument()
    expect(screen.queryByTestId("field-required-indicator")).not.toBeInTheDocument()
  })

  /**
   * Tests rendering with errorText prop.
   * @description Ensures errorText is rendered inside ChakraField.ErrorText.
   */
  it("renders with errorText", (): void => {
    const errorText = "Error message"
    const input: React.ReactElement = <input data-testid="input" />
    render(<Field errorText={errorText}>{input}</Field>)

    expect(screen.getByTestId("field-root")).toBeInTheDocument()
    expect(screen.getByTestId("field-error-text")).toHaveTextContent(errorText)
    expect(screen.getByTestId("input")).toBeInTheDocument()
    expect(screen.queryByTestId("field-label")).not.toBeInTheDocument()
    expect(screen.queryByTestId("field-helper-text")).not.toBeInTheDocument()
    expect(screen.queryByTestId("field-required-indicator")).not.toBeInTheDocument()
  })

  /**
   * Tests rendering with optionalText prop when label is present.
   * @description Ensures optionalText is passed to RequiredIndicator as fallback.
   */
  it("renders with optionalText and label", (): void => {
    const labelText = "Test Label"
    const optionalText = "Optional"
    const input: React.ReactElement = <input data-testid="input" />
    render(
      <Field label={labelText} optionalText={optionalText}>
        {input}
      </Field>,
    )

    expect(screen.getByTestId("field-root")).toBeInTheDocument()
    expect(screen.getByTestId("field-label")).toHaveTextContent(labelText)
    expect(screen.getByTestId("field-required-indicator")).toHaveTextContent(optionalText)
    expect(screen.getByTestId("input")).toBeInTheDocument()
    expect(screen.queryByTestId("field-helper-text")).not.toBeInTheDocument()
    expect(screen.queryByTestId("field-error-text")).not.toBeInTheDocument()
  })

  /**
   * Tests forwarding of ref to ChakraField.Root.
   * @description Ensures the ref is correctly attached to the root div.
   */
  it("forwards ref to ChakraField.Root", (): void => {
    const ref = React.createRef<HTMLDivElement>()
    const input: React.ReactElement = <input data-testid="input" />
    render(<Field ref={ref}>{input}</Field>)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveAttribute("data-testid", "field-root")
  })

  /**
   * Tests passing additional props to ChakraField.Root.
   * @description Ensures custom props like className are passed to the root element.
   */
  it("passes additional props to ChakraField.Root", (): void => {
    const className = "custom-class"
    const input: React.ReactElement = <input data-testid="input" />
    render(<Field className={className}>{input}</Field>)

    expect(screen.getByTestId("field-root")).toHaveClass(className)
    expect(screen.getByTestId("input")).toBeInTheDocument()
  })

  /**
   * Tests rendering with all props combined.
   * @description Ensures the component renders all parts (label, helperText, errorText, optionalText) correctly.
   */
  it("renders with all props", (): void => {
    const labelText = "Test Label"
    const helperText = "Helper text"
    const errorText = "Error message"
    const optionalText = "Optional"
    const input: React.ReactElement = <input data-testid="input" />
    render(
      <Field label={labelText} helperText={helperText} errorText={errorText} optionalText={optionalText}>
        {input}
      </Field>,
    )

    expect(screen.getByTestId("field-root")).toBeInTheDocument()
    expect(screen.getByTestId("field-label")).toHaveTextContent(labelText)
    expect(screen.getByTestId("field-helper-text")).toHaveTextContent(helperText)
    expect(screen.getByTestId("field-error-text")).toHaveTextContent(errorText)
    expect(screen.getByTestId("field-required-indicator")).toHaveTextContent(optionalText)
    expect(screen.getByTestId("input")).toBeInTheDocument()
  })
})

// endregion
