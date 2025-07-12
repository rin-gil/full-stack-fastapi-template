/**
 * @file Defines the DeleteUser dialog component.
 * @description Provides a confirmation dialog for deleting a user by an administrator.
 * @module DeleteUser
 */

"use client"

import { type QueryClient, type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import type React from "react"
import type { FC } from "react"

import { type ApiError, type CancelablePromise, usersUsersRouterDeleteUser } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { Button, Text } from "@chakra-ui/react"
// @ts-ignore
import type { OpenChangeDetails } from "@chakra-ui/react/dist/types/components/dialog/namespace"
import { useState } from "react"
import { FiTrash2 } from "react-icons/fi"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"

// region Type Aliases

/**
 * Interface for the API response message.
 * @interface Message
 */
interface Message {
  message: string
}

/**
 * Props for the DeleteUser component.
 * @interface DeleteUserProps
 */
interface DeleteUserProps {
  /** The ID of the user to be deleted. */
  id: string
}

/**
 * Type alias for the DeleteUser component.
 * @type {DeleteUserComponent}
 */
type DeleteUserComponent = FC<DeleteUserProps>

/**
 * Type alias for the mutation result of deleting a user.
 * @type {UserDeleteMutation}
 */
type UserDeleteMutation = UseMutationResult<Message, ApiError, string>

// endregion

// region Main Code

/**
 * Dialog component for confirming the deletion of a user.
 * @param {DeleteUserProps} props - The component props.
 * @returns {React.ReactElement} The rendered DeleteUser dialog component.
 */
const DeleteUser: DeleteUserComponent = ({ id }: DeleteUserProps): React.ReactElement => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const queryClient: QueryClient = useQueryClient()
  const { showSuccessToast, showApiErrorToast } = useCustomToast()

  /**
   * Mutation for deleting a user via API.
   * @constant {UserDeleteMutation}
   */
  const mutation: UserDeleteMutation = useMutation({
    mutationFn: (userId: string): CancelablePromise<Message> => usersUsersRouterDeleteUser({ id: userId }),
    onSuccess: (): void => {
      showSuccessToast("The user was deleted successfully")
      setIsOpen(false)
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
    onSettled: (): void => {
      void queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  /**
   * Handles form submission for user deletion.
   * @returns {void} Executes the deletion mutation.
   */
  const onSubmit = (): void => {
    mutation.mutate(id)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      role="alertdialog"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }: OpenChangeDetails): void => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          colorPalette="red"
          justifyContent="flex-start"
          w="100%"
          aria-label={`Delete user with ID ${id}`}
        >
          <FiTrash2 fontSize="16px" />
          Delete User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              All items associated with this user will also be <strong>permanently deleted.</strong> Are you sure? You
              will not be able to undo this action.
            </Text>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button variant="subtle" colorPalette="gray" disabled={mutation.isPending}>
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              colorPalette="red"
              type="submit"
              disabled={mutation.isPending}
              loading={mutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

// endregion

// region Optional Declarations

DeleteUser.displayName = "DeleteUser"

// endregion

export default DeleteUser
