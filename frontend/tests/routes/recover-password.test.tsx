// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols

/**
 * @file Unit tests for src/routes/recover-password.tsx
 * @description These tests cover the RecoverPassword component's functionality,
 * including form rendering, validation, and submission states. All external
 * hooks and components are mocked to ensure isolated unit testing.
 */

import { useMutation } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { UserEvent } from "@testing-library/user-event"
import type { ReactElement, ReactNode } from "react"
import { useForm } from "react-hook-form"
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest"

import type { ApiError } from "@/client"
import { loginLoginRouterRecoverPassword } from "@/client"
import { RecoverPassword } from "@/routes/recover-password"
import { emailPattern } from "@/utils"

// region Mocks

// Mock useCustomToast to spy on its methods.
const mockShowApiErrorToast: Mock = vi.fn() // Simple spy mock
vi.mock("@/hooks/useCustomToast", () => ({
  /**
   * Mock implementation of the useCustomToast hook.
   * @returns {object} An object with the mocked `showApiErrorToast` method.
   */
  default: (): object => ({ showApiErrorToast: mockShowApiErrorToast }),
}))

// Mock useAuth to always return a non-authenticated state.
vi.mock("@/hooks/useAuth", () => ({
  /**
   * Mock implementation of isLoggedIn.
   * @returns {boolean} Always returns false for testing purposes.
   */
  isLoggedIn: (): boolean => false,
}))

// Mock @tanstack/react-router to provide simplified implementations.
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>()
  return {
    ...original,
    /**
     * Mock for createFileRoute that returns the options object.
     * @param {string} _path - The route path (ignored in mock).
     * @returns {function(object): object} A function that returns its options.
     */
    createFileRoute:
      (_path: string): ((arg0: object) => object) =>
      (options: any) => ({ ...options }),
    /**
     * Mock for the Link component that renders a simple anchor tag.
     * @param {object} props - The component props.
     * @returns {ReactElement} A mocked anchor tag.
     */
    Link: ({ children, to, ...rest }: { children: ReactNode; to: string; [key: string]: any }): ReactElement => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  }
})

// Mock react-icons/fi for a simple icon placeholder.
vi.mock("react-icons/fi", () => ({
  /**
   * Mock for the FiMail icon.
   * @returns {ReactElement} A span with placeholder text.
   */
  FiMail: (): ReactElement => <span>mail-icon</span>,
}))

// Mock the API client module.
vi.mock("@/client")

