// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols

/**
 * @file Unit tests for the Login page component.
 * @description These tests verify the complete user flow of the Login form,
 * including validation and submission. All UI components and external hooks
 * are mocked to ensure true unit testing in isolation, preventing environment-specific errors.
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import type { ForwardedRef, ReactElement, ReactNode } from "react"
import React from "react"
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest"

import { Login } from "@/routes/login"
import { passwordRules } from "@/utils"

// region Mocks

// Mocked authentication hook, controlling API calls and user state.
const mockLoginMutation = {
  mutateAsync: vi.fn(),
}
// Mocked resetError function from useAuth hook.
const mockResetError: Mock = vi.fn()
vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  /**
   * Mock implementation of the `useAuth` hook.
   * @returns {object} An object containing:
   * - `loginMutation`: A mock of the login mutation function.
   * - `error`: A null value representing no error state.
   * - `resetError`: A mock function to reset errors.
   */
  default: (): object => ({
    loginMutation: mockLoginMutation,
    error: null,
    resetError: mockResetError,
  }),
  isLoggedIn: (): boolean => false,
}))

// Mocked TanStack Router components to prevent actual navigation.
vi.mock(
  "@tanstack/react-router",
  async (importOriginal): Promise<any> => ({
    ...(await importOriginal<any>()),
    /**
     * Mock for `Link` component.
     * @param {{children: ReactNode, to: string, className?: string, rest?: any}} props - Component props.
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
    // Mocked `redirect` function.
    redirect: vi.fn(),
  }),
)

// Mock for the FastAPI logo static asset.
vi.mock("/assets/images/fastapi-logo.svg", () => ({ default: "logo.svg" }))

// Mock for react-icons/fi icons.
vi.mock("react-icons/fi", () => ({
  // Mocked mail icon.
  FiMail: (): ReactElement => <span>mail-icon</span>,
  // Mocked lock icon.
  FiLock: (): ReactElement => <span>lock-icon</span>,
}))

// Mocked Chakra UI components. These mocks absorb Chakra-specific props
// to prevent them from being passed to native DOM elements, resolving
// React warnings and CSS parsing errors in JSDOM.
vi.mock("@chakra-ui/react", async (importOriginal): Promise<any> => {
  const original: any = await importOriginal<any>()
  return {
    ...original,
    /**
     * Mock for Chakra `Container` component.
     * @param {object} props - Component props.
     * @param {ReactNode} props.children - Child elements.
     * @param {React.Ref<HTMLFormElement>} ref - Forwarded ref.
     * @returns {ReactElement} A mocked form element.
     */
    Container: React.forwardRef<HTMLFormElement, any>(
      (props: any, ref: ForwardedRef<HTMLFormElement>): ReactElement => {
        // Destructure and ignore Chakra-specific layout props.
        const { as, h, maxW, alignItems, justifyContent, gap, centerContent, children, ...rest } = props
        return (
          <form {...rest} ref={ref}>
            {children}
          </form>
        )
      },
    ),
    /**
     * Mock for Chakra `Image` component.
     * @param {object} props - Component props.
     * @param {string} props.alt - Alt text for the image.
     * @param {string} props.src - Image source.
     * @returns {ReactElement} A mocked image element.
     */
    Image: ({ alt, src, ...props }: { alt: string; src: string; [key: string]: any }): ReactElement => {
      // Destructure and ignore Chakra-specific layout props.
      const { maxW, alignSelf, mb, height, ...rest } = props
      // biome-ignore lint/a11y/useAltText: <explanation>
      return <img alt={alt} src={src} {...rest} />
    },
    /**
     * Mock for Chakra `Input` component.
     * @param {object} props - Component props.
     * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref.
     * @returns {ReactElement} A mocked input element.
     */
    Input: React.forwardRef<HTMLInputElement, any>(
      (props: any, ref: ForwardedRef<any>): ReactElement => <input {...props} ref={ref} />,
    ),
    /**
     * Mock for Chakra `Text` component.
     * @param {object} props - Component props.
     * @param {ReactNode} props.children - Child elements.
     * @returns {ReactElement} A mocked paragraph element.
     */
    Text: ({ children }: { children: ReactNode }): ReactElement => <p>{children}</p>,
    /**
     * Mock for Chakra `AbsoluteCenter` component.
     * @param {object} props - Component props.
     * @param {ReactNode} props.children - Child elements.
     * @returns {ReactElement} A mocked div.
     */
    AbsoluteCenter: ({ children, ...rest }: { children: ReactNode; [key: string]: any }): ReactElement => (
      <div {...rest}>{children}</div>
    ),
    /**
     * Mock for Chakra `Spinner` component.
     * @param {object} props - Component props.
     * @param {ReactNode} props.children - Child elements.
     * @returns {ReactElement} A mocked span.
     */
    Spinner: ({ children, ...rest }: { children: ReactNode; [key: string]: any }): ReactElement => (
      <span {...rest}>{children}</span>
    ),
    /**
     * Mock for Chakra `Span` component.
     * @param {object} props - Component props.
     * @param {ReactNode} props.children - Child elements.
     * @returns {ReactElement} A mocked span.
     */
    Span: ({ children, ...rest }: { children: ReactNode; [key: string]: any }): ReactElement => (
      <span {...rest}>{children}</span>
    ),
  }
})

