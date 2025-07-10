/**
 * @file Defines the password reset page component.
 * @description Provides the UI and logic for resetting a user's password using a token from the URL.
 * Handles form validation, submission, and API interaction via react-query mutation.
 * @module ResetPassword
 */

import { Container, Heading, Text } from "@chakra-ui/react"
import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import {
  Link as RouterLink,
  type UseNavigateResult,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router"
import type { FC, ReactElement } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { FiLock } from "react-icons/fi"

import { type ApiError, type NewPassword, loginLoginRouterResetPassword } from "@/client"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { confirmPasswordRules, passwordRules } from "@/utils"

// region Type Aliases

/**
 * Type alias for the password reset form data.
 * @type {NewPasswordForm}
 */
type NewPasswordForm = NewPassword & { confirm_password: string }

/**
 * Type alias for the ResetPassword component.
 * @type {ResetPasswordComponent}
 */
type ResetPasswordComponent = FC

// endregion

// region Main Code

/**
 * Main component for the password reset page.
 * @description Renders a form for resetting a password with client-side validation and submits to the API.
 * @returns {ReactElement} The rendered password reset component.
 */
const ResetPassword: ResetPasswordComponent = (): ReactElement => {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<NewPasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { new_password: "", confirm_password: "" },
  })

  const { showSuccessToast, showApiErrorToast } = useCustomToast()
  const navigate: UseNavigateResult<string> = useNavigate()
  const token: string | null = new URLSearchParams(window.location.search).get("token")

  /**
   * Mutation for handling password reset.
   * @type {UseMutationResult<void, ApiError, { new_password: string; token: string }>}
   */
  const mutation: UseMutationResult<void, ApiError, { new_password: string; token: string }> = useMutation({
    mutationFn: async (data: { new_password: string; token: string }): Promise<any> => {
      return loginLoginRouterResetPassword({ requestBody: data })
    },
    onSuccess: (): void => {
      showSuccessToast("Password updated successfully.")
      reset()
      void navigate({ to: "/login" })
    },
    onError: (err: ApiError): void => {
      void showApiErrorToast(err)
    },
  })

  /**
   * Handles the form submission event.
   * @param {NewPasswordForm} data - The validated form data.
   * @returns {void}
   */
  const onSubmit: SubmitHandler<NewPasswordForm> = (data: NewPasswordForm): void => {
    if (!token) {
      void showApiErrorToast({
        message: "No password reset token found in URL.",
        status: 400,
        url: window.location.href,
        statusText: "Bad Request",
        body: { detail: "No password reset token found in URL." },
        request: { method: "POST", url: window.location.href },
        name: "ApiError",
      })
      return
    }
    const { confirm_password, ...newPasswordData } = data
    mutation.mutate({ ...newPasswordData, token })
  }

  return (
    <Container
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      h="100vh"
      maxW="sm"
      alignItems="stretch"
      justifyContent="center"
      gap={4}
      centerContent
    >
      <Heading size="xl" color="ui.main" textAlign="center" mb={2}>
        Reset Password
      </Heading>
      <Text textAlign="center">Please enter your new password and confirm it to reset your password.</Text>
      <PasswordInput
        startElement={<FiLock />}
        errors={errors}
        {...register("new_password", passwordRules())}
        placeholder="New Password"
      />
      <PasswordInput
        startElement={<FiLock />}
        errors={errors}
        {...register("confirm_password", confirmPasswordRules(getValues))}
        placeholder="Confirm Password"
      />
      <Button variant="solid" type="submit" loading={mutation.isPending}>
        Reset Password
      </Button>
      <Text textAlign="center">
        <RouterLink to="/login" className="main-link">
          Back to Log In
        </RouterLink>
      </Text>
    </Container>
  )
}

/**
 * Route definition for the password reset page.
 * @description Checks if the user is authenticated before loading. Redirects to home if authenticated.
 * @returns {void} Nothing, throws redirect if authenticated.
 * @throws {redirect} Throws a redirect to "/" with current path if user is logged in.
 */
export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  beforeLoad: (): void => {
    if (isLoggedIn()) {
      throw redirect({ to: "/", search: { from: window.location.pathname } })
    }
  },
})

// endregion

// region Optional Declarations

ResetPassword.displayName = "ResetPassword"

// endregion
