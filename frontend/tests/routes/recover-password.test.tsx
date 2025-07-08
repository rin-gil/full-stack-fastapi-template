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

import { loginLoginRouterRecoverPassword } from "@/client"
import { RecoverPassword } from "@/routes/recover-password"
import { emailPattern } from "@/utils"

// region Mocks

const mockShowApiErrorToast: Mock = vi.fn()
vi.mock("@/hooks/useCustomToast", () => ({
  default: () => ({
    showApiErrorToast: mockShowApiErrorToast,
  }),
}))

vi.mock("@/hooks/useAuth", () => ({
  isLoggedIn: () => false,
}))

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>()
  return {
    ...original,
    createFileRoute: () => (options: any) => ({ ...options }),
    Link: ({ children, to, ...rest }: { children: ReactNode; to: string; [key: string]: any }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  }
})

vi.mock("react-icons/fi", () => ({
  FiMail: (): ReactElement => <span>mail-icon</span>,
}))

vi.mock("@/client")
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, loading, ...rest }: { children: ReactNode; loading?: boolean; [key: string]: any }) => (
    <button disabled={loading} {...rest}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/field", () => ({
  Field: ({
    children,
    errorText,
    invalid,
    ...rest
  }: {
    children: ReactNode
    errorText?: string
    invalid?: boolean
    [key: string]: any
  }) => (
    <div {...rest}>
      {children}
      {errorText && <span>{errorText}</span>}
    </div>
  ),
}))

vi.mock("@/components/ui/input-group", () => ({
  InputGroup: ({ children, startElement }: { children: ReactNode; startElement?: ReactNode }) => (
    <div>
      {startElement}
      {children}
    </div>
  ),
}))

vi.mock("@chakra-ui/react", () => ({
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
  }) => <form {...rest}>{children}</form>,
  Heading: ({
    children,
    size,
    color,
    textAlign,
    mb,
    ...rest
  }: {
    children: ReactNode
    [key: string]: any
  }) => <h1 {...rest}>{children}</h1>,
  // ИЗМЕНЕНИЕ: Деструктурируем `textAlign` и `mt`, чтобы они не попадали в DOM.
  Text: ({
    children,
    textAlign,
    mt,
    ...rest
  }: {
    children: ReactNode
    [key: string]: any
  }) => <p {...rest}>{children}</p>,
  Input: (props: any) => <input {...props} />,
}))

vi.mock("react-hook-form")
vi.mock("@tanstack/react-query")

// endregion

describe("RecoverPassword Component", () => {
  let user: UserEvent
  let mockMutationResult: any

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()

    mockMutationResult = {
      isPending: false,
      isSuccess: false,
      mutate: vi.fn(),
    }

    vi.mocked(useForm).mockReturnValue({
      register: vi.fn(),
      handleSubmit: (fn: any) => (e: any) => {
        if (e) e.preventDefault()
        fn({ email: "test@example.com" })
      },
      formState: { errors: {} },
    } as any)

    vi.mocked(useMutation).mockImplementation((options: any) => {
      mockMutationResult.mutate = vi.fn(async (data) => {
        try {
          const result = await options.mutationFn(data)
          if (options.onSuccess) options.onSuccess(result, data, undefined)
        } catch (error) {
          if (options.onError) options.onError(error, data, undefined)
        }
      })
      return mockMutationResult
    })
  })

  it("should render the initial form correctly", () => {
    render(<RecoverPassword />)
    expect(screen.getByRole("heading", { name: "Password Recovery" })).toBeInTheDocument()
    expect(screen.getByText("A password recovery email will be sent to the registered account.")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back to Log In" })).toBeInTheDocument()
  })

  it("should display validation error if email is invalid", async () => {
    vi.mocked(useForm).mockReturnValue({
      register: vi.fn(),
      handleSubmit: (fn: any) => fn,
      formState: { errors: { email: { message: emailPattern.message } } },
    } as any)

    render(<RecoverPassword />)
    expect(screen.getByText(emailPattern.message)).toBeInTheDocument()
  })

  it("should call the mutation on valid form submission", async () => {
    render(<RecoverPassword />)
    await user.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(mockMutationResult.mutate).toHaveBeenCalledWith({ email: "test@example.com" })
    })
  })

  it("should disable the button and input when pending", () => {
    mockMutationResult.isPending = true
    render(<RecoverPassword />)

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
    expect(screen.getByPlaceholderText("Email")).toBeDisabled()
  })

  it("should show success view when submission is successful", () => {
    mockMutationResult.isSuccess = true
    render(<RecoverPassword />)

    expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument()
  })

  it("should show success view even when API returns a 404", async () => {
    vi.mocked(loginLoginRouterRecoverPassword).mockRejectedValue({ status: 404 })

    render(<RecoverPassword />)

    await user.click(screen.getByRole("button", { name: "Continue" }))

    mockMutationResult.isSuccess = true
    render(<RecoverPassword />)

    expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument()
    expect(mockShowApiErrorToast).not.toHaveBeenCalled()
  })

  it("should show an API error toast for non-404 errors", async () => {
    const serverError = { status: 500, body: { detail: "Server error" } }
    vi.mocked(loginLoginRouterRecoverPassword).mockRejectedValue(serverError)

    render(<RecoverPassword />)

    await user.click(screen.getByRole("button", { name: "Continue" }))

    await waitFor(() => {
      expect(mockShowApiErrorToast).toHaveBeenCalledWith(serverError)
    })
  })
})
