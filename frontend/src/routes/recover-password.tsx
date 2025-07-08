/**
 * @file Provides the UI and logic for the password recovery page.
 * @description This module defines the component for the /recover-password route.
 * It includes a form for users to enter their email address to receive a
 * recovery link. To prevent user enumeration attacks, the component displays
 * the same success message whether the email exists in the system or not,
 * relying on the backend to handle this logic securely.
 */

import { Container, Heading, Input, Text } from "@chakra-ui/react"
// biome-ignore lint/style/useImportType: <explanation>
import { UseMutationResult, useMutation } from "@tanstack/react-query"
import { Link as RouterLink, createFileRoute, redirect } from "@tanstack/react-router"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { FiMail } from "react-icons/fi"

import { type ApiError, loginLoginRouterRecoverPassword } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern } from "@/utils"
// biome-ignore lint/style/useImportType: <explanation>
import React, { ReactElement } from "react"

/**
 * Defines the structure for the password recovery form data.
 */
interface FormData {
  /** The user's email address. */
  email: string
}

/**
 * Defines the route for the `/recover-password` path.
 * @description It associates the path with the `RecoverPassword` component and includes
 * a `beforeLoad` guard that redirects authenticated users to the homepage,
 * preventing them from accessing the recovery page unnecessarily.
 */
export const Route = createFileRoute("/recover-password")({
  component: RecoverPassword,
  /**
   * Prevents authenticated users from accessing the password recovery page.
   * @description If the user is already logged in, this `beforeLoad` function
   * redirects them to the homepage to prevent unnecessary access to the
   * recovery page.
   */
  beforeLoad: async (): Promise<void> => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

/**
 * The main component for the password recovery page.
 * @description Renders a form for password recovery. Upon successful submission (or
 * if the user does not exist, to prevent enumeration), it displays a success
 * message and a link back to the login page.
 * @returns {ReactElement} The rendered password recovery component.
 */
export function RecoverPassword(): ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()
  const { showApiErrorToast } = useCustomToast()

  /**
   * Asynchronously triggers the password recovery process.
   * @description This function calls the API to send a recovery email. It includes
   * a critical security measure: it catches 404 errors from the API and returns
   * silently, preventing user enumeration. Other errors are re-thrown to be
   * handled by `useMutation`'s `onError` callback.
   * @param {FormData} data - The form data containing the user's email.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   * @throws {ApiError} Throws an error if the API returns a status other than 404.
   */
  const recoverPassword: (data: FormData) => Promise<void> = async (data: FormData): Promise<void> => {
    try {
      await loginLoginRouterRecoverPassword({
        email: data.email,
      })
    } catch (err) {
      if ((err as ApiError).status === 404) {
        return
      }
      throw err
    }
  }

  const mutation: UseMutationResult<void, ApiError, FormData> = useMutation<void, ApiError, FormData>({
    mutationFn: recoverPassword,
    onSuccess: undefined,
    /**
     * Handles errors during the password recovery mutation.
     * @description This callback is triggered when the API request for password recovery fails.
     * It displays a toast notification with the error message extracted from the API error.
     * @param {ApiError} err - The error object returned by the API.
     * @returns {void}
     */
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  /**
   * Handles the form submission event.
   * @description This function is called by `react-hook-form`'s `handleSubmit`
   * with the validated form data. It then triggers the mutation.
   * @param {FormData} data - The validated form data.
   * @returns {void}
   */
  const onSubmit: SubmitHandler<FormData> = (data: FormData): void => {
    void mutation.mutate(data)
  }

  return (
    <Container
      as="form"
      onSubmit={!mutation.isPending ? handleSubmit(onSubmit) : (e: React.FormEvent): void => e.preventDefault()}
      h="100vh"
      maxW="sm"
      alignItems="stretch"
      justifyContent="center"
      gap={4}
      centerContent
    >
      {mutation.isSuccess ? (
        <>
          <Heading size="xl" color="ui.main" textAlign="center" mb={2}>
            Check your email
          </Heading>
          <Text textAlign="center">
            If an account with that email address exists, we have sent a link to reset your password.
          </Text>
          <Text textAlign="center" mt={4}>
            <RouterLink to="/login" className="main-link">
              Back to Log In
            </RouterLink>
          </Text>
        </>
      ) : (
        <>
          <Heading size="xl" color="ui.main" textAlign="center" mb={2}>
            Password Recovery
          </Heading>
          <Text textAlign="center">A password recovery email will be sent to the registered account.</Text>
          <Field invalid={!!errors.email} errorText={errors.email?.message}>
            <InputGroup w="100%" startElement={<FiMail />}>
              <Input
                id="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                placeholder="Email"
                type="email"
                disabled={mutation.isPending}
              />
            </InputGroup>
          </Field>
          <Button variant="solid" type="submit" loading={mutation.isPending}>
            Continue
          </Button>
          <Text textAlign="center">
            <RouterLink to="/login" className="main-link">
              Back to Log In
            </RouterLink>
          </Text>
        </>
      )}
    </Container>
  )
}

RecoverPassword.displayName = "RecoverPasswordPage"
