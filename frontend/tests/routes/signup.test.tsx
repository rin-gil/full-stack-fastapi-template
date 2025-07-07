// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols

/**
 * @file Unit tests for src/routes/signup.tsx
 * @description These tests verify the complete user flow of the SignUp form,
 * including validation and submission. All UI components and external hooks
 * are mocked to ensure true unit testing in isolation, preventing environment-specific errors.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import type { ForwardedRef, ReactElement, ReactNode } from "react"
import React from "react"
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest"

import { SignUp } from "@/routes/signup"
import { emailPattern, namePattern } from "@/utils"

// region Mocks

// Mocked authentication hook
const mockSignUpMutation = {
  mutateAsync: vi.fn(),
}
const mockResetError: Mock = vi.fn()
vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  /**
   * Mock implementation of the useAuth hook.
   * @returns {object} Mocked authentication methods and state.
   */
  default: (): object => ({
    signUpMutation: mockSignUpMutation,
    error: null,
    resetError: mockResetError,
  }),
  isLoggedIn: (): boolean => false,
}))

// Mocked TanStack Router components
vi.mock(
  "@tanstack/react-router",
  async (importOriginal): Promise<any> => ({
    ...(await importOriginal<any>()),
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
    redirect: vi.fn(),
  }),
)

// Mock FastAPI logo
vi.mock("/assets/images/fastapi-logo.svg", () => ({ default: "logo.svg" }))

// Mock react-icons/fi
vi.mock("react-icons/fi", () => ({
  /**
   * Mock for react-icons/fi/FiUser.
   * @returns {ReactElement} A span containing the text "user-icon".
   */
  FiUser: (): ReactElement => <span>user-icon</span>,
  /**
   * Mock for react-icons/fi/FiLock.
   * @returns {ReactElement} A span containing the text "lock-icon".
   */
  FiLock: (): ReactElement => <span>lock-icon</span>,
}))

// Mock Chakra UI components
vi.mock("@chakra-ui/react", async (importOriginal): Promise<any> => {
  const original: any = await importOriginal<any>()
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
    Container: React.forwardRef<HTMLFormElement, any>(
      (
        { as, h, maxW, alignItems, justifyContent, gap, centerContent, children, ...rest },
        ref: ForwardedRef<HTMLFormElement>,
      ): ReactElement => (
        <form {...rest} ref={ref}>
          {children}
        </form>
      ),
    ),
    /**
     * Mock for Chakra Flex component.
     * @param children - The content of the flex container.
     * @param flexDir - Optional flex direction.
     * @param justify - Optional justification of content.
     * @param h - Optional height of the flex container.
     * @param rest - Additional props for the flex container.
     * @returns {ReactElement} A mocked div element.
     */
    Flex: ({ children, flexDir, justify, h, ...rest }: { children: ReactNode; [key: string]: any }): ReactElement => (
      <div {...rest}>{children}</div>
    ),
    /**
     * Mock for Chakra Image component.
     * @param alt - The alt text for the image.
     * @param src - The source URL of the image.
     * @param maxW - Optional maximum width of the image.
     * @param alignSelf - Optional alignment of the image.
     * @param mb - Optional bottom margin.
     * @param height - Optional height of the image.
     * @param rest - Additional props for the image.
     * @returns {ReactElement} A mocked image element.
     */
    Image: ({
      alt,
      src,
      maxW,
      alignSelf,
      mb,
      height,
      ...rest
    }: { alt: string; src: string; [key: string]: any }): ReactElement => (
      // biome-ignore lint/a11y/useAltText: Mock component
      <img alt={alt} src={src} {...rest} />
    ),
    /**
     * Mock for Chakra Input component.
     * @param props - Props for the input element.
     * @param ref - Forwarded ref for the input element.
     * @returns {ReactElement} A mocked input element.
     */
    Input: React.forwardRef<HTMLInputElement, any>(
      (props: any, ref: ForwardedRef<any>): ReactElement => <input {...props} ref={ref} />,
    ),
    /**
     * Mock for Chakra Text component.
     * @param children - The content of the text.
     * @returns {ReactElement} A mocked paragraph element.
     */
    Text: ({ children }: { children: ReactNode }): ReactElement => <p>{children}</p>,
  }
})

// Mock Field component
vi.mock("@/components/ui/field", () => ({
  /**
   * Mock for Field component.
   * @param children - The content of the field.
   * @param errorText - Optional error message to display.
   * @param invalid - Optional flag indicating if the field is invalid.
   * @param rest - Additional props for the field.
   * @returns {ReactElement} A mocked div.
   */
  Field: ({
    children,
    errorText,
    invalid,
    ...rest
  }: {
    children: ReactElement
    errorText?: string
    invalid?: boolean
    [key: string]: any
  }): ReactElement => (
    <div {...rest}>
      {children}
      {errorText && <span role="alert">{errorText}</span>}
    </div>
  ),
}))

// Mock PasswordInput component
vi.mock("@/components/ui/password-input", () => ({
  /**
   * Mock for PasswordInput component.
   * @param errors - Optional error object for the field.
   * @param name - The name of the input field.
   * @param startElement - Optional element to display at the start.
   * @param rest - Additional props for the input.
   * @param ref - Forwarded ref for the input element.
   * @returns {ReactElement} A mocked password input with name attribute.
   */
  PasswordInput: React.forwardRef<
    HTMLInputElement,
    {
      errors?: { [key: string]: { message?: string } }
      name: string
      [key: string]: any
    }
  >((props, ref) => {
    const { errors, startElement, name, ...rest } = props
    return (
      <>
        <input type="password" name={name} {...rest} ref={ref} />
        {errors?.[name]?.message && <span role="alert">{errors[name].message}</span>}
      </>
    )
  }),
}))

