/**
 * @file Tests for the CloseButton component.
 * @description These are unit tests for the custom `CloseButton` component. They verify
 * its rendering, default icon, custom children, aria-label, disabled state, ref forwarding,
 * and prop passing in a mocked environment.
 * @module CloseButtonTests
 */

// region Imports
import { CloseButton } from "@/components/ui/close-button"
import { render, screen } from "@testing-library/react"
import { type RefObject, createRef } from "react"
import { describe, expect, it } from "vitest"

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
