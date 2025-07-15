/**
 * @file Tests for src/components/ui/checkbox.tsx
 * @description These are unit tests for the custom `Checkbox` component. They verify
 * its rendering, state handling (checked, disabled), custom icon support, input props,
 * ref forwarding, and prop passing in a mocked environment.
 * @module CheckboxTests
 */

// region Imports
import { Checkbox } from "@/components/ui/checkbox"
import { render, screen } from "@testing-library/react"
import React, { type RefObject, createRef } from "react"
import { FaCheck } from "react-icons/fa"
import { describe, expect, it, vi } from "vitest"
// endregion

// region Mocks
/**
 * Mocks the required components from `@chakra-ui/react` for Checkbox tests.
 *
 * NOTE: The mock factory is hoisted by Vitest and runs before other module code.
 * To avoid issues with undefined variables, all dependencies (like React)
 * must be imported *inside* the factory.
 */
vi.mock("@chakra-ui/react", async () => {
  const React = await import("react")
  const actual = await vi.importActual<typeof import("@chakra-ui/react")>("@chakra-ui/react")

  const ThemeContext = React.createContext({ theme: { _config: {} } })

  return {
    ...actual,
    ChakraProvider: ({ children }: { children: React.ReactNode }): React.ReactElement => (
      <ThemeContext.Provider value={{ theme: { _config: {} } }}>{children}</ThemeContext.Provider>
    ),
    Checkbox: {
      Root: (props: React.ComponentPropsWithoutRef<"div">): React.ReactElement => (
        <div data-testid="checkbox-root" {...props} />
      ),
      HiddenInput: React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(
        (
          props: React.ComponentPropsWithoutRef<"input">,
          ref: React.ForwardedRef<HTMLInputElement>,
        ): React.ReactElement => <input type="checkbox" data-testid="checkbox-input" ref={ref} {...props} />,
      ),
      Control: (props: React.ComponentPropsWithoutRef<"div">): React.ReactElement => (
        <div data-testid="checkbox-control" {...props} />
      ),
      Indicator: (props: React.ComponentPropsWithoutRef<"div">): React.ReactElement => (
        <div data-testid="checkbox-indicator" {...props} />
      ),
      Label: (props: React.ComponentPropsWithoutRef<"span">): React.ReactElement => (
        <span data-testid="checkbox-label" {...props} />
      ),
    },
  }
})
// endregion

// region Tests
describe("Checkbox", (): void => {
  /**
   * Test case: Renders the checkbox with its children.
   * It verifies that the checkbox is rendered correctly with the provided label
   * and is not checked or disabled by default.
   */
  it("renders checkbox with label correctly", (): void => {
    render(<Checkbox>Check me</Checkbox>)
    const checkbox: HTMLElement = screen.getByTestId("checkbox-input")
    const label: HTMLElement = screen.getByTestId("checkbox-label")
    expect(checkbox).toBeInTheDocument()
    expect(label).toBeInTheDocument()
    expect(label).toHaveTextContent("Check me")
    expect(checkbox).not.toBeChecked()
    expect(checkbox).not.toBeDisabled()
  })

  /**
   * Test case: Handles the checked state.
   * It verifies that the checkbox is checked when the `defaultChecked` prop is passed via inputProps.
   */
  it("is checked when defaultChecked prop is true", (): void => {
    render(<Checkbox inputProps={{ defaultChecked: true }}>Check me</Checkbox>)
    const checkbox: HTMLElement = screen.getByTestId("checkbox-input")
    expect(checkbox).toBeChecked()
  })

  /**
   * Test case: Handles the disabled state.
   * It verifies that the checkbox is disabled when the `disabled` prop is passed via inputProps.
   */
  it("is disabled when disabled prop is true", (): void => {
    render(<Checkbox inputProps={{ disabled: true }}>Check me</Checkbox>)
    const checkbox: HTMLElement = screen.getByTestId("checkbox-input")
    expect(checkbox).toBeDisabled()
  })

  /**
   * Test case: Renders custom icon when provided.
   * It verifies that the custom icon is rendered instead of the default indicator.
   */
  it("renders custom icon when provided", (): void => {
    render(<Checkbox icon={<FaCheck data-testid="custom-icon" />}>Check me</Checkbox>)
    const customIcon: HTMLElement = screen.getByTestId("custom-icon")
    expect(customIcon).toBeInTheDocument()
    expect(screen.queryByTestId("checkbox-indicator")).not.toBeInTheDocument()
  })

  /**
   * Test case: Passes inputProps to the hidden input.
   * It verifies that additional props (like `name`) are passed to the hidden input.
   */
  it("passes inputProps to the hidden input", (): void => {
    render(<Checkbox inputProps={{ name: "test-checkbox" }}>Check me</Checkbox>)
    const checkbox: HTMLElement = screen.getByTestId("checkbox-input")
    expect(checkbox).toHaveAttribute("name", "test-checkbox")
  })

  /**
   * Test case: Forwards refs correctly.
   * It verifies that the `ref` is correctly forwarded to the underlying input element.
   */
  it("forwards ref to the underlying input element", (): void => {
    const ref: RefObject<HTMLInputElement> = createRef<HTMLInputElement>()
    render(<Checkbox ref={ref}>Check me</Checkbox>)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  /**
   * Test case: Passes additional props to the root element.
   * It verifies that additional props (like `aria-label`) are passed to the root element.
   */
  it("passes additional props to the root element", (): void => {
    render(<Checkbox aria-label="Custom Checkbox">Check me</Checkbox>)
    const root: HTMLElement = screen.getByTestId("checkbox-root")
    expect(root).toHaveAttribute("aria-label", "Custom Checkbox")
  })
})

// endregion