// Mock InputGroup component
vi.mock("@/components/ui/input-group", () => ({
  /**
   * Mock for InputGroup component.
   * @param children - The content of the input group.
   * @param w - Optional width of the input group.
   * @param startElement - Optional element to display at the start.
   * @param rest - Additional props for the input group.
   * @returns {ReactElement} A mocked div.
   */
  InputGroup: ({
    children,
    w,
    startElement,
    ...rest
  }: {
    children: ReactElement
    w?: string
    startElement?: ReactElement
    [key: string]: any
  }): ReactElement => <div {...rest}>{children}</div>,
}))

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  /**
   * Mock for Button component.
   * @param children - The content of the button.
   * @param loading - Optional flag indicating if the button is in loading state.
   * @param variant - Optional variant of the button (e.g., primary, secondary).
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

// endregion

describe("SignUp Page Integration", (): void => {
  let user: UserEvent

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
  })

  it("should render the sign-up form correctly", (): void => {
    render(<SignUp />)
    expect(screen.getByPlaceholderText("Full Name")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Log In" })).toBeInTheDocument()
  })

  it("should display validation errors for empty fields", async (): Promise<void> => {
    render(<SignUp />)
    const submitButton: HTMLElement = screen.getByRole("button", {
      name: "Sign Up",
    })
    await user.click(submitButton)
    await waitFor((): void => {
      expect(screen.getByText("Full Name is required")).toBeInTheDocument()
      expect(screen.getByText("Email is required")).toBeInTheDocument()
      expect(screen.getByText("Password is required")).toBeInTheDocument()
      expect(screen.getByText("Password confirmation is required")).toBeInTheDocument()
    })
    expect(mockSignUpMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("should display validation error for invalid full name", async (): Promise<void> => {
    render(<SignUp />)
    const fullNameInput: HTMLElement = screen.getByPlaceholderText("Full Name")
    fireEvent.change(fullNameInput, { target: { value: "12" } })
    fireEvent.blur(fullNameInput)
    await waitFor((): void => {
      expect(screen.getByText(namePattern.message)).toBeInTheDocument()
    })
    expect(mockSignUpMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("should display validation error for invalid email", async (): Promise<void> => {
    render(<SignUp />)
    const emailInput: HTMLElement = screen.getByPlaceholderText("Email")
    fireEvent.change(emailInput, { target: { value: "invalid-email" } })
    fireEvent.blur(emailInput)
    await waitFor((): void => {
      expect(screen.getByText(emailPattern.message)).toBeInTheDocument()
    })
    expect(mockSignUpMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("should display validation error for short password", async (): Promise<void> => {
    render(<SignUp />)
    const passwordInput: HTMLElement = screen.getByPlaceholderText("Password")
    fireEvent.change(passwordInput, { target: { value: "short" } })
    fireEvent.blur(passwordInput)
    await waitFor((): void => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument()
    })
    expect(mockSignUpMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("should display validation error for mismatched passwords", async (): Promise<void> => {
    render(<SignUp />)
    const passwordInput: HTMLElement = screen.getByPlaceholderText("Password")
    const confirmPasswordInput: HTMLElement = screen.getByPlaceholderText("Confirm Password")
    fireEvent.change(passwordInput, { target: { value: "ValidPass123!" } })
    fireEvent.change(confirmPasswordInput, {
      target: { value: "MismatchPass123!" },
    })
    fireEvent.blur(confirmPasswordInput)
    await waitFor((): void => {
      expect(screen.getByText("The passwords do not match")).toBeInTheDocument()
    })
    expect(mockSignUpMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("should call sign-up mutation on valid submission", async (): Promise<void> => {
    render(<SignUp />)
    const fullNameInput: HTMLElement = screen.getByPlaceholderText("Full Name")
    const emailInput: HTMLElement = screen.getByPlaceholderText("Email")
    const passwordInput: HTMLElement = screen.getByPlaceholderText("Password")
    const confirmPasswordInput: HTMLElement = screen.getByPlaceholderText("Confirm Password")
    fireEvent.change(fullNameInput, { target: { value: "John Doe" } })
    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "ValidPass123!" } })
    fireEvent.change(confirmPasswordInput, {
      target: { value: "ValidPass123!" },
    })
    await user.click(screen.getByRole("button", { name: "Sign Up" }))
    await waitFor((): void => {
      expect(mockSignUpMutation.mutateAsync).toHaveBeenCalledWith({
        email: "test@example.com",
        full_name: "John Doe",
        password: "ValidPass123!",
      })
    })
  })

  it("should disable button while submitting", async (): Promise<void> => {
    mockSignUpMutation.mutateAsync.mockImplementation((): Promise<void> => new Promise((): void => {}))
    render(<SignUp />)
    const submitButton: HTMLElement = screen.getByRole("button", {
      name: "Sign Up",
    })
    const fullNameInput: HTMLElement = screen.getByPlaceholderText("Full Name")
    const emailInput: HTMLElement = screen.getByPlaceholderText("Email")
    const passwordInput: HTMLElement = screen.getByPlaceholderText("Password")
    const confirmPasswordInput: HTMLElement = screen.getByPlaceholderText("Confirm Password")
    fireEvent.change(fullNameInput, { target: { value: "John Doe" } })
    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "ValidPass123!" } })
    fireEvent.change(confirmPasswordInput, {
      target: { value: "ValidPass123!" },
    })
    await user.click(submitButton)
    await waitFor((): void => {
      expect(submitButton).toBeDisabled()
    })
  })
})
