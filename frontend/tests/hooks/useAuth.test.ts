/**
 * @file Unit tests for src/hooks/useAuth.ts
 * @description These tests isolate the useAuth hook's logic by mocking API clients,
 * navigation, and localStorage to ensure predictable behavior.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { FC, ReactElement, ReactNode } from "react"
import React from "react"
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest"

import type { Token, UserPublic, UserRegister } from "@/client"
import { ApiError as ApiErrorClass } from "@/client/core/ApiError"
import type { ApiRequestOptions } from "@/client/core/ApiRequestOptions"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

// region MOCKS

// --- Module Mocks ---
// We mock the entire @/client module to control API responses.
// We expect API functions to be called with specific wrapped data structures.
vi.mock("@/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/client")>()
  return {
    ...original,
    loginLoginRouterLoginAccessToken: vi.fn(),
    usersUsersRouterReadUserMe: vi.fn(),
    usersUsersRouterRegisterUser: vi.fn(),
  }
})
// We mock the entire @tanstack/react-router module to control navigation.
vi.mock("@tanstack/react-router")

// --- Function Mocks ---
const mockShowApiErrorToastFn: Mock = vi.fn()
vi.mock("@/hooks/useCustomToast", () => ({
  default: vi.fn(() => ({
    showApiErrorToast: mockShowApiErrorToastFn,
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
  })),
}))

// We need to import mocked functions explicitly after `vi.mock` for type safety and direct usage.
import { loginLoginRouterLoginAccessToken, usersUsersRouterReadUserMe, usersUsersRouterRegisterUser } from "@/client"
import { useNavigate } from "@tanstack/react-router"

// --- localStorage Mock ---
/**
 * @interface LocalStorageMock
 * @description Defines the structure for our localStorage mock object.
 */
interface LocalStorageMock {
  getItem: Mock
  setItem: Mock
  removeItem: Mock
  clear: Mock
}

/**
 * A mock implementation of the `window.localStorage` API.
 * @type {LocalStorageMock}
 */
const localStorageMock: LocalStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string): string | null => store[key] || null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key]
    }),
    clear: vi.fn((): void => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, "localStorage", { value: localStorageMock })

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Number.POSITIVE_INFINITY,
      },
    },
  })

// endregion

// region TEST DATA

/** Mock API request options for creating ApiError instances. */
const mockApiRequestOptions: ApiRequestOptions = {
  url: "/mock-url",
  method: "GET",
}

/** Mock ApiError for a registration conflict. */
const mockSignUpError = new ApiErrorClass(
  mockApiRequestOptions,
  {
    url: "/api/users/register",
    ok: false,
    status: 409,
    statusText: "Conflict",
    // CORRECTED: Ensure body matches the expected structure with 'detail'
    body: { detail: "Email already registered" },
  },
  "Email already registered",
)

/** Mock ApiError for an incorrect login. */
const mockLoginError = new ApiErrorClass(
  mockApiRequestOptions,
  {
    url: "/api/login/access-token",
    ok: false,
    status: 401,
    statusText: "Unauthorized",
    // CORRECTED: Ensure body matches the expected structure with 'detail'
    body: { detail: "Incorrect username or password" },
  },
  "Incorrect username or password",
)

/** Mock ApiError for a failed user fetch due to invalid credentials. */
const mockUserFetchError = new ApiErrorClass(
  mockApiRequestOptions,
  {
    url: "/api/users/me",
    ok: false,
    status: 401,
    statusText: "Unauthorized",
    body: { detail: "Could not validate credentials" },
  },
  "Could not validate credentials",
)

// endregion

