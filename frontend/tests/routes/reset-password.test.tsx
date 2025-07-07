// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols

/**
 * @file Unit tests for src/routes/reset-password.tsx
 * @description These tests verify the complete user flow of the ResetPassword form,
 * including validation and submission. All UI components and external hooks
 * are mocked to ensure true unit testing in isolation, preventing environment-specific errors.
 */

import {
  confirmPasswordRules,
  extractApiErrorMessage,
  passwordRules,
} from "@/utils"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import type { ForwardedRef, ReactElement, ReactNode } from "react"
import React from "react"
import { useForm } from "react-hook-form"
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest"

import { ResetPassword } from "@/routes/reset-password"

// region Mocks

// Mocked authentication hook
const mockShowSuccessToast: Mock = vi.fn()
const mockShowApiErrorToast: Mock = vi.fn()
vi.mock("@/hooks/useCustomToast", () => ({
  __esModule: true,
  /**
   * Mock implementation of the useCustomToast hook.
   * @returns {object} Mocked toast methods.
   */
  default: (): object => ({
    showSuccessToast: mockShowSuccessToast,
    showApiErrorToast: mockShowApiErrorToast,
  }),
}))

// Mock isLoggedIn
vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  /**
   * Mock implementation of isLoggedIn.
   * @returns {boolean} Always returns false for testing.
   */
  isLoggedIn: (): boolean => false,
}))

// Mock TanStack React Query
const mockMutate: Mock = vi.fn()
const mockMutation: { mutate: Mock; isPending: boolean } = {
  mutate: mockMutate,
  isPending: false,
}
vi.mock("@tanstack/react-query", async (importOriginal): Promise<any> => {
  const original: any = await importOriginal()
  return {
    ...original,
    /**
     * Mock for useMutation hook.
     * @returns {object} Mocked mutation object with mutate function and isPending state.
     */
    useMutation: vi.fn().mockImplementation(({ onSuccess, onError }) => {
      return {
        ...mockMutation,
        mutate: async (data: any) => {
          try {
            const result = await mockMutate(data)
            onSuccess?.(result)
            return result
          } catch (error) {
            onError?.(error)
          }
        },
      }
    }),
  }
})

// Mock TanStack Router components
const mockNavigate: Mock = vi.fn()
vi.mock(
  "@tanstack/react-router",
  async (importOriginal): Promise<Record<string, any>> => {
    const original = await importOriginal<Record<string, any>>()
    return {
      ...original,
      /**
       * Mock for Link component.
       * @param children - The content of the link.
       * @param to - The URL to navigate to.
       * @param className - Optional CSS class for the link.
       * @param rest - Additional props for the link.
       * @returns {ReactElement} A mocked anchor tag.
       */
      Link: ({
        children,
        to,
        className,
        ...rest
      }: {
        children: ReactNode
        to: string
        className?: string
        [key: string]: any
      }): ReactElement => (
        <a href={to} className={className} {...rest}>
          {children}
        </a>
      ),
      /**
       * Mock for useNavigate hook.
       * @returns {Mock} Mocked navigate function.
       */
      useNavigate: (): Mock => mockNavigate,
      redirect: vi.fn(),
    }
  },
)

// Mock react-icons/fi
vi.mock("react-icons/fi", () => ({
  /**
   * Mock for react-icons/fi/FiLock.
   * @returns {ReactElement} A span containing the text "lock-icon".
   */
  FiLock: (): ReactElement => <span>lock-icon</span>,
  /**
   * Mock for react-icons/fi/FiEye.
   * @returns {ReactElement} A span containing the text "eye-icon".
   */
  FiEye: (): ReactElement => <span>eye-icon</span>,
  /**
   * Mock for react-icons/fi/FiEyeOff.
   * @returns {ReactElement} A span containing the text "eye-off-icon".
   */
  FiEyeOff: (): ReactElement => <span>eye-off-icon</span>,
}))

// Mock loginLoginRouterResetPassword
vi.mock("@/client", () => ({
  /**
   * Mock for loginLoginRouterResetPassword API call.
   * @returns {Promise<void>} A resolved promise.
   */
  loginLoginRouterResetPassword: vi.fn((): Promise<void> => Promise.resolve()),
}))

