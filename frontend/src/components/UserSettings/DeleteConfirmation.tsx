/**
 * @file Defines the delete account confirmation dialog component.
 * @description Provides a dialog for confirming account deletion, handling API calls, and logging out the user.
 * Uses a mutation to delete the account and invalidates user queries on success.
 * @module DeleteConfirmation
 */

import { Button, ButtonGroup, Text } from "@chakra-ui/react"
import { type QueryClient, type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { FC, ReactElement } from "react"

import { type ApiError, usersUsersRouterDeleteUserMe } from "@/client"
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
} from "@/components/ui/dialog"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

// region Type Aliases

/**
 * Type alias for the DeleteConfirmation component.
 * @type {DeleteConfirmationComponent}
 */
type DeleteConfirmationComponent = FC

// endregion

// region Main Code

/**
 * Dialog component for confirming account deletion.
 * @description Renders a dialog with a confirmation prompt, triggers account deletion via API, and logs out the user on success.
 * @returns {ReactElement} The rendered delete confirmation dialog component.
 */
const DeleteConfirmation: DeleteConfirmationComponent = (): ReactElement => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const queryClient: QueryClient = useQueryClient()
  const { showSuccessToast, showApiErrorToast } = useCustomToast()
  const { logout } = useAuth()

  /**
   * Mutation for handling account deletion.
   * @type {UseMutationResult<unknown, ApiError, void>}
   */
  const mutation: UseMutationResult<unknown, ApiError, void> = useMutation({
    mutationFn: usersUsersRouterDeleteUserMe,
    onSuccess: (): void => {
      showSuccessToast("Your account has been successfully deleted")
      setIsOpen(false)
      logout()
      void queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      role="alertdialog"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }: { open: boolean }): void => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="solid" colorPalette="red" mt={4}>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div>
          <DialogCloseTrigger />
          <DialogHeader>
            <DialogTitle>Confirmation Required</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              All your account data will be <strong>permanently deleted.</strong> If you are sure, please click{" "}
              <strong>"Confirm"</strong> to proceed. This action cannot be undone.
            </Text>
          </DialogBody>
          <DialogFooter gap={2}>
            <ButtonGroup>
              <DialogActionTrigger asChild>
                <Button variant="subtle" colorPalette="gray" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button
                variant="solid"
                colorPalette="red"
                onClick={(): void => mutation.mutate()}
                disabled={mutation.isPending}
                loading={mutation.isPending}
              >
                Delete
              </Button>
            </ButtonGroup>
          </DialogFooter>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}

// endregion

// region Optional Declarations

DeleteConfirmation.displayName = "DeleteConfirmation"

// endregion

export default DeleteConfirmation
