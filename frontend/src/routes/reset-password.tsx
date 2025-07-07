/**
 * @file Defines the 'ResetPassword' page component.
 * @description This file contains the component for the password reset functionality.
 * It allows users with a valid token (from a URL) to set a new password. The component
 * handles form validation, submission, and interaction with the backend API via a react-query mutation.
 */

import { Container, Heading, Text } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router"
import type { JSX } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { FiLock } from "react-icons/fi"

import {
  type ApiError,
  type NewPassword,
  loginLoginRouterResetPassword,
} from "@/client"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { confirmPasswordRules, passwordRules } from "@/utils"

/**
 * @interface NewPasswordForm
 * @description Extends the NewPassword API type with a `confirm_password` field for client-side validation.
 * @property {string} confirm_password - The field for confirming the new password.
 */
interface NewPasswordForm extends NewPassword {
  confirm_password: string
}

/**
 * @constant Route
 * @description Defines the route for the '/reset-password' path.
 * It specifies the ResetPassword component and includes a `beforeLoad` guard.
 */
export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  /**
   * @function beforeLoad
   * @description An asynchronous function that runs before the route loads.
   * It redirects logged-in users to the home page, preventing them from accessing the password reset page.
   * @returns {Promise<void>} A promise that resolves if the user is not logged in.
   * @throws {Error} A redirect error if the user is authenticated.
   */
  beforeLoad: async (): Promise<void> => {
    if (isLoggedIn()) {
      throw redirect({ to: "/" })
    }
  },
})

/**
 * @function ResetPassword
 * @description A page component that renders the password reset form. It handles user input
 * for a new password and its confirmation, validates the input, and submits the data to the API.
 * @returns {JSX.Element} The rendered password reset page.
 */
function ResetPassword(): JSX.Element {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<NewPasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  })

  const { showSuccessToast, showApiErrorToast } = useCustomToast()
  const navigate = useNavigate()

  // Extract the token from the URL once per component render.
  const token: string | null = new URLSearchParams(window.location.search).get(
    "token",
  )

  const mutation = useMutation({
    /**
     * @function mutationFn
     * @description The async function that performs the API call to reset the password.
     * @param {{ new_password: string; token: string }} data - The data required for the API call.
     * @returns {Promise<any>} The result of the API call.
     */
    mutationFn: async (data: {
      new_password: string
      token: string
    }): Promise<any> => {
      return loginLoginRouterResetPassword({ requestBody: data })
    },
    onSuccess: (): void => {
      showSuccessToast("Password updated successfully.")
      reset()
      void navigate({ to: "/login" })
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  /**
   * @function onSubmit
   * @description Handles the form submission event. It validates the token's existence,
   * prepares the data, and triggers the password reset mutation.
   * @param {NewPasswordForm} data - The validated form data.
   */
  const onSubmit: SubmitHandler<NewPasswordForm> = (
    data: NewPasswordForm,
  ): void => {
    if (!token) {
      showApiErrorToast({
        // Provide an object that looks like an ApiError for consistent toast display.
        body: { detail: "No password reset token found in URL." },
        status: 400,
        statusText: "Bad Request",
        url: window.location.href,
      })
      return
    }
    // Exclude `confirm_password` as it's only for client-side validation.
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
      <Text textAlign="center">
        Please enter your new password and confirm it to reset your password.
      </Text>
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

ResetPassword.displayName = "ResetPassword"
