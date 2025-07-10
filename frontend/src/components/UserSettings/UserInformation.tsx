/**
 * @file Defines the user information page component.
 * @description Provides the UI and logic for displaying and editing the current user's information (full name and email).
 * Handles form submission with validation and updates user data via API.
 * @module UserInformation
 */

import { Box, Button, Container, Flex, Heading, Input, Text } from "@chakra-ui/react"
import { type QueryClient, type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { FC, ReactElement } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"

import {
  type ApiError,
  type CancelablePromise,
  type UserPublic,
  type UserUpdateMe,
  usersUsersRouterUpdateUserMe,
} from "@/client"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern, namePattern } from "@/utils"
import { Field } from "../ui/field"

// region Type Aliases

/**
 * Type alias for the user information form data.
 * @type {UserInformationForm}
 */
type UserInformationForm = UserPublic

/**
 * Type alias for the UserInformation component.
 * @type {UserInformationComponent}
 */
type UserInformationComponent = FC

// endregion

// region Main Code

/**
 * Main component for the user information page.
 * @description Renders a form for viewing or editing the user's full name and email with client-side validation.
 * Toggles between view and edit modes, submits updates via API, and updates query cache.
 * @returns {ReactElement} The rendered user information component.
 */
const UserInformation: UserInformationComponent = (): ReactElement => {
  const queryClient: QueryClient = useQueryClient()
  const { showSuccessToast, showApiErrorToast } = useCustomToast()
  const { user: currentUser } = useAuth()
  const [editMode, setEditMode] = useState<boolean>(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<UserInformationForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { full_name: currentUser?.full_name, email: currentUser?.email },
  })

  /**
   * Mutation for handling user information update.
   * @type {UseMutationResult<UserPublic, ApiError, UserUpdateMe>}
   */
  const mutation: UseMutationResult<UserPublic, ApiError, UserUpdateMe> = useMutation({
    mutationFn: (data: UserUpdateMe): CancelablePromise<UserPublic> =>
      usersUsersRouterUpdateUserMe({ requestBody: data }),
    onSuccess: (updatedUser: UserPublic): void => {
      showSuccessToast("User updated successfully.")
      queryClient.setQueryData(["currentUser"], updatedUser)
      void queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      setEditMode(false)
      reset(updatedUser)
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  /**
   * Handles the form submission event.
   * @param {UserInformationForm} data - The validated form data.
   * @returns {void}
   */
  const onSubmit: SubmitHandler<UserInformationForm> = (data: UserInformationForm): void => {
    mutation.mutate(data)
  }

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        User Information
      </Heading>
      <Box w={{ sm: "full", md: "sm" }} as="form" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Full name" invalid={!!errors.full_name} errorText={errors.full_name?.message}>
          {editMode ? (
            <Input
              {...register("full_name", {
                required: "Full name is required",
                pattern: namePattern,
              })}
              type="text"
              size="md"
            />
          ) : (
            <Text fontSize="md" py={2} color={!currentUser?.full_name ? "gray" : "inherit"} truncate maxW="sm">
              {currentUser?.full_name || "N/A"}
            </Text>
          )}
        </Field>
        <Field mt={4} label="Email" invalid={!!errors.email} errorText={errors.email?.message}>
          {editMode ? (
            <Input
              {...register("email", {
                required: "Email is required",
                pattern: emailPattern,
              })}
              type="email"
              size="md"
            />
          ) : (
            <Text fontSize="md" py={2} truncate maxW="sm">
              {currentUser?.email}
            </Text>
          )}
        </Field>
        <Flex mt={4} gap={3}>
          {editMode ? (
            <>
              <Button
                variant="solid"
                type="submit"
                loading={isSubmitting || mutation.isPending}
                disabled={!isDirty || mutation.isPending}
              >
                Save
              </Button>
              <Button
                variant="subtle"
                colorPalette="gray"
                type="button"
                onClick={(): void => {
                  reset({ full_name: "", email: "" })
                  setEditMode(false)
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="solid" type="button" onClick={(): void => setEditMode(true)}>
              Edit
            </Button>
          )}
        </Flex>
      </Box>
    </Container>
  )
}

// endregion

// region Optional Declarations

UserInformation.displayName = "UserInformation"

// endregion

export default UserInformation