// Mock Chakra UI components
vi.mock("@chakra-ui/react", async (importOriginal): Promise<any> => {
  const original: any = await importOriginal()
  return {
    ...original,
    /**
     * Mock for Chakra Container component.
     * @param children - The content of the container.
     * @param as - Optional HTML element type.
     * @param h - Optional height of the container.
     * @param maxW - Optional maximum width of the container.
     * @param alignItems - Optional alignment of items.
     * @param justifyContent - Optional justification of content.
     * @param gap - Optional gap between elements.
     * @param centerContent - Optional flag to center content.
     * @param rest - Additional props for the container.
     * @param ref - Forwarded ref for the form element.
     * @returns {ReactElement} A mocked form element.
     */
    Container: React.forwardRef<
      HTMLFormElement,
      {
        children: ReactNode
        as?: string
        h?: string
        maxW?: string
        alignItems?: string
        justifyContent?: string
        gap?: string
        centerContent?: boolean
        [key: string]: any
      }
    >(
      (
        {
          as,
          h,
          maxW,
          alignItems,
          justifyContent,
          gap,
          centerContent,
          children,
          ...rest
        },
        ref: ForwardedRef<HTMLFormElement>,
      ): ReactElement => (
        <form {...rest} ref={ref}>
          {children}
        </form>
      ),
    ),
    /**
     * Mock for Chakra Heading component.
     * @param children - The content of the heading.
     * @param size - Optional size of the heading.
     * @param color - Optional color of the heading.
     * @param textAlign - Optional text alignment.
     * @param mb - Optional bottom margin.
     * @param rest - Additional props for the heading.
     * @returns {ReactElement} A mocked h1 element.
     */
    Heading: ({
      children,
      size,
      color,
      textAlign,
      mb,
      ...rest
    }: {
      children: ReactNode
      size?: string
      color?: string
      textAlign?: string
      mb?: string
      [key: string]: any
    }): ReactElement => <h1 {...rest}>{children}</h1>,
    /**
     * Mock for Chakra Text component.
     * @param children - The content of the text.
     * @param textAlign - Optional text alignment.
     * @param rest - Additional props for the text.
     * @returns {ReactElement} A mocked paragraph element.
     */
    Text: ({
      children,
      textAlign,
      ...rest
    }: {
      children: ReactNode
      textAlign?: string
      [key: string]: any
    }): ReactElement => <p {...rest}>{children}</p>,
    /**
     * Mock for Chakra Field component.
     * @param children - The content of the field.
     * @param invalid - Indicates if the field has an error.
     * @param errorText - The error message to display.
     * @param rest - Additional props for the field.
     * @param ref - Forwarded ref for the field element.
     * @returns {ReactElement} A mocked div element with error message.
     */
    Field: React.forwardRef<
      HTMLDivElement,
      {
        children: ReactNode
        invalid?: boolean
        errorText?: string
        [key: string]: any
      }
    >(
      (
        { children, invalid, errorText, ...rest },
        ref: ForwardedRef<HTMLDivElement>,
      ): ReactElement => (
        <div {...rest} ref={ref}>
          {children}
          {invalid && errorText && (
            <span
              data-part="error-text"
              aria-live="polite"
              className="chakra-field__errorText"
            >
              {errorText}
            </span>
          )}
        </div>
      ),
    ),
    /**
     * Mock for Chakra Input component.
     * @param rest - Additional props for the input.
     * @param ref - Forwarded ref for the input element.
     * @returns {ReactElement} A mocked input element.
     */
    Input: React.forwardRef<
      HTMLInputElement,
      {
        [key: string]: any
      }
    >(
      ({ ...rest }, ref: ForwardedRef<HTMLInputElement>): ReactElement => (
        <input {...rest} ref={ref} />
      ),
    ),
    /**
     * Mock for Chakra InputGroup component.
     * @param children - The content of the group.
     * @param startElement - Optional element to display at the start.
     * @param endElement - Optional element to display at the end.
     * @param rest - Additional props for the group.
     * @param ref - Forwarded ref for the group element.
     * @returns {ReactElement} A mocked div element.
     */
    InputGroup: React.forwardRef<
      HTMLDivElement,
      {
        children: ReactNode
        startElement?: ReactNode
        endElement?: ReactNode
        [key: string]: any
      }
    >(
      (
        { children, startElement, endElement, ...rest },
        ref: ForwardedRef<HTMLDivElement>,
      ): ReactElement => (
        <div {...rest} ref={ref}>
          {startElement}
          {children}
          {endElement}
        </div>
      ),
    ),
    /**
     * Mock for Chakra IconButton component.
     * @param rest - Additional props for the button.
     * @param ref - Forwarded ref for the button element.
     * @returns {ReactElement} A mocked button element.
     */
    IconButton: React.forwardRef<
      HTMLButtonElement,
      {
        [key: string]: any
      }
    >(
      ({ ...rest }, ref: ForwardedRef<HTMLButtonElement>): ReactElement => (
        <button {...rest} ref={ref}>
          icon-button
        </button>
      ),
    ),
  }
})

