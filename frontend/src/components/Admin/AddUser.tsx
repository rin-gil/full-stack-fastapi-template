/**
 * @file Defines the AddUser dialog component.
 * @description Provides a form for creating a new user with validation and API mutation handling.
 * @module AddUser
 */

"use client"

import {
  type ApiError,
  type CancelablePromise,
  type UserCreate,
  type UserPublic,
  usersUsersRouterCreateUser,
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { confirmPasswordRules, emailPattern, namePattern, passwordRules } from "@/utils"
import { DialogActionTrigger, DialogTitle, Input, Text, VStack } from "@chakra-ui/react"
// @ts-ignore
import type { CheckedChangeDetails } from "@chakra-ui/react/dist/types/components/checkbox/namespace"
// @ts-ignore
import type { OpenChangeDetails } from "@chakra-ui/react/dist/types/components/dialog/namespace"
import { type QueryClient, type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import type React from "react"
import type { FC } from "react"
import { useState } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { FaPlus } from "react-icons/fa"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

// region Type Aliases

/**
 * Form data interface for user creation, extending UserCreate with confirm_password.
 * @interface UserCreateForm
 */
interface UserCreateForm extends UserCreate {
  confirm_password: string
}

/**
 * Type alias for the AddUser component.
 * @type {AddUserComponent}
 */
type AddUserComponent = FC

/**
 * Type alias for the mutation result of creating a user.
 * @type {UserCreateMutation}
 */
type UserCreateMutation = UseMutationResult<UserPublic, ApiError, UserCreate>

// endregion

// region Main Code

/**
 * Default values for the user creation form.
 * @constant {UserCreateForm}
 */
const defaultValues: UserCreateForm = {
  email: "",
  full_name: "",
  password: "",
  confirm_password: "",
  is_superuser: false,
  is_active: false,
}

/**
 * Dialog component for adding a new user.
 * @returns {React.ReactElement} The rendered AddUser dialog component.
 */
const AddUser: AddUserComponent = (): React.ReactElement => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const queryClient: QueryClient = useQueryClient()
  const { showSuccessToast, showApiErrorToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<UserCreateForm>({ mode: "onBlur", criteriaMode: "all", defaultValues })

  /**
   * Mutation for creating a new user via API.
   * @constant {UserCreateMutation}
   */
  const mutation: UserCreateMutation = useMutation({
    mutationFn: (data: UserCreate): CancelablePromise<UserPublic> => usersUsersRouterCreateUser({ requestBody: data }),
    onSuccess: (): void => {
      showSuccessToast("User created successfully.")
      void queryClient.invalidateQueries({ queryKey: ["users"] })
      setIsOpen(false)
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  /**
   * Handles form submission for user creation.
   * @param {UserCreateForm} data - The form data for creating a user.
   * @returns {Promise<void>} Resolves when submission is complete.
   */
  const onSubmit: SubmitHandler<UserCreateForm> = async (data: UserCreateForm): Promise<void> => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }: OpenChangeDetails): void => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button my={4}>
          <FaPlus fontSize="16px" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the form below to add a new user to the system.</Text>
            <VStack gap={4}>
              <Field required invalid={!!errors.email} errorText={errors.email?.message} label="Email" id="email">
                <Input
                  id="email"
                  {...register("email", { required: "Email is required", pattern: emailPattern })}
                  placeholder="Email"
                  type="email"
                  autoComplete="off"
                />
              </Field>

              <Field
                required
                invalid={!!errors.full_name}
                errorText={errors.full_name?.message}
                label="Full Name"
                id="name"
              >
                <Input
                  id="name"
                  {...register("full_name", { required: "Full name is required", pattern: namePattern })}
                  placeholder="Full name"
                  type="text"
                  autoComplete="off"
                />
              </Field>

              <Field
                required
                invalid={!!errors.password}
                errorText={errors.password?.message}
                label="Set Password"
                id="password"
              >
                <Input
                  id="password"
                  {...register("password", passwordRules())}
                  placeholder="Password"
                  type="password"
                  autoComplete="off"
                />
              </Field>

              <Field
                required
                invalid={!!errors.confirm_password}
                errorText={errors.confirm_password?.message}
                label="Confirm Password"
                id="confirm_password"
              >
                <Input
                  id="confirm_password"
                  {...register("confirm_password", confirmPasswordRules(getValues))}
                  placeholder="Password"
                  type="password"
                  autoComplete="off"
                />
              </Field>

              <Field colorPalette="teal">
                <Controller
                  control={control}
                  name="is_superuser"
                  render={({ field }): React.ReactElement => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={({ checked }: CheckedChangeDetails): void => field.onChange(checked)}
                      disabled={field.disabled}
                    >
                      Is superuser?
                    </Checkbox>
                  )}
                />
              </Field>

              <Field colorPalette="teal">
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }): React.ReactElement => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={({ checked }: CheckedChangeDetails): void => field.onChange(checked)}
                    >
                      Is active?
                    </Checkbox>
                  )}
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button variant="subtle" colorPalette="gray" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid || mutation.isPending}
              loading={mutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

// endregion

// region Optional Declarations

AddUser.displayName = "AddUser"

// endregion

export default AddUser
