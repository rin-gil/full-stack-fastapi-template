/**
 * @file Custom React hook for managing authentication state and actions.
 * @description This hook centralizes user login, registration, logout, and fetching
 * the authenticated user's data using TanStack Query for efficient state management.
 * @module useAuth
 */

import {
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { type UseNavigateResult, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import {
  type ApiError,
  type LoginLoginRouterLoginAccessTokenData,
  type Token,
  type UserPublic,
  type UserRegister,
  loginLoginRouterLoginAccessToken,
  usersUsersRouterReadUserMe,
  usersUsersRouterRegisterUser,
} from "@/client"
import useCustomToast from "./useCustomToast"

// region Type Aliases

/**
 * Interface representing the data returned by the useAuth hook.
 */
type UseAuthReturn = {
  /**
   * Mutation for user registration.
   * @type {UseMutationResult<UserPublic, ApiError, UserRegister>}
   */
  signUpMutation: UseMutationResult<UserPublic, ApiError, UserRegister>
  /**
   * Mutation for user login.
   * @type {UseMutationResult<Token, ApiError, LoginLoginRouterLoginAccessTokenData>}
   */
  loginMutation: UseMutationResult<Token, ApiError, LoginLoginRouterLoginAccessTokenData>
  /**
   * Function to log out the current user.
   * @returns {void}
   */
  logout: () => void
  /**
   * The authenticated user's public data, or null if not logged in.
   * Undefined when loading.
   * @type {UserPublic | null | undefined}
   */
  user: UserPublic | null | undefined
  /**
   * Indicates if the current user data is being loaded.
   * @type {boolean}
   */
  isUserLoading: boolean
  /**
   * The current error message related to authentication, or null if no error.
   * @type {string | null}
   */
  error: string | null
  /**
   * Function to reset the authentication error state to null.
   * @returns {void}
   */
  resetError: () => void
}

// endregion

// region Main Code

/**
 * Checks if an access token exists in localStorage, indicating a logged-in state.
 * @returns {boolean} True if an access token is found, false otherwise.
 */
const isLoggedIn = (): boolean => {
  return localStorage.getItem("access_token") !== null
}

/**
 * A custom hook to manage authentication logic including
 * login, sign-up, logout, and fetching the current user.
 * It integrates with TanStack Query for data management and
 * local storage for token persistence.
 * @returns {UseAuthReturn} An object containing authentication mutations,
 * logout function, current user data, loading state, and error management.
 */
const useAuth = (): UseAuthReturn => {
  /**
   * Navigation function for routing.
   * @type {UseNavigateResult<string>}
   */
  const navigate: UseNavigateResult<string> = useNavigate()
  /**
   * Query client for managing TanStack Query state.
   * @type {QueryClient}
   */
  const queryClient: QueryClient = useQueryClient()
  /**
   * Custom toast hook for displaying API error notifications.
   */
  const { showApiErrorToast } = useCustomToast()
  /**
   * Local state for authentication error messages.
   */
  const [error, setError] = useState<string | null>(null)
  /**
   * Local state for tracking logged-in status, synced with localStorage.
   */
  const [isLoggedInState, setIsLoggedInState] = useState<boolean>(isLoggedIn())

  /**
   * Fetches the current user's data.
   * The query is enabled only if the user is logged in.
   * @type {UseQueryResult<UserPublic | null, ApiError>}
   */
  const { data: user, isLoading: isUserLoading }: UseQueryResult<UserPublic | null, ApiError> = useQuery<
    UserPublic | null,
    ApiError
  >({ queryKey: ["currentUser"], queryFn: usersUsersRouterReadUserMe, enabled: isLoggedInState })

  /**
   * Mutation for user registration.
   * @type {UseMutationResult<UserPublic, ApiError, UserRegister>}
   */
  const signUpMutation: UseMutationResult<UserPublic, ApiError, UserRegister> = useMutation<
    UserPublic,
    ApiError,
    UserRegister
  >({
    /**
     * The mutation function to register a new user.
     * @param {UserRegister} data - The registration form data.
     * @returns {Promise<UserPublic>} The newly registered user's data.
     */
    mutationFn: (data: UserRegister): Promise<UserPublic> => usersUsersRouterRegisterUser({ requestBody: data }),
    /**
     * Success handler for the signUp mutation.
     * Navigates the user to the login page upon successful registration.
     * @returns {void}
     */
    onSuccess: (): void => {
      void navigate({ to: "/login" })
    },
    /**
     * Error handler for the signUp mutation.
     * Shows a toast notification with the error message.
     * @param {ApiError} err - The error object returned by the API.
     * @returns {void}
     */
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
    /**
     * When the signUp mutation has finished (regardless of success or failure),
     * invalidates the "users" query to trigger a re-fetch of the user list.
     * This ensures that the newly registered user is added to the list.
     * @returns {void}
     */
    onSettled: (): void => {
      void queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  /**
   * Mutation for user login.
   * @type {UseMutationResult<Token, ApiError, LoginLoginRouterLoginAccessTokenData>}
   */
  const loginMutation: UseMutationResult<Token, ApiError, LoginLoginRouterLoginAccessTokenData> = useMutation<
    Token,
    ApiError,
    LoginLoginRouterLoginAccessTokenData
  >({
    /**
     * The mutation function to log in a user and obtain an access token.
     * @param {LoginLoginRouterLoginAccessTokenData} data - The form data for login (username and password).
     * @returns {Promise<Token>} The authentication token.
     */
    mutationFn: loginLoginRouterLoginAccessToken,
    /**
     * Success handler for the login mutation.
     * Stores the access token, updates logged-in state, invalidates the currentUser query,
     * and navigates the user to the home page.
     * @param {Token} data - The authentication token received.
     * @returns {void}
     */
    onSuccess: async (data: Token): Promise<void> => {
      localStorage.setItem("access_token", data.access_token)
      setIsLoggedInState(true)
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      void navigate({ to: "/" })
    },
    /**
     * Error handler for the login mutation.
     * Sets a local error state and displays a toast notification.
     * @param {ApiError} err - The error object returned by the API.
     * @returns {void}
     */
    onError: (err: ApiError): void => {
      const detail: string =
        err.body && typeof err.body === "object" && "detail" in err.body
          ? (err.body as { detail: string }).detail
          : "An unexpected error occurred."
      setError(detail)
      showApiErrorToast(err)
    },
  })

  /**
   * Logs out the current user by removing the access token and resetting user data.
   * Navigates to the login page.
   * @returns {void}
   */
  const logout = (): void => {
    localStorage.removeItem("access_token")
    setIsLoggedInState(false)
    queryClient.setQueryData(["currentUser"], null)
    void navigate({ to: "/login" })
  }

  return {
    signUpMutation,
    loginMutation,
    logout,
    user,
    isUserLoading,
    error,
    /**
     * Resets the local error state to null.
     * @returns {void}
     */
    resetError: (): void => setError(null),
  }
}

// endregion

// region Optional Declarations

export { isLoggedIn }
export default useAuth

// endregion
