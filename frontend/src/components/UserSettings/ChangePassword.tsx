/**
 * @file Defines the change password page component.
 * @description Provides the UI and logic for users to update their password with validation and API integration.
 * Handles form submission using react-hook-form and updates the password via react-query mutation.
 * @module ChangePassword
 */

import { Box, Button, Container, Heading, VStack } from "@chakra-ui/react"
import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import type { FC, ReactElement } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { FiLock } from "react-icons/fi"

import {
  type ApiError,
  type CancelablePromise,
  type Message,
  type UpdatePassword,
  usersUsersRouterUpdatePasswordMe,
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { confirmPasswordRules, passwordRules } from "@/utils"
import { PasswordInput } from "../ui/password-input"

// region Type Aliases

/**
 * Type alias for the password change form data.
 * @type {UpdatePasswordForm}
 */
type UpdatePasswordForm = UpdatePassword & { confirm_password: string }

/**
 * Type alias for the ChangePassword component.
 * @type {ChangePasswordComponent}
 */
type ChangePasswordComponent = FC

// endregion

// region Main Code

/**
 * Main component for the change password page.
 * @description Renders a form for updating the user's password with client-side validation and submits to the API.
 * @returns {ReactElement} The rendered change password component.
 */
const ChangePassword: ChangePasswordComponent = (): ReactElement => {
  const { showSuccessToast, showApiErrorToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<UpdatePasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  })

  /**
   * Mutation for handling password update.
   * @type {UseMutationResult<unknown, ApiError, UpdatePassword>}
   */
  const mutation: UseMutationResult<unknown, ApiError, UpdatePassword> = useMutation({
    mutationFn: (data: UpdatePassword): CancelablePromise<Message> =>
      usersUsersRouterUpdatePasswordMe({ requestBody: data }),
    onSuccess: (): void => {
      showSuccessToast("Password updated successfully.")
      reset()
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  /**
   * Handles the form submission event.
   * @param {UpdatePasswordForm} data - The validated form data.
   * @returns {void}
   */
  const onSubmit: SubmitHandler<UpdatePasswordForm> = (data: UpdatePasswordForm): void => {
    const { confirm_password, ...passwordData } = data
    mutation.mutate(passwordData)
  }

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        Change Password
      </Heading>
      <Box as="form" onSubmit={handleSubmit(onSubmit)}>
        <VStack gap={4} w={{ base: "100%", md: "sm" }}>
          <PasswordInput
            startElement={<FiLock />}
            {...register("current_password", passwordRules())}
            placeholder="Current Password"
            errors={errors}
          />
          <PasswordInput
            startElement={<FiLock />}
            {...register("new_password", passwordRules())}
            placeholder="New Password"
            errors={errors}
          />
          <PasswordInput
            startElement={<FiLock />}
            {...register("confirm_password", confirmPasswordRules(getValues))}
            placeholder="Confirm Password"
            errors={errors}
          />
        </VStack>
        <Button
          variant="solid"
          mt={4}
          type="submit"
          loading={isSubmitting || mutation.isPending}
          disabled={!isValid || mutation.isPending}
        >
          Save
        </Button>
      </Box>
    </Container>
  )
}

// endregion

// region Optional Declarations

ChangePassword.displayName = "ChangePassword"

// endregion

export default ChangePassword
