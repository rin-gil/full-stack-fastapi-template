/**
 * @file Tests for src/components/ui/button.tsx
 * @description These are unit tests for the custom `Button` component. They verify
 * its rendering, state handling (loading, disabled), ref forwarding, and prop passing
 * in a mocked environment.
 * @module ButtonTests
 */

// region Imports
import { Button } from "@/components/ui/button"
import { render, screen } from "@testing-library/react"
import React, { type RefObject, createRef } from "react" // Оставляем только то, что нужно для тестов
import { describe, expect, it, vi } from "vitest"
// endregion

// region Mocks
/**
 * Mocks the required components from `@chakra-ui/react` for Button tests.
 * This approach isolates the test environment, ensuring that only the necessary
 * components are mocked for this specific test suite.
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
    AbsoluteCenter: (props: React.ComponentPropsWithoutRef<"div">): React.ReactElement => (
      <div data-testid="absolute-center" {...props} />
    ),
    Span: React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
      (
        {
          colorPalette,
          colorScheme,
          ...props
        }: React.ComponentPropsWithoutRef<"span"> & {
          colorPalette?: string
          colorScheme?: string
        },
        ref: React.ForwardedRef<HTMLSpanElement>,
      ): React.ReactElement => <span data-testid="span" ref={ref} {...props} />,
    ),
    Spinner: (props: React.ComponentPropsWithoutRef<"div">): React.ReactElement => (
      <div role="status" data-testid="spinner" {...props} />
    ),
    Button: React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>(
      (
        props: React.ComponentPropsWithoutRef<"button">,
        ref: React.ForwardedRef<HTMLButtonElement>,
      ): React.ReactElement => <button ref={ref} {...props} />,
    ),
  }
})
// endregion

// region Tests
describe("Button", (): void => {
  /**
   * Test case: Renders the button with its children.
   * It verifies that the button is rendered correctly with the provided text
   * content and is not disabled by default.
   */
  it("renders children correctly", (): void => {
    render(<Button>Click me</Button>)
    const button: HTMLElement = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  /**
   * Test case: Handles the loading state without loading text.
   * It verifies that when `loading` is true, the button is disabled, a spinner
   * is shown, and the original children are hidden via the `opacity` attribute.
   */
  it("is disabled and shows a spinner when loading", (): void => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
    expect(screen.getByTestId("spinner")).toBeInTheDocument()
    expect(screen.getByText("Click me")).toHaveAttribute("opacity", "0")
  })

  /**
   * Test case: Displays loading text when provided.
   * It verifies that when `loadingText` is provided along with `loading`, the
   * button displays the loading text and a spinner.
   */
  it("shows loading text when provided", (): void => {
    render(
      <Button loading loadingText="Saving...">
        Click me
      </Button>,
    )
    expect(screen.getByRole("button")).toHaveTextContent("Saving...")
    expect(screen.getByTestId("spinner")).toBeInTheDocument()
  })

  /**
   * Test case: Handles the disabled state.
   * It verifies that the button is disabled when the `disabled` prop is set to true.
   */
  it("is disabled when disabled prop is true", (): void => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  /**
   * Test case: Forwards refs correctly.
   * It verifies that the `ref` is correctly forwarded to the underlying
   * native HTML button element.
   */
  it("forwards ref to the underlying button element", (): void => {
    const ref: RefObject<HTMLButtonElement> = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Click me</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  /**
   * Test case: Passes additional props to the underlying element.
   * It verifies that any additional props (like `aria-label`) are passed down
   * to the underlying button element.
   */
  it("passes additional props to the underlying button", (): void => {
    render(<Button aria-label="Custom Action">Click me</Button>)
    expect(screen.getByRole("button", { name: "Custom Action" })).toBeInTheDocument()
  })
})
// endregion
