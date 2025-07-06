/**
 * @file Unit tests for the PasswordInput component.
 * @description These tests use mocking to isolate the PasswordInput's logic
 * from its child dependencies, preventing environment-specific errors (CSS, providers).
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactElement } from "react"
import React from "react" // Import React for use in the mock factory
import type { FieldErrors } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"

import { PasswordInput } from "@/components/ui/password-input"

// --- MOCKING CHILD COMPONENTS ---
// noinspection JSUnusedGlobalSymbols
vi.mock("@/components/ui/field", () => ({
  /**
   * Mocks the Field component to render its children and optionally an error message.
   * It passes through the `invalid` prop as a data attribute for testing purposes.
   *
   * @param props - Component props including children, errorText, and invalid status.
   * @returns A mocked div element representing the Field component.
   */
  Field: ({
    children,
    errorText,
    // REFACTOR: Use 'invalid' prop in the mock to render an indicator if needed, or simply pass through.
    // For this test, simply passing it as a data attribute is enough to silence the unused warning.
    invalid,
  }: {
    children: ReactElement
    errorText?: string
    invalid: boolean
  }) => (
    <div data-invalid={invalid}>
      {" "}
      {/* FIX: Use `invalid` prop here */}
      {children}
      {errorText && <span>{errorText}</span>}
    </div>
  ),
}))

vi.mock("@/components/ui/input-group", () => ({
  /**
   * Mocks the InputGroup component as a simple container.
   * It renders its children and optional start/end elements.
   *
   * @param props - Component props including children, startElement, and endElement.
   * @returns A mocked div element representing the InputGroup.
   */
  InputGroup: ({
    children,
    endElement,
  }: {
    children: ReactElement
    endElement?: ReactElement
  }) => (
    <div>
      {children}
      {endElement}
    </div>
  ),
}))

vi.mock("@chakra-ui/react", async (importOriginal) => {
  const original = await importOriginal<typeof import("@chakra-ui/react")>()
  return {
    ...original,
    /**
     * Mocks the Chakra UI Input component as a basic HTML input element.
     *
     * @param props - All props passed to the Input component.
     * @param ref - The ref forwarded to the input element.
     * @returns A mocked HTML input element.
     */
    Input: React.forwardRef((props: any, ref: any) => (
      <input placeholder="password-input" {...props} ref={ref} />
    )),
    IconButton: React.forwardRef((props: any, ref: any) => {
      const {
        "aria-label": ariaLabel,
        onPointerDown,
        disabled,
        tabIndex,
        children,
        // REFACTOR: Explicitly deconstruct and ignore other Chakra-specific props
        // to prevent them from being passed to the native button element.
        // This resolves the `aspectRatio` warning and the unused `rest` variable.
        aspectRatio, // Explicitly ignore
        size, // Explicitly ignore
        variant, // Explicitly ignore
        height, // Explicitly ignore
        color, // Explicitly ignore
        ...restOfUnhandledProps // Collect any others, but we expect this to be empty
      } = props
      return (
        <button
          ref={ref}
          aria-label={ariaLabel}
          onPointerDown={onPointerDown}
          disabled={disabled}
          tabIndex={tabIndex}
          type="button" // FIX: Add explicit type for button
          {...restOfUnhandledProps} // Pass through any remaining HTML-safe props
        >
          {children}
        </button>
      )
    }),
  }
})

// --- END OF MOCKING ---

type TestForm = {
  password: string
}

describe("PasswordInput", () => {
  it("should render the input and toggle type on click", async () => {
    const user = userEvent.setup()
    render(<PasswordInput name="password" errors={{}} />)
    const input =
      screen.getByPlaceholderText<HTMLInputElement>("password-input")
    const toggleButton = screen.getByRole("button", {
      name: "Toggle password visibility",
    })
    expect(input.type).toBe("password")
    await user.click(toggleButton)
    expect(input.type).toBe("text")
    await user.click(toggleButton)
    expect(input.type).toBe("password")
  })

  it("should display an error message when an error is provided", () => {
    const errors: FieldErrors<TestForm> = {
      password: { type: "required", message: "This field is required" },
    }
    render(<PasswordInput name="password" errors={errors} />)
    expect(screen.getByText("This field is required")).toBeInTheDocument()
  })

  it("should not display an error message when no error is provided", () => {
    render(<PasswordInput name="password" errors={{}} />)
    expect(screen.queryByText("This field is required")).not.toBeInTheDocument()
  })
})
