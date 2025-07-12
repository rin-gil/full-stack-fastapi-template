/**
 * @file Defines the DeleteItem dialog component.
 * @description Provides a confirmation dialog for deleting an item.
 * @module DeleteItem
 */

"use client"

import { type ApiError, type CancelablePromise, itemsItemsRouterDeleteItem } from "@/client"
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
 * Props for the DeleteItemTrigger component.
 * @interface DeleteItemTriggerProps
 */
interface DeleteItemTriggerProps {
  /** The ID of the item. */
  id: string
  /** Function to open the dialog. */
  onOpen: () => void
}

/**
 * Props for the DeleteItemDialog component.
 * @interface DeleteItemDialogProps
 */
interface DeleteItemDialogProps {
  /** The ID of the item to be deleted. */
  id: string
  /** Controls if the dialog is open. */
  isOpen: boolean
  /** Function to close the dialog. */
  onClose: () => void
}

/**
 * Type alias for the mutation result of deleting an item.
 * @type {ItemDeleteMutation}
 */
type ItemDeleteMutation = UseMutationResult<Message, ApiError, string>

// endregion

// region Main Code

/**
 * A menu item component that triggers the delete item dialog.
 * It wraps a fully styled Button inside a functional, "invisible" MenuItem.
 * @param {DeleteItemTriggerProps} props - The component props.
 * @returns {React.ReactElement} The rendered MenuItem trigger.
 */
const DeleteItemTrigger: FC<DeleteItemTriggerProps> = ({ id, onOpen }: DeleteItemTriggerProps): React.ReactElement => (
  <MenuItem onClick={onOpen} p={0} value="delete-item">
    <Button
      variant="ghost"
      size="sm"
      colorPalette="red"
      justifyContent="flex-start"
      w="100%"
      aria-label={`Delete item with ID ${id}`}
      gap={2}
    >
      <FiTrash2 fontSize="16px" />
      Delete Item
    </Button>
  </MenuItem>
)

/**
 * Dialog component for confirming the deletion of an item.
 * This component is controlled by external state.
 * @param {DeleteItemDialogProps} props - The component props.
 * @returns {React.ReactElement} The rendered DeleteItem dialog component.
 */
const DeleteItemDialog: FC<DeleteItemDialogProps> = ({
  id,
  isOpen,
  onClose,
}: DeleteItemDialogProps): React.ReactElement => {
  const queryClient: QueryClient = useQueryClient()
  const { showSuccessToast, showApiErrorToast } = useCustomToast()

  /**
   * Mutation for deleting an item via API.
   * @constant {ItemDeleteMutation}
   */
  const mutation: ItemDeleteMutation = useMutation({
    mutationFn: (itemId: string): CancelablePromise<Message> => itemsItemsRouterDeleteItem({ id: itemId }),
    onSuccess: (): void => {
      showSuccessToast("The item was deleted successfully")
      void queryClient.invalidateQueries({ queryKey: ["items"] })
      onClose()
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  /**
   * Handles form submission for item deletion.
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
      onOpenChange={({ open }: OpenChangeDetails): void => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              This item will be permanently deleted. Are you sure? You will not be able to undo this action.
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
 * Composite component for item deletion.
 * Exports the trigger as the main component and the dialog as a property.
 */
const DeleteItem = Object.assign(DeleteItemTrigger, {
  Dialog: DeleteItemDialog,
})

// endregion

// region Optional Declarations

DeleteItem.displayName = "DeleteItem"

// endregion

export default DeleteItem