// Mock PasswordInput component
vi.mock("@/components/ui/password-input", () => ({
  /**
   * Mock for PasswordInput component.
   * @param errors - Optional error object for the field.
   * @param name - The name of the input field.
   * @param startElement - Optional element to display at the start.
   * @param rest - Additional props for the input.
   * @param ref - Forwarded ref for the input element.
   * @returns {ReactElement} A mocked password input with name attribute and error message.
   */
  PasswordInput: React.forwardRef<
    HTMLInputElement,
    {
      errors?: { [key: string]: { message?: string } }
      name: string
      startElement?: ReactNode
      [key: string]: any
    }
  >((props, ref) => {
    const { errors, startElement, name, ...rest } = props
    return (
      <div data-testid={`password-input-${name}`}>
        <div>
          {startElement}
          <input type="password" name={name} {...rest} ref={ref} />
          <button type="button" aria-label="Toggle password visibility">
            eye-icon
          </button>
        </div>
        {errors?.[name]?.message && (
          <span
            data-part="error-text"
            aria-live="polite"
            className="chakra-field__errorText"
          >
            {errors[name].message}
          </span>
        )}
      </div>
    )
  }),
}))

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  /**
   * Mock for Button component.
   * @param children - The content of the button.
   * @param loading - Optional flag indicating if the button is in loading state.
   * @param variant - Optional variant of the button (e.g., solid).
   * @param rest - Additional props for the button.
   * @returns {ReactElement} A mocked button element.
   */
  Button: ({
    children,
    loading,
    variant,
    ...rest
  }: {
    children: ReactNode
    loading?: boolean
    variant?: string
    [key: string]: any
  }): ReactElement => (
    <button disabled={loading} {...rest}>
      {children}
    </button>
  ),
}))

// Mock extractApiErrorMessage
vi.mock("@/utils", async (importOriginal): Promise<any> => {
  const original: any = await importOriginal()
  return {
    ...original,
    extractApiErrorMessage: vi.fn((err: any) => {
      if (err.body?.detail) {
        return err.body.detail
      }
      return "An unexpected error occurred."
    }),
  }
})

// Mock react-hook-form
const mockTrigger: Mock = vi.fn()
const createMockUseForm = (
  testValues: { [key: string]: string },
  errors: { [key: string]: { message?: string } } = {},
  isValid = true,
) => {
  const formValues: { [key: string]: string } = {
    ...(testValues as Record<string, string>),
  }

  return {
    register: vi.fn((name: string) => ({
      name,
      onChange: vi.fn(async (e: { target: { value: string } }) => {
        formValues[name] = e.target.value
      }),
      onBlur: vi.fn(),
    })),
    handleSubmit: vi.fn(
      (onSubmit: (data: any) => void) => async (e: React.FormEvent) => {
        e.preventDefault()
        if (isValid) {
          onSubmit(formValues)
        }
      },
    ),
    getValues: vi.fn(() => ({ ...formValues })),
    setValue: vi.fn((name: string, value: any) => {
      formValues[name] = value
      return Promise.resolve()
    }),
    watch: vi.fn((name?: string | string[]) => {
      if (Array.isArray(name)) {
        return name.map((n) => formValues[n])
      }
      if (name) {
        return formValues[name]
      }
      return { ...formValues }
    }),
    reset: vi.fn(),
    resetField: vi.fn((name: string, options?: { defaultValue?: any }) => {
      if (options?.defaultValue !== undefined) {
        formValues[name] = options.defaultValue
      } else {
        formValues[name] = ""
      }
    }),
    unregister: vi.fn((name: string) => {
      delete formValues[name]
    }),
    formState: {
      errors,
      isValid,
      isDirty: false,
      isSubmitting: false,
      isSubmitted: false,
      isSubmitSuccessful: false,
      submitCount: 0,
      dirtyFields: {},
      touchedFields: {},
      isLoading: false,
      isValidating: false,
    },
    trigger: mockTrigger,
    control: {} as any,
    getFieldState: vi.fn(() => ({
      invalid: false,
      isDirty: false,
      isTouched: false,
      error: undefined,
    })),
    setError: vi.fn(),
    clearErrors: vi.fn(),
    setFocus: vi.fn(),
  }
}

