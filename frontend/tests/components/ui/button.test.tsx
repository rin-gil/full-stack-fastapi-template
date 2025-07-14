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
import { type RefObject, createRef } from "react"
import { describe, expect, it } from "vitest"
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