// Mock custom UI components to be simple, non-styled elements.
vi.mock("@/components/ui/button", () => ({
  /**
   * Mock for the Button component.
   * @param {object} props - Component props.
   * @returns {ReactElement} A mocked button element.
   */
  Button: ({
    children,
    loading,
    ...rest
  }: { children: ReactNode; loading?: boolean; [key: string]: any }): ReactElement => (
    <button disabled={loading} {...rest}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/field", () => ({
  /**
   * Mock for the Field component.
   * @param {object} props - Component props.
   * @returns {ReactElement} A mocked div element with optional error text.
   */
  Field: ({
    children,
    errorText,
    invalid, // Consume the 'invalid' prop to prevent React warnings.
    ...rest
  }: {
    children: ReactNode
    errorText?: string
    invalid?: boolean
    [key: string]: any
  }): ReactElement => (
    <div {...rest}>
      {children}
      {errorText && <span>{errorText}</span>}
    </div>
  ),
}))

vi.mock("@/components/ui/input-group", () => ({
  /**
   * Mock for the InputGroup component.
   * @param {object} props - Component props.
   * @returns {ReactElement} A mocked div element.
   */
  InputGroup: ({ children, startElement }: { children: ReactNode; startElement?: ReactNode }): ReactElement => (
    <div>
      {startElement}
      {children}
    </div>
  ),
}))

// Mock Chakra UI components to be basic HTML elements and consume their specific props.
vi.mock("@chakra-ui/react", () => ({
  /**
   * Mock for the Container component.
   * @param {object} props - Component props.
   * @returns {ReactElement} A mocked form element.
   */
  Container: ({
    children,
    as,
    h,
    maxW,
    alignItems,
    justifyContent,
    gap,
    centerContent,
    ...rest
  }: {
    children: ReactNode
    [key: string]: any
  }): ReactElement => <form {...rest}>{children}</form>,
  /**
   * Mock for the Heading component.
   * @param {object} props - Component props.
   * @returns {ReactElement} A mocked h1 element.
   */
  Heading: ({
    children,
    size,
    color,
    textAlign,
    mb,
    ...rest
  }: { children: ReactNode; [key: string]: any }): ReactElement => <h1 {...rest}>{children}</h1>,
  /**
   * Mock for the Text component.
   * @param {object} props - Component props.
   * @returns {ReactElement} A mocked p element.
   */
  Text: ({ children, textAlign, mt, ...rest }: { children: ReactNode; [key: string]: any }): ReactElement => (
    <p {...rest}>{children}</p>
  ),
  /**
   * Mock for the Input component.
   * @param {object} props - Component props.
   * @returns {ReactElement} A mocked input element.
   */
  Input: (props: any): ReactElement => <input {...props} />,
}))

// Mock the main hooks at the top level.
vi.mock("react-hook-form")
vi.mock("@tanstack/react-query")

// endregion

describe("RecoverPassword Component", (): void => {
  // region Test Setup
  let user: UserEvent
  // Use 'any' for the mock result to avoid complex type definitions and focus on logic.
  let mockMutationResult: any

  beforeEach((): void => {
    user = userEvent.setup()
    vi.clearAllMocks()
    mockMutationResult = { isPending: false, isSuccess: false, mutate: vi.fn() }
    vi.mocked(useForm).mockReturnValue({
      register: vi.fn(),
      /**
       * Handles form submission.
       * @description Prevents the default form submission, then calls the provided callback function
       * with a mock form data object containing a test email address.
       * @param {Function} fn - The callback function to be invoked with form data.
       * @returns {Function} A function that takes an event as an argument and processes the form submission.
       */
      handleSubmit:
        (fn: any): any =>
        (e: any): void => {
          if (e) e.preventDefault()
          fn({ email: "test@example.com" })
        },
      formState: { errors: {} },
    } as any)

    vi.mocked(useMutation).mockImplementation((options: any): any => {
      mockMutationResult.mutate = vi.fn(async (data): Promise<void> => {
        try {
          await options.mutationFn(data)
          // The component logic for success is now based on `isSuccess`, so onSuccess callback is less critical.
        } catch (error) {
          if (options.onError) options.onError(error, data, undefined)
        }
      })
      return mockMutationResult
    })
  })
  // endregion

  // region Render Tests
  it("should render the initial form correctly", (): void => {
    render(<RecoverPassword />)
    expect(screen.getByRole("heading", { name: "Password Recovery" })).toBeInTheDocument()
    expect(screen.getByText("A password recovery email will be sent to the registered account.")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back to Log In" })).toBeInTheDocument()
  })
  // endregion

  // region Validation Tests
  it("should display validation error if email is invalid", async (): Promise<void> => {
    vi.mocked(useForm).mockReturnValue({
      register: vi.fn(),
      /**
       * A mock implementation of `useForm`'s `handleSubmit` that simply calls the
       * provided function with no arguments.
       *
       * @param {Function} fn The function to call on form submission.
       * @returns {Function} The mocked `handleSubmit` function.
       */
      handleSubmit: (fn: any): any => fn,
      formState: { errors: { email: { message: emailPattern.message } } },
    } as any)
    render(<RecoverPassword />)
    expect(screen.getByText(emailPattern.message)).toBeInTheDocument()
  })
  // endregion

  // region State and Submission Tests
  it("should call the mutation on valid form submission", async (): Promise<void> => {
    render(<RecoverPassword />)
    await user.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor((): void => {
      expect(mockMutationResult.mutate).toHaveBeenCalledWith({ email: "test@example.com" })
    })
  })

  it("should disable the button and input when pending", (): void => {
    mockMutationResult.isPending = true
    render(<RecoverPassword />)
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
    expect(screen.getByPlaceholderText("Email")).toBeDisabled()
  })

  it("should show success view when submission is successful", (): void => {
    mockMutationResult.isSuccess = true
    render(<RecoverPassword />)
    expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument()
  })

  it("should show success view even when API returns a 404 to prevent user enumeration", async (): Promise<void> => {
    // Simulate the API call failing with a 404 status.
    vi.mocked(loginLoginRouterRecoverPassword).mockRejectedValue({ status: 404 })
    const { rerender } = render(<RecoverPassword />)
    await user.click(screen.getByRole("button", { name: "Continue" }))
    // The component logic catches the 404 and transitions `useMutation` to a success state.
    mockMutationResult.isSuccess = true
    rerender(<RecoverPassword />) // Rerender to reflect the new state
    expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument()
    expect(mockShowApiErrorToast).not.toHaveBeenCalled()
  })

  it("should show an API error toast for non-404 errors", async (): Promise<void> => {
    // Use a Partial<ApiError> for a simpler mock object.
    const serverError: Partial<ApiError> = { status: 500, body: { detail: "Server error" } }
    vi.mocked(loginLoginRouterRecoverPassword).mockRejectedValue(serverError)
    render(<RecoverPassword />)
    await user.click(screen.getByRole("button", { name: "Continue" }))
    await waitFor((): void => {
      expect(mockShowApiErrorToast).toHaveBeenCalledWith(serverError)
    })
  })
  // endregion
})
