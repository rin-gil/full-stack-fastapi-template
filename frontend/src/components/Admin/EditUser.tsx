/**
 * @file Defines the EditUser dialog component.
 * @description Provides a form for editing an existing user by an administrator.
 * @module EditUser
 */

"use client"

import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import type React from "react"
import type { FC } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import {
  type ApiError,
  type CancelablePromise,
  type UserPublic,
  type UserUpdate,
  usersUsersRouterUpdateUser,
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern, namePattern, passwordRules } from "@/utils"
import { Button, Input, MenuItem, Text, VStack } from "@chakra-ui/react"
// @ts-ignore
import type { CheckedChangeDetails } from "@chakra-ui/react/dist/types/components/checkbox/namespace"
// @ts-ignore
import type { OpenChangeDetails } from "@chakra-ui/react/dist/types/components/dialog/namespace"
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

interface UserUpdateForm extends UserUpdate {
  confirm_password?: string
}

interface EditUserTriggerProps {
  user: UserPublic
  onOpen: () => void
}

interface EditUserDialogProps {
  user: UserPublic
  isOpen: boolean
  onClose: () => void
}

type EditUserComponent = FC<EditUserTriggerProps>
type UserUpdateMutation = UseMutationResult<UserPublic, ApiError, UserUpdate>

// endregion

// region Main Code

const EditUserTrigger: EditUserComponent = ({ user, onOpen }: EditUserTriggerProps): React.ReactElement => {
  return (
    <MenuItem onClick={onOpen} p={0} value="edit-user">
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

const EditUserDialog: FC<EditUserDialogProps> = ({
  user,
  isOpen,
  onClose,
}: EditUserDialogProps): React.ReactElement => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showApiErrorToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    getValues,
    reset, // reset нужен
    formState: { errors, isValid, isSubmitting },
  } = useForm<UserUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: user,
  })

  // ИЗМЕНЕНИЕ: Возвращаем логику мутации, близкую к оригинальной.
  const mutation: UserUpdateMutation = useMutation({
    mutationFn: (data: UserUpdate): CancelablePromise<UserPublic> =>
      usersUsersRouterUpdateUser({ id: user.id, requestBody: data }),
    onSuccess: (data) => {
      showSuccessToast("User updated successfully.")
      // Сбрасываем форму с новыми данными, как в оригинале, но без reset()
      reset(data)
      onClose() // Используем onClose вместо setIsOpen(false)
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err) // Используем новый обработчик ошибок
    },
    // Возвращаем onSettled с invalidateQueries
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const onSubmit: SubmitHandler<UserUpdateForm> = async (data: UserUpdateForm): Promise<void> => {
    // Логика для опционального пароля
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
                    validate: (value) => {
                      if (!value) return true
                      const rules = passwordRules(false)
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
                    validate: (value) => {
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

const EditUser = Object.assign(EditUserTrigger, {
  Dialog: EditUserDialog,
})

EditUser.displayName = "EditUser"

export default EditUser
