/**
 * @file Defines the password recovery page component.
 * @description Provides the UI and logic for password recovery with a form to enter an email address.
 * Prevents user enumeration by displaying the same success message regardless of email existence.
 * @module RecoverPassword
 */

import { Container, Heading, Input, Text } from "@chakra-ui/react"
import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import { Link as RouterLink, createFileRoute, redirect } from "@tanstack/react-router"
import type React from "react"
import type { FC, ReactElement } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiMail } from "react-icons/fi"

import { type ApiError, loginLoginRouterRecoverPassword } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern } from "@/utils"

// region Type Aliases

/**
 * Type alias for the password recovery form data.
 * @type {FormData}
 */
type FormData = { email: string }

/**
 * Type alias for the RecoverPassword component.
 * @type {RecoverPasswordComponent}
 */
type RecoverPasswordComponent = FC

// endregion

// region Main Code

/**
 * Main component for the password recovery page.
 * @description Renders a form for password recovery. Displays a success message upon submission.
 * @returns {ReactElement} The rendered password recovery component.
 */
const RecoverPassword: RecoverPasswordComponent = (): ReactElement => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()
  const { showApiErrorToast } = useCustomToast()

  /**
   * Asynchronously triggers the password recovery process.
   * @param {FormData} data - The form data containing the user's email.
   * @returns {Promise<void>} Resolves when the operation is complete.
   * @throws {ApiError} Throws an error if the API returns a status other than 404.
   */
  const recoverPassword: (data: FormData) => Promise<void> = async (data: FormData): Promise<void> => {
    try {
      await loginLoginRouterRecoverPassword({ email: data.email })
    } catch (err) {
      if ((err as ApiError).status === 404) {
        return
      }
      throw err
    }
  }

  /**
   * Mutation for handling password recovery.
   * @type {UseMutationResult<void, ApiError, FormData>}
   */
  const mutation: UseMutationResult<void, ApiError, FormData> = useMutation({
    mutationFn: recoverPassword,
    onSuccess: undefined,
    /**
     * Handles errors during the password recovery mutation.
     * @param {ApiError} err - The error object returned by the API.
     * @returns {void}
     */
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  /**
   * Handles the form submission event.
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
                autoComplete="on"
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

/**
 * Route definition for the password recovery page.
 * @description Checks if the user is authenticated before loading. Redirects to home if authenticated.
 * @returns {void} Nothing, throws redirect if authenticated.
 * @throws {redirect} Throws a redirect to "/" with current path if user is logged in.
 */
export const Route = createFileRoute("/recover-password")({
  component: RecoverPassword,
  beforeLoad: (): void => {
    if (isLoggedIn()) {
      throw redirect({ to: "/", search: { from: window.location.pathname } })
    }
  },
})

// endregion

// region Optional Declarations

RecoverPassword.displayName = "RecoverPasswordPage"

// endregion
