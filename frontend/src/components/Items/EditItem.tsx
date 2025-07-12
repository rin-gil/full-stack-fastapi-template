/**
 * @file Defines the EditItem dialog component.
 * @description Provides a form for editing an existing item.
 * @module EditItem
 */

"use client"

import {
  type ApiError,
  type CancelablePromise,
  type ItemPublic,
  type ItemUpdate,
  itemsItemsRouterUpdateItem,
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { Button, Input, MenuItem, Text, VStack } from "@chakra-ui/react"
// @ts-ignore
import type { OpenChangeDetails } from "@chakra-ui/react/dist/types/components/dialog/namespace"
import { type QueryClient, type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import type React from "react"
import type { FC } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaExchangeAlt } from "react-icons/fa"
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
 * Form data interface for item update.
 * @interface ItemUpdateForm
 */
interface ItemUpdateForm {
  title: string
  description?: string
}

/**
 * Props for the EditItemTrigger component.
 * @interface EditItemTriggerProps
 */
interface EditItemTriggerProps {
  /** The item to be edited, used for default form values. */
  item: ItemPublic
  /** Function to open the dialog. */
  onOpen: () => void
}

/**
 * Props for the EditItemDialog component.
 * @interface EditItemDialogProps
 */
interface EditItemDialogProps {
  /** The item to be edited. */
  item: ItemPublic
  /** Controls if the dialog is open. */
  isOpen: boolean
  /** Function to close the dialog. */
  onClose: () => void
}

/**
 * Type alias for the mutation result of updating a user.
 * @type {ItemUpdateMutation}
 */
type ItemUpdateMutation = UseMutationResult<ItemPublic, ApiError, ItemUpdate>

// endregion

// region Main Code

/**
 * A menu item component that triggers the edit item dialog.
 * It wraps a fully styled Button inside a functional, "invisible" MenuItem.
 * @param {EditItemTriggerProps} props - The component props.
 * @returns {React.ReactElement} The rendered MenuItem trigger.
 */
const EditItemTrigger: FC<EditItemTriggerProps> = ({ item, onOpen }: EditItemTriggerProps): React.ReactElement => (
  <MenuItem onClick={onOpen} p={0} value={`edit-item-${item.id}`} mb={2}>
    <Button variant="ghost" size="sm" justifyContent="flex-start" w="100%" gap={2}>
      <FaExchangeAlt fontSize="16px" />
      Edit Item
    </Button>
  </MenuItem>
)

/**
 * Dialog component for editing an existing item.
 * This component is controlled by external state.
 * @param {EditItemDialogProps} props - The component props.
 * @returns {React.ReactElement} The rendered EditItem dialog component.
 */
const EditItemDialog: FC<EditItemDialogProps> = ({
  item,
  isOpen,
  onClose,
}: EditItemDialogProps): React.ReactElement => {
  const queryClient: QueryClient = useQueryClient()
  const { showSuccessToast, showApiErrorToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { ...item, description: item.description ?? undefined },
  })

  /**
   * Mutation for updating an item via API.
   * @constant {ItemUpdateMutation}
   */
  const mutation: ItemUpdateMutation = useMutation({
    mutationFn: (data: ItemUpdate): CancelablePromise<ItemPublic> =>
      itemsItemsRouterUpdateItem({ id: item.id, requestBody: data }),
    onSuccess: (updatedItem: ItemPublic): void => {
      showSuccessToast("Item updated successfully.")
      void queryClient.invalidateQueries({ queryKey: ["items"] })
      reset({
        title: updatedItem.title,
        description: updatedItem.description ?? undefined,
      })
      onClose()
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
  })

  /**
   * Handles form submission for item update.
   * @param {ItemUpdateForm} data - The form data for updating an item.
   * @returns {Promise<void>} Resolves when submission is complete.
   */
  const onSubmit: SubmitHandler<ItemUpdateForm> = (data: ItemUpdateForm): void => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }: OpenChangeDetails): void => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the item details below.</Text>
            <VStack gap={4}>
              <Field id="title" required invalid={!!errors.title} errorText={errors.title?.message} label="Title">
                <Input
                  id="title"
                  {...register("title", {
                    required: "Title is required",
                  })}
                  placeholder="Title"
                  type="text"
                />
              </Field>
              <Field
                id="description"
                invalid={!!errors.description}
                errorText={errors.description?.message}
                label="Description"
              >
                <Input id="description" {...register("description")} placeholder="Description" type="text" />
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter gap={2}>
            <Button variant="subtle" colorPalette="gray" disabled={isSubmitting} onClick={onClose}>
              Cancel
            </Button>
            <Button variant="solid" type="submit" loading={isSubmitting || mutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

/**
 * Composite component for item editing.
 * Exports the trigger as the main component and the dialog as a property.
 */
const EditItem = Object.assign(EditItemTrigger, {
  Dialog: EditItemDialog,
})

// endregion

// region Optional Declarations

EditItem.displayName = "EditItem"

// endregion

export default EditItem