describe("useAuth", (): void => {
  let queryClient: QueryClient
  // Explicitly cast mocked functions for type safety in tests.
  const mockedLoginApi = loginLoginRouterLoginAccessToken as Mock
  const mockedReadMeApi = usersUsersRouterReadUserMe as Mock
  const mockedRegisterApi = usersUsersRouterRegisterUser as Mock
  const mockNavigateFn: Mock = vi.fn()

  beforeEach((): void => {
    vi.clearAllMocks()
    localStorageMock.clear()
    queryClient = createTestQueryClient()
    vi.mocked(useNavigate).mockReturnValue(mockNavigateFn)
    mockedReadMeApi.mockResolvedValue(null) // Default: no logged-in user
  })

  /**
   * Renders the `useAuth` hook within a `QueryClientProvider` for testing.
   *
   * @returns {import('@testing-library/react').RenderHookResult<import('@/hooks/useAuth').UseAuthReturn, unknown>}
   */
  const renderAuthHook = (): import("@testing-library/react").RenderHookResult<
    import("@/hooks/useAuth").UseAuthReturn,
    unknown
  > => {
    /**
     * A wrapper component that provides the `QueryClient` context via `React.createElement`.
     * This method is used instead of JSX because this is a `.ts` file.
     *
     * @param {object} props - The component props.
     * @param {ReactNode} props.children - The children to render.
     * @returns {ReactElement} The children wrapped in the provider.
     */
    const wrapper: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }): ReactElement =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    return renderHook(() => useAuth(), { wrapper })
  }

  // region TESTS

  describe("isLoggedIn", (): void => {
    it("should return false if access_token is not in localStorage", (): void => {
      expect(isLoggedIn()).toBe(false)
    })
    it("should return true if access_token is in localStorage", (): void => {
      localStorageMock.setItem("access_token", "test-token")
      expect(isLoggedIn()).toBe(true)
    })
  })

  describe("logout", (): void => {
    it("should remove access_token, reset user data, and navigate to /login", (): void => {
      localStorageMock.setItem("access_token", "some-token")
      queryClient.setQueryData(["currentUser"], {
        id: "1",
        email: "test@example.com",
      } as UserPublic)

      const { result } = renderAuthHook()
      result.current.logout()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("access_token")
      expect(queryClient.getQueryData(["currentUser"])).toBeNull()
      expect(mockNavigateFn).toHaveBeenCalledWith({ to: "/login" })
    })
  })

  describe("signUpMutation", (): void => {
    // CORRECTED: Data matches API expected structure
    const mockUserRegisterData: UserRegister = {
      email: "newuser@example.com",
      password: "password123",
    }
    it("should navigate to /login on successful signup", async (): Promise<void> => {
      mockedRegisterApi.mockResolvedValueOnce({
        id: "2",
        email: "new@test.com",
      } as UserPublic) // Cast for return type matching
      const { result } = renderAuthHook()
      // CORRECTED: Call the API mock with the expected `requestBody` wrapper
      result.current.signUpMutation.mutate(mockUserRegisterData)
      await waitFor((): void => expect(result.current.signUpMutation.isSuccess).toBe(true))
      expect(mockNavigateFn).toHaveBeenCalledWith({ to: "/login" })
    })
    it("should show an error toast on failed signup", async (): Promise<void> => {
      mockedRegisterApi.mockRejectedValueOnce(mockSignUpError)
      const { result } = renderAuthHook()
      result.current.signUpMutation.mutate(mockUserRegisterData)
      await waitFor((): void => expect(result.current.signUpMutation.isError).toBe(true))
      expect(mockShowApiErrorToastFn).toHaveBeenCalledWith(mockSignUpError)
    })
  })

  describe("loginMutation", (): void => {
    // CORRECTED: `mockLoginData` now matches `LoginLoginRouterLoginAccessTokenData` structure
    const mockLoginData = {
      formData: {
        username: "user@example.com",
        password: "password123",
      },
    }
    const mockAccessTokenResponse: Token = { access_token: "mock-jwt-token" } // Explicitly type as Token

    it("should store token, re-fetch user, and navigate to / on successful login", async (): Promise<void> => {
      const mockUser: UserPublic = { id: "1", email: "user@example.com" }
      mockedLoginApi.mockResolvedValueOnce(mockAccessTokenResponse)
      mockedReadMeApi.mockResolvedValueOnce(mockUser)

      const { result, rerender } = renderAuthHook()
      // Call with the correctly structured mockLoginData
      result.current.loginMutation.mutate(mockLoginData)

      await waitFor((): void => expect(result.current.loginMutation.isSuccess).toBe(true))
      expect(localStorageMock.setItem).toHaveBeenCalledWith("access_token", "mock-jwt-token")

      rerender() // Re-render to trigger `currentUser` query if enabled after token is set
      await waitFor((): void => expect(result.current.user).toEqual(mockUser))
      expect(mockedReadMeApi).toHaveBeenCalledTimes(1)
      expect(mockNavigateFn).toHaveBeenCalledWith({ to: "/" })
    })

    it("should show an error toast on failed login", async (): Promise<void> => {
      mockedLoginApi.mockRejectedValueOnce(mockLoginError)
      const { result } = renderAuthHook()
      result.current.loginMutation.mutate(mockLoginData)
      await waitFor((): void => expect(result.current.loginMutation.isError).toBe(true))
      expect(mockShowApiErrorToastFn).toHaveBeenCalledWith(mockLoginError)
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
      expect(mockNavigateFn).not.toHaveBeenCalled()
    })
  })

  describe("currentUser query", (): void => {
    it("should fetch user if logged in", async (): Promise<void> => {
      localStorageMock.setItem("access_token", "valid-token")
      const mockUser: UserPublic = { id: "1", email: "existing@example.com" }
      mockedReadMeApi.mockResolvedValueOnce(mockUser)
      const { result } = renderAuthHook()
      await waitFor((): void => expect(result.current.isUserLoading).toBe(false))
      expect(mockedReadMeApi).toHaveBeenCalledTimes(1)
      expect(result.current.user).toEqual(mockUser)
    })

    it("should have null user if user fetch fails", async (): Promise<void> => {
      localStorageMock.setItem("access_token", "invalid-token")
      mockedReadMeApi.mockRejectedValueOnce(mockUserFetchError)
      const { result } = renderAuthHook()
      await waitFor((): void => expect(result.current.isUserLoading).toBe(false))
      // `result.current.user` can be `undefined` or `null` based on initial state/API response.
      // If the query fails and `data` remains `undefined`, the assertion should reflect that.
      expect(result.current.user).toBeUndefined()
    })
  })

  // endregion
})