vi.mock("react-hook-form", async (importOriginal): Promise<any> => {
  const original: any = await importOriginal()
  return {
    ...original,
    /**
     * Mock for useForm hook.
     * @returns {object} Mocked form methods and state.
     */
    useForm: vi.fn(),
  }
})

describe("ResetPassword Page Integration", (): void => {
  let user: UserEvent

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
    // Mock URLSearchParams to simulate a valid token by default
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      search: "?token=valid-token",
    })
    // Reset mockMutation
    mockMutation.isPending = false
    mockMutate.mockReset()
    mockTrigger.mockReset()
  })

  it("should render the reset password form correctly", (): void => {
    vi.mocked(useForm).mockReturnValue(
      createMockUseForm({ new_password: "", confirm_password: "" }),
    )
    render(<ResetPassword />)
    expect(
      screen.getByRole("heading", { name: "Reset Password" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Please enter your new password and confirm it to reset your password.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText("New Password")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Reset Password" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Back to Log In" }),
    ).toBeInTheDocument()
  })

  it.each([
    {
      field: "New Password",
      name: "new_password",
      error: "Password is required",
      value: "",
      prefill: null,
    },
    {
      field: "Confirm Password",
      name: "confirm_password",
      error: "Password confirmation is required",
      value: "",
      prefill: { name: "new_password", value: "ValidPass123!" },
    },
    {
      field: "New Password",
      name: "new_password",
      error: "Password must be at least 8 characters",
      value: "short",
      prefill: null,
    },
    {
      field: "Confirm Password",
      name: "confirm_password",
      error: "The passwords do not match",
      value: "MismatchPass123!",
      prefill: { name: "new_password", value: "ValidPass123!" },
    },
  ])(
    "should display validation error for $field",
    async ({ name, error, value, prefill }): Promise<void> => {
      const formValues: { [key: string]: string } = {
        new_password: prefill?.name === "new_password" ? prefill.value : value,
        confirm_password:
          prefill?.name === "confirm_password" ? prefill.value : value,
      }
      const errors: { [key: string]: { message?: string } } = {
        [name]: { message: error },
      }
      vi.mocked(useForm).mockReturnValue(
        createMockUseForm(formValues, errors, false),
      )

      render(<ResetPassword />)
      const submitButton: HTMLElement = screen.getByRole("button", {
        name: "Reset Password",
      })

      if (prefill) {
        const prefillInput: HTMLElement = screen.getByPlaceholderText(
          prefill.name === "new_password" ? "New Password" : "Confirm Password",
        )
        await user.type(prefillInput, prefill.value)
      }
      if (value) {
        const input: HTMLElement = screen.getByPlaceholderText(
          name === "new_password" ? "New Password" : "Confirm Password",
        )
        await user.type(input, value)
      }

      mockTrigger.mockImplementation(async () => {
        const rules =
          name === "new_password"
            ? passwordRules()
            : confirmPasswordRules(() => formValues)
        const valueToValidate = formValues[name]
        if (rules.required && !valueToValidate) {
          return false
        }
        if (
          rules.minLength &&
          valueToValidate.length < (rules.minLength.value as number)
        ) {
          return false
        }
        if (rules.validate && typeof rules.validate === "function") {
          const result = rules.validate(valueToValidate)
          return result === true || result === undefined
        }
        return true
      })
      await user.click(submitButton)
      await waitFor((): void => {
        expect(screen.getByText(error)).toBeInTheDocument()
      })
      expect(mockMutate).not.toHaveBeenCalled()
    },
  )

  it("should call mutation with valid data and token", async (): Promise<void> => {
    const formValues: { [key: string]: string } = {
      new_password: "ValidPass123!",
      confirm_password: "ValidPass123!",
    }
    vi.mocked(useForm).mockReturnValue(createMockUseForm(formValues, {}, true))

    render(<ResetPassword />)
    const passwordInput: HTMLElement =
      screen.getByPlaceholderText("New Password")
    const confirmPasswordInput: HTMLElement =
      screen.getByPlaceholderText("Confirm Password")
    const submitButton: HTMLElement = screen.getByRole("button", {
      name: "Reset Password",
    })

    await user.type(passwordInput, "ValidPass123!")
    await user.type(confirmPasswordInput, "ValidPass123!")
    mockTrigger.mockResolvedValue(true)
    await user.click(submitButton)

    await waitFor((): void => {
      expect(mockMutate).toHaveBeenCalledWith({
        new_password: "ValidPass123!",
        token: "valid-token",
      })
    })
  })

  it("should show error toast when token is missing", async (): Promise<void> => {
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      search: "",
    })
    vi.mocked(extractApiErrorMessage).mockReturnValue(
      "No password reset token found in URL.",
    )

    const formValues: { [key: string]: string } = {
      new_password: "ValidPass123!",
      confirm_password: "ValidPass123!",
    }
    vi.mocked(useForm).mockReturnValue(createMockUseForm(formValues, {}, true))

    render(<ResetPassword />)
    const submitButton: HTMLElement = screen.getByRole("button", {
      name: "Reset Password",
    })

    await user.click(submitButton)

    await waitFor((): void => {
      expect(mockShowApiErrorToast).toHaveBeenCalledWith({
        body: { detail: "No password reset token found in URL." },
        status: 400,
        statusText: "Bad Request",
        url: window.location.href,
      })
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  it("should show success toast and navigate on successful mutation", async (): Promise<void> => {
    mockMutate.mockResolvedValue(undefined)
    const formValues: { [key: string]: string } = {
      new_password: "ValidPass123!",
      confirm_password: "ValidPass123!",
    }
    vi.mocked(useForm).mockReturnValue(createMockUseForm(formValues, {}, true))

    render(<ResetPassword />)
    const passwordInput: HTMLElement =
      screen.getByPlaceholderText("New Password")
    const confirmPasswordInput: HTMLElement =
      screen.getByPlaceholderText("Confirm Password")
    const submitButton: HTMLElement = screen.getByRole("button", {
      name: "Reset Password",
    })

    await user.type(passwordInput, "ValidPass123!")
    await user.type(confirmPasswordInput, "ValidPass123!")
    mockTrigger.mockResolvedValue(true)
    await user.click(submitButton)

    await waitFor((): void => {
      expect(mockMutate).toHaveBeenCalledWith({
        new_password: "ValidPass123!",
        token: "valid-token",
      })
      expect(mockShowSuccessToast).toHaveBeenCalledWith(
        "Password updated successfully.",
      )
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" })
    })
  })

  it("should disable button while submitting", async (): Promise<void> => {
    mockMutation.isPending = true
    const formValues: { [key: string]: string } = {
      new_password: "ValidPass123!",
      confirm_password: "ValidPass123!",
    }
    vi.mocked(useForm).mockReturnValue(createMockUseForm(formValues, {}, true))

    render(<ResetPassword />)
    const passwordInput: HTMLElement =
      screen.getByPlaceholderText("New Password")
    const confirmPasswordInput: HTMLElement =
      screen.getByPlaceholderText("Confirm Password")
    const submitButton: HTMLElement = screen.getByRole("button", {
      name: "Reset Password",
    })

    await user.type(passwordInput, "ValidPass123!")
    await user.type(confirmPasswordInput, "ValidPass123!")
    mockTrigger.mockResolvedValue(true)
    await user.click(submitButton)

    await waitFor((): void => {
      expect(submitButton).toBeDisabled()
    })
  })

  it("should show error toast on mutation error", async (): Promise<void> => {
    const mockError: any = { body: { detail: "Invalid token" }, status: 400 }
    mockMutate.mockRejectedValue(mockError)
    vi.mocked(extractApiErrorMessage).mockReturnValue("Invalid token")
    const formValues: { [key: string]: string } = {
      new_password: "ValidPass123!",
      confirm_password: "ValidPass123!",
    }
    vi.mocked(useForm).mockReturnValue(createMockUseForm(formValues, {}, true))

    render(<ResetPassword />)
    const passwordInput: HTMLElement =
      screen.getByPlaceholderText("New Password")
    const confirmPasswordInput: HTMLElement =
      screen.getByPlaceholderText("Confirm Password")
    const submitButton: HTMLElement = screen.getByRole("button", {
      name: "Reset Password",
    })

    await user.type(passwordInput, "ValidPass123!")
    await user.type(confirmPasswordInput, "ValidPass123!")
    mockTrigger.mockResolvedValue(true)
    await user.click(submitButton)

    await waitFor(
      (): void => {
        expect(mockMutate).toHaveBeenCalledWith({
          new_password: "ValidPass123!",
          token: "valid-token",
        })
        expect(mockShowApiErrorToast).toHaveBeenCalledWith(mockError)
      },
      { timeout: 3000 },
    ) // Увеличиваем таймаут для асинхронных операций
  })
})
