/**
 * @file Defines the EditUser dialog component.
 * @description Provides a form for editing an existing user by an administrator.
 * @module EditUser
 */

"use client"

import {
  type ApiError,
  type CancelablePromise,
  type UserPublic,
  type UserUpdate,
  usersUsersRouterUpdateUser,
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { type ValidationRules, emailPattern, namePattern, passwordRules } from "@/utils"
import { Button, Input, MenuItem, Text, VStack } from "@chakra-ui/react"
// @ts-ignore
import type { CheckedChangeDetails } from "@chakra-ui/react/dist/types/components/checkbox/namespace"
// @ts-ignore
import type { OpenChangeDetails } from "@chakra-ui/react/dist/types/components/dialog/namespace"
import { type QueryClient, type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import type React from "react"
import type { FC } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { FaExchangeAlt } from "react-icons/fa"
import { Checkbox } from "../ui/checkbox"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../ui/dialog"
import { Field } from "../ui/field"

// region Type Aliases

/**
 * Form data interface for user update, extending UserUpdate with confirm_password.
 * @interface UserUpdateForm
 */
interface UserUpdateForm extends UserUpdate {
  /** Confirmation of the password (optional). */
  confirm_password?: string
}

/**
 * Props for the EditUserTrigger component.
 * @interface EditUserTriggerProps
 */
interface EditUserTriggerProps {
  /** The user to be edited. */
  user: UserPublic
  /** Function to open the dialog. */
  onOpen: () => void
}

/**
 * Props for the EditUserDialog component.
 * @interface EditUserDialogProps
 */
interface EditUserDialogProps {
  /** The user to be edited. */
  user: UserPublic
  /** Controls if the dialog is open. */
  isOpen: boolean
  /** Function to close the dialog. */
  onClose: () => void
}

/**
 * Type alias for the EditUser component.
 * @type {EditUserComponent}
 */
type EditUserComponent = FC<EditUserTriggerProps>

/**
 * Type alias for the mutation result of updating a user.
 * @type {UserUpdateMutation}
 */
type UserUpdateMutation = UseMutationResult<UserPublic, ApiError, UserUpdate>

// endregion

// region Main Code

/**
 * A menu item component that triggers the edit user dialog.
 * It wraps a fully styled Button inside a functional, "invisible" MenuItem.
 * @param {EditUserTriggerProps} props - The component props.
 * @returns {React.ReactElement} The rendered MenuItem trigger.
 */
const EditUserTrigger: EditUserComponent = ({ user, onOpen }: EditUserTriggerProps): React.ReactElement => {
  return (
    <MenuItem onClick={onOpen} p={0} value="edit-user" mb={2}>
      <Button
        variant="ghost"
        size="sm"
        justifyContent="flex-start"
        w="100%"
        aria-label={`Edit user with ID ${user.id}`}
        gap={2}
      >
        <FaExchangeAlt fontSize="16px" />
        Edit User
      </Button>
    </MenuItem>
  )
}

/**
 * Dialog component for editing an existing user.
 * This component is controlled by external state.
 * @param {EditUserDialogProps} props - The component props.
 * @returns {React.ReactElement} The rendered EditUser dialog component.
 */
const EditUserDialog: FC<EditUserDialogProps> = ({
  user,
  isOpen,
  onClose,
}: EditUserDialogProps): React.ReactElement => {
  const queryClient: QueryClient = useQueryClient()
  const { showSuccessToast, showApiErrorToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<UserUpdateForm>({ mode: "onBlur", criteriaMode: "all", defaultValues: user })

  /**
   * Mutation for updating a user via API.
   * @constant {UserUpdateMutation}
   */
  const mutation: UserUpdateMutation = useMutation({
    mutationFn: (data: UserUpdate): CancelablePromise<UserPublic> =>
      usersUsersRouterUpdateUser({ id: user.id, requestBody: data }),
    onSuccess: (data: UserPublic): void => {
      showSuccessToast("User updated successfully.")
      void queryClient.invalidateQueries({ queryKey: ["users"] })
      reset(data)
      onClose()
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  /**
   * Handles form submission for user update.
   * @param {UserUpdateForm} data - The form data for updating a user.
   * @returns {Promise<void>} Resolves when submission is complete.
   */
  const onSubmit: SubmitHandler<UserUpdateForm> = async (data: UserUpdateForm): Promise<void> => {
    const { password, ...rest } = data
    const updatedData: UserUpdate = { ...rest, password: password === "" ? undefined : password }
    mutation.mutate(updatedData)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }: OpenChangeDetails): void => {
        if (!open) onClose()
      }}
      data-testid="edit-user-dialog"
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the user details below.</Text>
            <VStack gap={4} alignItems="flex-start">
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
                invalid={!!errors.password}
                errorText={errors.password?.message}
                label="Set New Password (optional)"
                id="password"
              >
                <Input
                  id="password"
                  {...register("password", {
                    validate: (value: string | null | undefined): string | true => {
                      if (!value) return true
                      const rules: ValidationRules = passwordRules(false)
                      return rules.validate?.(value) || "Invalid password format."
                    },
                  })}
                  placeholder="New Password"
                  type="password"
                  autoComplete="off"
                />
              </Field>

              <Field
                invalid={!!errors.confirm_password}
                errorText={errors.confirm_password?.message}
                label="Confirm New Password"
                id="confirm_password"
              >
                <Input
                  id="confirm_password"
                  {...register("confirm_password", {
                    validate: (value: string | undefined): string | true => {
                      if (!getValues("password")) return true
                      return value === getValues("password") || "The passwords do not match."
                    },
                  })}
                  placeholder="Confirm New Password"
                  type="password"
                  autoComplete="off"
                />
              </Field>
              <Controller
                control={control}
                name="is_superuser"
                render={({ field }): React.ReactElement => (
                  <Field colorPalette="teal">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={({ checked }: CheckedChangeDetails): void => field.onChange(checked)}
                      disabled={field.disabled}
                    >
                      Is superuser?
                    </Checkbox>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="is_active"
                render={({ field }): React.ReactElement => (
                  <Field colorPalette="teal">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={({ checked }: CheckedChangeDetails): void => field.onChange(checked)}
                      disabled={field.disabled}
                    >
                      Is active?
                    </Checkbox>
                  </Field>
                )}
              />
            </VStack>
          </DialogBody>
          <DialogFooter gap={2}>
            <Button variant="subtle" colorPalette="gray" disabled={isSubmitting} onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="solid"
              type="submit"
              disabled={mutation.isPending || !isValid}
              loading={mutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

/**
 * Composite component for user editing.
 * Exports the trigger as the main component and the dialog as a property.
 */
const EditUser: EditUserComponent & { Dialog: React.FC<EditUserDialogProps> } = Object.assign(EditUserTrigger, {
  Dialog: EditUserDialog,
})

// endregion

// region Optional Declarations

EditUser.displayName = "EditUser"

// endregion

export default EditUser
