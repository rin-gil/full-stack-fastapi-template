/**
 * @file Unit tests for the `useAuth` custom React hook.
 * @description These tests use mocking to isolate the hook's logic
 * from its child dependencies, preventing environment-specific errors (CSS, providers).
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import * as React from "react"
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest"

import type { UserPublic, UserRegister } from "@/client"
import { ApiError as ApiErrorClass } from "@/client/core/ApiError"
import type { ApiRequestOptions } from "@/client/core/ApiRequestOptions"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

// --- Mocks ---
vi.mock("@/client")
vi.mock("@tanstack/react-router")

const mockShowApiErrorToastFn: Mock = vi.fn()
const mockShowSuccessToastFn: Mock = vi.fn()
const mockShowErrorToastFn: Mock = vi.fn()

vi.mock("@/hooks/useCustomToast", () => ({
  default: vi.fn(() => ({
    showApiErrorToast: mockShowApiErrorToastFn,
    showSuccessToast: mockShowSuccessToastFn,
    showErrorToast: mockShowErrorToastFn,
  })),
}))

import {
  loginLoginRouterLoginAccessToken,
  usersUsersRouterReadUserMe,
  usersUsersRouterRegisterUser,
} from "@/client"
import { useNavigate } from "@tanstack/react-router"

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, "localStorage", { value: localStorageMock })

/**
 * Creates a QueryClient instance configured for testing purposes.
 *
 * This QueryClient is set up with the following default options:
 * - Queries will not retry on failure.
 * - Queries will not be garbage collected automatically
 *   (infinity garbage collection time).
 *
 * @returns {QueryClient} A QueryClient instance with testing configurations.
 */
const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Number.POSITIVE_INFINITY,
      },
    },
  })

// --- Test Data Mocks ---
const mockApiRequestOptions: ApiRequestOptions = {
  url: "/mock-url",
  method: "GET",
}

const mockSignUpError = new ApiErrorClass(
  mockApiRequestOptions,
  {
    url: "/api/users/register",
    ok: false,
    status: 409,
    statusText: "Conflict",
    body: { detail: "Email already registered" },
  },
  "Email already registered",
)
const mockLoginError = new ApiErrorClass(
  mockApiRequestOptions,
  {
    url: "/api/login/access-token",
    ok: false,
    status: 401,
    statusText: "Unauthorized",
    body: { detail: "Incorrect username or password" },
  },
  "Incorrect username or password",
)
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

// --- Tests ---
describe("useAuth", (): void => {
  let queryClient: QueryClient
  const mockedLoginApi = loginLoginRouterLoginAccessToken as Mock
  const mockedReadMeApi = usersUsersRouterReadUserMe as Mock
  const mockedRegisterApi = usersUsersRouterRegisterUser as Mock
  const mockNavigateFn: Mock = vi.fn()
  beforeEach((): void => {
    vi.clearAllMocks()
    localStorageMock.clear()
    queryClient = createTestQueryClient()
    vi.mocked(useNavigate).mockReturnValue(mockNavigateFn)
    mockedReadMeApi.mockResolvedValue(null)
  })

  /**
   * A utility function to render the `useAuth` hook with a
   * {@link https://tanstack.com/query/v4/docs/providers?from=reactQueryV3&to=reactQueryV4 | QueryClient}
   * wrapper.
   *
   * This is used to mock the `useAuth` hook in tests.
   *
   * @returns A render hook that renders the `useAuth` hook with a
   * `QueryClientProvider` wrapper.
   */
  const renderAuthHook = () => {
    /**
     * A React component that wraps the `useAuth` hook with a
     * {@link https://tanstack.com/query/v4/docs/providers?from=reactQueryV3&to=reactQueryV4 | QueryClientProvider}
     * component.
     *
     * This is used to mock the `useAuth` hook in tests.
     */
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      )
    return renderHook(() => useAuth(), { wrapper })
  }

  // Restore all tests and ensure they pass
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
    const mockUserRegisterData: UserRegister = {
      email: "newuser@example.com",
      password: "password123",
    }
    it("should navigate to /login on successful signup", async (): Promise<void> => {
      mockedRegisterApi.mockResolvedValueOnce({
        id: "2",
        email: "new@test.com",
      })
      const { result } = renderAuthHook()
      result.current.signUpMutation.mutate(mockUserRegisterData)
      await waitFor((): void =>
        expect(result.current.signUpMutation.isSuccess).toBe(true),
      )
      expect(mockNavigateFn).toHaveBeenCalledWith({ to: "/login" })
    })
    it("should show an error toast on failed signup", async (): Promise<void> => {
      mockedRegisterApi.mockRejectedValueOnce(mockSignUpError)
      const { result } = renderAuthHook()
      result.current.signUpMutation.mutate(mockUserRegisterData)
      await waitFor((): void =>
        expect(result.current.signUpMutation.isError).toBe(true),
      )
      expect(mockShowApiErrorToastFn).toHaveBeenCalledWith(mockSignUpError)
    })
  })

  describe("loginMutation", (): void => {
    const mockLoginData = {
      username: "user@example.com",
      password: "password123",
    }
    const mockAccessTokenResponse = { access_token: "mock-jwt-token" }

    it("should store token, re-fetch user, and navigate to / on successful login", async (): Promise<void> => {
      const mockUser: UserPublic = { id: "1", email: "user@example.com" }
      mockedLoginApi.mockResolvedValueOnce(mockAccessTokenResponse)
      mockedReadMeApi.mockResolvedValueOnce(mockUser)
      const { result, rerender } = renderAuthHook()
      result.current.loginMutation.mutate(mockLoginData)
      await waitFor((): void =>
        expect(result.current.loginMutation.isSuccess).toBe(true),
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "access_token",
        "mock-jwt-token",
      )
      rerender()
      await waitFor((): void => expect(result.current.user).toEqual(mockUser))
      expect(mockedReadMeApi).toHaveBeenCalledTimes(1)
      expect(mockNavigateFn).toHaveBeenCalledWith({ to: "/" })
    })

    it("should show an error toast on failed login", async (): Promise<void> => {
      mockedLoginApi.mockRejectedValueOnce(mockLoginError)
      const { result } = renderAuthHook()
      result.current.loginMutation.mutate(mockLoginData)
      await waitFor((): void =>
        expect(result.current.loginMutation.isError).toBe(true),
      )
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
      await waitFor((): void =>
        expect(result.current.isUserLoading).toBe(false),
      )
      expect(mockedReadMeApi).toHaveBeenCalledTimes(1)
      expect(result.current.user).toEqual(mockUser)
    })

    it("should have null user if user fetch fails", async (): Promise<void> => {
      localStorageMock.setItem("access_token", "invalid-token")
      mockedReadMeApi.mockRejectedValueOnce(mockUserFetchError)
      const { result } = renderAuthHook()
      await waitFor((): void =>
        expect(result.current.isUserLoading).toBe(false),
      )
      expect(mockedReadMeApi).toHaveBeenCalledTimes(1)
      expect(result.current.user).toBeUndefined()
    })
  })
})
