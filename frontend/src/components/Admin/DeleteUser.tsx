/**
 * @file Defines the DeleteUser dialog component.
 * @description Provides a confirmation dialog for deleting a user by an administrator.
 * @module DeleteUser
 */

"use client"

import { type ApiError, type CancelablePromise, usersUsersRouterDeleteUser } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { Button, MenuItem, Text } from "@chakra-ui/react"
// @ts-ignore
import type { OpenChangeDetails } from "@chakra-ui/react/dist/types/components/dialog/namespace"
import { type QueryClient, type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import type React from "react"
import type { FC } from "react"
import { FiTrash2 } from "react-icons/fi"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
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
 * Props for the DeleteUserTrigger component.
 * @interface DeleteUserTriggerProps
 */
interface DeleteUserTriggerProps {
  /** The ID of the user. */
  id: string
  /** Function to open the dialog. */
  onOpen: () => void
}

/**
 * Props for the DeleteUserDialog component.
 * @interface DeleteUserDialogProps
 */
interface DeleteUserDialogProps {
  /** The ID of the user to be deleted. */
  id: string
  /** Controls if the dialog is open. */
  isOpen: boolean
  /** Function to close the dialog. */
  onClose: () => void
}

/**
 * Type alias for the mutation result of deleting a user.
 * @type {UserDeleteMutation}
 */
type UserDeleteMutation = UseMutationResult<Message, ApiError, string>

// endregion

// region Main Code

/**
 * A menu item component that triggers the delete user dialog.
 * It wraps a fully styled Button inside a functional, "invisible" MenuItem.
 * @param {DeleteUserTriggerProps} props - The component props.
 * @returns {React.ReactElement} The rendered MenuItem trigger.
 */
const DeleteUserTrigger: FC<DeleteUserTriggerProps> = ({ id, onOpen }: DeleteUserTriggerProps): React.ReactElement => (
  <MenuItem onClick={onOpen} p={0} value="delete-user">
    <Button
      variant="ghost"
      size="sm"
      colorPalette="red"
      justifyContent="flex-start"
      w="100%"
      aria-label={`Delete user with ID ${id}`}
      gap={2}
    >
      <FiTrash2 fontSize="16px" />
      Delete User
    </Button>
  </MenuItem>
)

/**
 * Dialog component for confirming the deletion of a user.
 * This component is controlled by external state.
 * @param {DeleteUserDialogProps} props - The component props.
 * @returns {React.ReactElement} The rendered DeleteUser dialog component.
 */
const DeleteUserDialog: FC<DeleteUserDialogProps> = ({
  id,
  isOpen,
  onClose,
}: DeleteUserDialogProps): React.ReactElement => {
  const queryClient: QueryClient = useQueryClient()
  const { showSuccessToast, showApiErrorToast } = useCustomToast()

  const mutation: UserDeleteMutation = useMutation({
    mutationFn: (userId: string): CancelablePromise<Message> => usersUsersRouterDeleteUser({ id: userId }),
    onSuccess: (): void => {
      showSuccessToast("The user was deleted successfully")
      void queryClient.invalidateQueries({ queryKey: ["users"] })
      onClose()
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  const onSubmit = (): void => {
    mutation.mutate(id)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      role="alertdialog"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }: OpenChangeDetails): void => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>): void => {
            e.preventDefault()
            onSubmit()
          }}
        >
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
            <Button variant="subtle" colorPalette="gray" disabled={mutation.isPending} onClick={onClose}>
              Cancel
            </Button>
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

/**
 * Composite component for user deletion.
 * Exports the trigger as the main component and the dialog as a property.
 */
const DeleteUser: FC<DeleteUserTriggerProps> = Object.assign(DeleteUserTrigger, {
  Dialog: DeleteUserDialog,
})

// endregion

// region Optional Declarations

DeleteUser.displayName = "DeleteUser"

// endregion

export default DeleteUser
