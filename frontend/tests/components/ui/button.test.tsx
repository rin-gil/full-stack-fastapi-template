/**
 * @file Unit tests for src/components/ui/button.tsx
 * @description These tests isolate the Button component's logic by mocking its
 * Chakra UI dependencies, ensuring it behaves correctly in all states.
 */

import { render, screen } from "@testing-library/react"
import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement } from "react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@/components/ui/button"

// region MOCKS

/**
 * Mock the entire @chakra-ui/react module to provide simple, testable
 * implementations of the components used by our Button.
 */
vi.mock("@chakra-ui/react", async (importOriginal) => {
  const original = await importOriginal<typeof import("@chakra-ui/react")>()

  /**
   * Mocks the core Chakra Button as a native HTML button.
   */
  const MockChakraButton = React.forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement>
  >(function MockChakraButton(props, ref): ReactElement {
    return <button ref={ref} {...props} />
  })
  MockChakraButton.displayName = "MockChakraButton"

  /**
   * Mocks the Spinner component as a simple span for easy identification.
   */
  const MockSpinner = (
    props: HTMLAttributes<HTMLSpanElement>,
  ): ReactElement => <span data-testid="mock-spinner" {...props} />

  /**
   * Mocks the Span component to check for opacity changes.
   */
  const MockSpan = (props: HTMLAttributes<HTMLSpanElement>): ReactElement => (
    <span data-testid="mock-span" {...props} />
  )

  /**
   * Mocks the AbsoluteCenter as a simple div.
   */
  const MockAbsoluteCenter = (
    props: HTMLAttributes<HTMLDivElement>,
  ): ReactElement => <div data-testid="mock-absolute-center" {...props} />

  return {
    ...original,
    Button: MockChakraButton,
    Spinner: MockSpinner,
    Span: MockSpan,
    AbsoluteCenter: MockAbsoluteCenter,
  }
})

// endregion

// region TESTS

describe("Button", () => {
  /**
   * Verifies that the button renders its children correctly and is enabled by default.
   */
  it("should render children and be enabled in its default state", () => {
    // Arrange
    render(<Button>Click Me</Button>)
    // Assert
    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  /**
   * Verifies that the button is correctly disabled when the `disabled` prop is true.
   */
  it("should be disabled when the disabled prop is passed", () => {
    // Arrange
    render(<Button disabled>Click Me</Button>)
    // Assert
    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeDisabled()
  })

  /**
   * Verifies the button's state when `loading` is true without `loadingText`.
   * It should be disabled, show a spinner, and render children transparently.
   */
  it("should be disabled and show a spinner when loading", () => {
    // Arrange
    render(<Button loading>Click Me</Button>)
    // Assert
    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeDisabled()
    expect(screen.getByTestId("mock-spinner")).toBeInTheDocument()
    // Check that the original children are rendered but invisible.
    const span = screen.getByTestId("mock-span")
    expect(span).toHaveTextContent("Click Me")
    expect(span).toHaveAttribute("opacity", "0")
  })

  /**
   * Verifies the button's state when `loading` is true with `loadingText`.
   * It should show the loading text and spinner, and hide the original children.
   */
  it("should be disabled and show loadingText when loading", () => {
    // Arrange
    render(
      <Button loading loadingText="Saving...">
        Submit
      </Button>,
    )
    // Assert
    const button = screen.getByRole("button", { name: /saving/i })
    expect(button).toBeDisabled()
    expect(screen.getByTestId("mock-spinner")).toBeInTheDocument()
    expect(screen.getByText("Saving...")).toBeInTheDocument()
    // Check that the original children are NOT rendered
    expect(screen.queryByText("Submit")).not.toBeInTheDocument()
  })
})

// endregion