// Mocked `Field` component.
vi.mock("@/components/ui/field", () => ({
  /**
   * Mock for `Field` component.
   * @param {object} props - Component props.
   * @param {ReactElement} props.children - Child element (usually an input).
   * @param {string} [props.errorText] - Error message to display.
   * @param {boolean} [props.invalid] - Indicates invalid state.
   * @returns {ReactElement} A mocked div.
   */
  Field: ({
    children,
    errorText,
    invalid,
    ...rest // Absorb any additional props from Chakra's Field component.
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

// Mocked `PasswordInput` component.
vi.mock("@/components/ui/password-input", () => ({
  /**
   * Mock for `PasswordInput` component.
   * @param {object} props - Component props.
   * @param {object} [props.errors] - React Hook Form errors object.
   * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref.
   * @returns {ReactElement} A mocked password input.
   */
  PasswordInput: React.forwardRef<
    HTMLInputElement,
    { errors?: { password?: { message?: string } }; [key: string]: any }
  >((props, ref) => {
    // Absorb Chakra-specific props and the `errors` prop.
    const { errors, startElement, ...rest } = props
    return (
      <>
        <input type="password" placeholder="Password" {...rest} ref={ref} />
        {errors?.password?.message && <span role="alert">{errors.password.message}</span>}
      </>
    )
  }),
}))

// Mocked `InputGroup` component.
vi.mock("@/components/ui/input-group", () => ({
  /**
   * Mock for `InputGroup` component.
   * @param {object} props - Component props.
   * @param {ReactElement} props.children - Child elements.
   * @returns {ReactElement} A mocked div.
   */
  InputGroup: ({
    children,
    w,
    startElement,
    ...rest // Absorb any additional props.
  }: {
    children: ReactElement
    w?: string
    startElement?: ReactElement
    [key: string]: any
  }): ReactElement => <div {...rest}>{children}</div>,
}))

// Mocked `Button` component.
vi.mock("@/components/ui/button", () => ({
  /**
   * Mock for `Button` component.
   * @param {object} props - Component props.
   * @param {ReactNode} props.children - Button content.
   * @param {boolean} [props.loading] - If `true`, button is in loading state.
   * @param {string} [props.variant] - Button visual variant.
   * @param {string} [props.size] - Button size.
   * @returns {ReactElement} A mocked button element.
   */
  Button: ({
    children,
    loading, // This prop is explicitly used.
    variant, // This prop is absorbed.
    size, // This prop is absorbed.
    ...props // Remaining standard HTML button props are passed through.
  }: {
    children: ReactNode
    loading?: boolean
    variant?: string
    size?: string
    [key: string]: any // Accepts all other potential props.
  }): ReactElement => (
    <button {...props} disabled={loading}>
      {children}
    </button>
  ),
}))
// endregion

describe("Login Page Integration", (): void => {
  // region Test Setup
  beforeEach(() => {
    // Clears all mocks before each test to ensure test isolation.
    vi.clearAllMocks()
  })
  // endregion

  // region Test Cases
  it("should render the login form correctly", (): void => {
    render(<Login />)
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument()
    // Verify the presence of navigation links.
    expect(screen.getByRole("link", { name: "Forgot Password?" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sign Up" })).toBeInTheDocument()
  })

  it("should display validation errors for empty fields", async (): Promise<void> => {
    const user: UserEvent = userEvent.setup()
    render(<Login />)
    await user.click(screen.getByRole("button", { name: "Log In" }))
    // Expect validation messages to appear asynchronously.
    expect(await screen.findByText("Username is required")).toBeInTheDocument()
    // The exact error message for password validation from `passwordRules` is checked.
    expect(await screen.findByText(passwordRules().required as string)).toBeInTheDocument()
    // Confirm that login mutation was not attempted due to validation errors.
    expect(mockLoginMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("should call login mutation on valid submission", async (): Promise<void> => {
    const user: UserEvent = userEvent.setup()
    render(<Login />)
    await user.type(screen.getByPlaceholderText("Email"), "test@example.com")
    await user.type(screen.getByPlaceholderText("Password"), "ValidPassword123!")
    await user.click(screen.getByRole("button", { name: "Log In" }))
    // Wait for the asynchronous mutation to be called with correct data.
    await waitFor((): void => {
      expect(mockLoginMutation.mutateAsync).toHaveBeenCalledWith({
        formData: {
          username: "test@example.com",
          password: "ValidPassword123!",
        },
      })
    })
  })

  it("should disable button while submitting", async (): Promise<void> => {
    // Mock the async mutation to never resolve, simulating a long-running request.
    mockLoginMutation.mutateAsync.mockImplementation((): Promise<void> => new Promise((): void => {}))
    const user: UserEvent = userEvent.setup()
    render(<Login />)
    const submitButton: HTMLElement = screen.getByRole("button", {
      name: "Log In",
    })
    // Fill in valid credentials and submit the form.
    await user.type(screen.getByPlaceholderText("Email"), "test@example.com")
    await user.type(screen.getByPlaceholderText("Password"), "ValidPassword123!")
    await user.click(submitButton)
    // Wait for the button to become disabled, confirming the `loading` state is applied.
    await waitFor((): void => {
      expect(submitButton).toBeDisabled()
    })
  })
  // endregion
})
