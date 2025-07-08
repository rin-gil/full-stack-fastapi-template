/**
 * @file Unit tests for src/components/ui/password-input.tsx
 * @description These tests verify the PasswordInput component's logic in isolation by
 * mocking its child dependencies to prevent environment-specific errors.
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactElement } from "react"
import React from "react"
import type { FieldErrors } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"

import { PasswordInput } from "@/components/ui/password-input"

// region MOCKING DEPENDENCIES

// noinspection JSUnusedGlobalSymbols
vi.mock("@/components/ui/field", () => ({
  /**
   * Mocks the Field component to render its children and an optional error message.
   *
   * @param {object} props - Component props.
   * @param {ReactElement} props.children - The main content, typically an input.
   * @param {string} [props.errorText] - The error message to display.
   * @param {boolean} props.invalid - The invalid state, passed as a data attribute.
   * @returns {ReactElement} A mocked div representing the Field component.
   */
  Field: ({
    children,
    errorText,
    invalid,
  }: { children: ReactElement; errorText?: string; invalid: boolean }): ReactElement => (
    <div data-invalid={invalid}>
      {children}
      {errorText && <span>{errorText}</span>}
    </div>
  ),
}))

vi.mock("@/components/ui/input-group", () => ({
  /**
   * Mocks the InputGroup component as a simple container.
   *
   * @param {object} props - Component props.
   * @param {ReactElement} props.children - The main content, typically an input.
   * @param {ReactElement} [props.endElement] - The element to render at the end.
   * @returns {ReactElement} A mocked div representing the InputGroup.
   */
  InputGroup: ({ children, endElement }: { children: ReactElement; endElement?: ReactElement }): ReactElement => (
    <div>
      {children}
      {endElement}
    </div>
  ),
}))

vi.mock("@chakra-ui/react", async (importOriginal) => {
  const original = await importOriginal<typeof import("@chakra-ui/react")>()

  const MockChakraInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    function MockChakraInput(props, ref): ReactElement {
      return <input placeholder="password-input" {...props} ref={ref} />
    },
  )
  MockChakraInput.displayName = "MockChakraInput"

  /**
   * This mock for IconButton correctly filters out Chakra-specific props
   * to prevent them from being passed to the DOM, resolving React warnings.
   */
  const MockChakraIconButton = React.forwardRef<
    HTMLButtonElement,
    any // Using 'any' here is a pragmatic choice for the mock, as the props are a mix of HTML and Chakra-specific ones.
  >(function MockChakraIconButton(props, ref): ReactElement {
    // Correctly destructure and ignore non-standard props for a native button
    const { aspectRatio, me, size, variant, height, color, children, ...rest } = props
    return (
      <button ref={ref} type="button" {...rest}>
        {children}
      </button>
    )
  })
  MockChakraIconButton.displayName = "MockChakraIconButton"
  return { ...original, Input: MockChakraInput, IconButton: MockChakraIconButton }
})

// endregion

type TestForm = {
  password: string
}

describe("PasswordInput", () => {
  it("should render the input and toggle type on click", async () => {
    const user = userEvent.setup()
    render(<PasswordInput name="password" errors={{}} />)
    const input = screen.getByPlaceholderText<HTMLInputElement>("password-input")
    const toggleButton = screen.getByRole("button", { name: "Toggle password visibility" })
    expect(input.type).toBe("password")
    await user.click(toggleButton)
    expect(input.type).toBe("text")
    await user.click(toggleButton)
    expect(input.type).toBe("password")
  })

  it("should display an error message when an error is provided", () => {
    const errors: FieldErrors<TestForm> = { password: { type: "required", message: "This field is required" } }
    render(<PasswordInput name="password" errors={errors} />)
    expect(screen.getByText("This field is required")).toBeInTheDocument()
  })

  it("should not display an error message when no error is provided", () => {
    render(<PasswordInput name="password" errors={{}} />)
    expect(screen.queryByText("This field is required")).not.toBeInTheDocument()
  })
})
