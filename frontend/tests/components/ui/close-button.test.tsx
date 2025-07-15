/**
 * @file Tests for src/components/ui/close-button.tsx
 * @description These are unit tests for the custom `CloseButton` component. They verify
 * its rendering, default icon, custom children, aria-label, disabled state, ref forwarding,
 * and prop passing in a mocked environment.
 * @module CloseButtonTests
 */

// region Imports
import { CloseButton } from "@/components/ui/close-button"
import { render, screen } from "@testing-library/react"
import React, { type RefObject, createRef } from "react"
import { describe, expect, it, vi } from "vitest"
// endregion

// region Mocks
/**
 * Mocks the required components from `@chakra-ui/react` for CloseButton tests.
 * The internal dependency `IconButton` is mocked to prevent it from calling
 * context-dependent hooks. `defineRecipe` is also mocked as it's part of
 * Chakra's styling system used by real components.
 *
 * NOTE: The mock factory is hoisted by Vitest. All dependencies (like React)
 * must be imported *inside* the factory to avoid hoisting-related errors.
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
    IconButton: React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>(
      (
        { "aria-label": ariaLabel, ...props }: React.ComponentPropsWithoutRef<"button">,
        ref: React.ForwardedRef<HTMLButtonElement>,
      ): React.ReactElement => <button ref={ref} aria-label={ariaLabel} {...props} />,
    ),
    defineRecipe: vi.fn(() => ({})),
  }
})
// endregion

// region Tests
describe("CloseButton", (): void => {
  /**
   * Test case: Renders the close button with default icon.
   * It verifies that the button is rendered with an SVG icon (default LuX) and correct aria-label.
   */
  it("renders close button with default icon and aria-label", (): void => {
    render(<CloseButton />)
    const button: HTMLElement = screen.getByRole("button", { name: /close/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("aria-label", "Close")
    expect(button.querySelector("svg")).toBeInTheDocument()
  })

  /**
   * Test case: Renders custom children when provided.
   * It verifies that custom children replace the default icon.
   */
  it("renders custom children when provided", (): void => {
    render(
      <CloseButton>
        <span data-testid="custom-child">Custom</span>
      </CloseButton>,
    )
    const button: HTMLElement = screen.getByRole("button", { name: /close/i })
    expect(button).toBeInTheDocument()
    expect(screen.getByTestId("custom-child")).toBeInTheDocument()
    expect(button.querySelector("svg")).not.toBeInTheDocument()
  })

  /**
   * Test case: Uses custom aria-label when provided.
   * It verifies that a custom aria-label is applied to the button.
   */
  it("uses custom aria-label when provided", (): void => {
    render(<CloseButton aria-label="Custom Close" />)
    const button: HTMLElement = screen.getByRole("button", { name: /custom close/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("aria-label", "Custom Close")
  })

  /**
   * Test case: Handles the disabled state.
   * It verifies that the button is disabled when the `disabled` prop is true.
   */
  it("is disabled when disabled prop is true", (): void => {
    render(<CloseButton disabled />)
    const button: HTMLElement = screen.getByRole("button", { name: /close/i })
    expect(button).toBeDisabled()
  })

  /**
   * Test case: Forwards refs correctly.
   * It verifies that the `ref` is correctly forwarded to the underlying button element.
   */
  it("forwards ref to the underlying button element", (): void => {
    const ref: RefObject<HTMLButtonElement> = createRef<HTMLButtonElement>()
    render(<CloseButton ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  /**
   * Test case: Passes additional props to the underlying button.
   * It verifies that additional props (like `data-test`) are passed to the button.
   */
  it("passes additional props to the underlying button", (): void => {
    render(<CloseButton data-test="custom-prop" />)
    const button: HTMLElement = screen.getByRole("button", { name: /close/i })
    expect(button).toHaveAttribute("data-test", "custom-prop")
  })
})

// endregion
