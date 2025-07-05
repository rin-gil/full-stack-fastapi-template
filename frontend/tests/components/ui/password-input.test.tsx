/**
 * @file Unit tests for src/components/ui/password-input.tsx
 */

import { type RenderResult, render, screen } from "@testing-library/react"
// biome-ignore lint/style/useImportType: <explanation>
import userEvent, { UserEvent } from "@testing-library/user-event"
import type { FieldErrors } from "react-hook-form"
import { describe, expect, it } from "vitest"

import { PasswordInput } from "@/components/ui/password-input"
import { CustomProvider } from "@/components/ui/provider"

type TestForm = {
  password: string
}

describe("PasswordInput", (): void => {
  // Helper to render the component within the app's actual provider
  const renderComponent = (errors: FieldErrors<TestForm>): RenderResult => {
    return render(
      <CustomProvider>
        <PasswordInput
          name="password"
          errors={errors}
          placeholder="Enter password"
        />
      </CustomProvider>,
    )
  }

  it("should render the input with a placeholder", (): void => {
    renderComponent({})
    expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument()
  })

  it("should display an error message and set aria-invalid=true when an error is provided", (): void => {
    const errors: FieldErrors<TestForm> = {
      password: { type: "required", message: "Password is required" },
    }
    renderComponent(errors)
    // Check for the error message
    expect(screen.getByText("Password is required")).toBeInTheDocument()
    // Check for the accessibility attribute
    expect(screen.getByPlaceholderText("Enter password")).toHaveAttribute(
      "aria-invalid",
      "true",
    )
  })

  it("should NOT display an error message and NOT have aria-invalid when no error is provided", (): void => {
    renderComponent({})
    // Make sure the error message is not there
    expect(screen.queryByText("Password is required")).not.toBeInTheDocument()
    // Make sure the aria-invalid attribute is NOT present
    expect(screen.getByPlaceholderText("Enter password")).not.toHaveAttribute(
      "aria-invalid",
    )
  })

  it("should toggle input type on button click", async (): Promise<void> => {
    const user: UserEvent = userEvent.setup()
    renderComponent({})
    const input =
      screen.getByPlaceholderText<HTMLInputElement>("Enter password")
    const toggleButton: HTMLElement = screen.getByRole("button")
    // Starts as a password input
    expect(input).toHaveAttribute("type", "password")
    // Click to show
    await user.click(toggleButton)
    expect(input).toHaveAttribute("type", "text")
    // Click to hide again
    await user.click(toggleButton)
    expect(input).toHaveAttribute("type", "password")
  })
})
