/**
 * @file Custom React hook for managing authentication state and actions.
 * @description This hook centralizes user login, registration, logout, and fetching
 * the authenticated user's data using TanStack Query for efficient state management.
 */

import {
  type UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import {
  type ApiError,
  type LoginLoginRouterLoginAccessTokenData,
  type UserPublic,
  type UserRegister,
  loginLoginRouterLoginAccessToken,
  usersUsersRouterReadUserMe,
  usersUsersRouterRegisterUser,
} from "@/client"
import useCustomToast from "./useCustomToast"

/**
 * Checks if an access token exists in localStorage, indicating a logged-in state.
 *
 * @returns {boolean} True if an access token is found, false otherwise.
 */
const isLoggedIn = (): boolean => {
  return localStorage.getItem("access_token") !== null
}

/**
 * Interface representing the data returned by the useAuth hook.
 */
interface UseAuthReturn {
  /**
   * Mutation for user registration.
   * @type {UseMutationResult<UserPublic, ApiError, UserRegister>}
   */
  signUpMutation: UseMutationResult<UserPublic, ApiError, UserRegister>
  /**
   * Mutation for user login.
   * @type {UseMutationResult<void, ApiError, LoginLoginRouterLoginAccessTokenData["formData"]>}
   */
  loginMutation: UseMutationResult<
    void,
    ApiError,
    LoginLoginRouterLoginAccessTokenData["formData"]
  >
  /**
   * Function to log out the current user.
   *
   * @returns {void}
   */
  logout: () => void
  /**
   * The authenticated user's public data, or null if not logged in.
   * Undefined when loading.
   *
   * @type {UserPublic | null | undefined}
   */
  user: UserPublic | null | undefined
  /**
   * Indicates if the current user data is being loaded.
   *
   * @type {boolean}
   */
  isUserLoading: boolean
}

/**
 * A custom hook to manage authentication logic including
 * login, sign-up, logout, and fetching the current user.
 * It integrates with TanStack Query for data management and
 * local storage for token persistence.
 *
 * @returns {UseAuthReturn} An object containing authentication mutations,
 * logout function, current user data, and loading state.
 */
const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showApiErrorToast } = useCustomToast()

  /**
   * Fetches the current user's data.
   * The query is enabled only if an access token is present.
   */
  const { data: user, isLoading: isUserLoading } = useQuery<
    UserPublic | null,
    ApiError
  >({
    queryKey: ["currentUser"],
    queryFn: usersUsersRouterReadUserMe,
    enabled: isLoggedIn(),
  })

  /**
   * Mutation for user registration.
   * On success, navigates to the login page.
   * On error, displays a toast notification.
   */
  const signUpMutation = useMutation<UserPublic, ApiError, UserRegister>({
    /**
     * The mutation function to register a new user.
     *
     * @param {UserRegister} data The registration form data.
     * @returns {Promise<UserPublic>} The newly registered user's data.
     */
    mutationFn: (data: UserRegister): Promise<UserPublic> =>
      usersUsersRouterRegisterUser({ requestBody: data }),
    /**
     * Success handler for the signUp mutation.
     * Navigates the user to the login page upon successful registration.
     */
    onSuccess: (): void => {
      void navigate({ to: "/login" })
    },
    /**
     * Error handler for the signUp mutation.
     * Shows a toast notification with the error message.
     *
     * @param {ApiError} err The error object returned by the API.
     */
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
    /**
     * When the signUp mutation has finished (regardless of success or failure),
     * invalidates the "users" query to trigger a re-fetch of the user list.
     * This ensures that the newly registered user is added to the list.
     */
    onSettled: (): void => {
      void queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  /**
   * Helper function to log in a user and store the access token.
   * Invalidates the currentUser query to re-fetch user data.
   *
   * @param data The form data for login (username and password).
   * @returns {Promise<void>} A promise that resolves after the token is stored and query invalidated.
   */
  const loginWithToken = async (
    data: LoginLoginRouterLoginAccessTokenData["formData"],
  ): Promise<void> => {
    const response = await loginLoginRouterLoginAccessToken({
      formData: data,
    })
    localStorage.setItem("access_token", response.access_token)
    // After setting the token, invalidate the currentUser query so it reloads
    await queryClient.invalidateQueries({ queryKey: ["currentUser"] })
  }

  /**
   * Mutation for user login.
   * Uses the loginWithToken helper function.
   * On success, navigates to the home page.
   * On error, displays a toast notification.
   */
  const loginMutation = useMutation<
    void,
    ApiError,
    LoginLoginRouterLoginAccessTokenData["formData"]
  >({
    mutationFn: loginWithToken,
    /**
     * Success handler for the login mutation.
     * Navigates the user to the home page.
     */
    onSuccess: (): void => {
      void navigate({ to: "/" })
    },
    /**
     * Error handler for the login mutation.
     * Displays a toast notification with the error message.
     *
     * @param {ApiError} err - The error object returned by the API.
     * @returns {void}
     */
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  /**
   * Logs out the current user by removing the access token and resetting user data.
   * Navigates to the login page.
   */
  const logout = (): void => {
    localStorage.removeItem("access_token")
    // Reset user data to null to trigger immediate UI updates in dependent components.
    queryClient.setQueryData(["currentUser"], null)
    void navigate({ to: "/login" })
  }

  return {
    signUpMutation,
    loginMutation,
    logout,
    user,
    isUserLoading,
  }
}

export { isLoggedIn }
export default useAuth
