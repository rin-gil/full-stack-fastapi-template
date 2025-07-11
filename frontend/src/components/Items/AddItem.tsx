/**
 * @file Defines the AddItem dialog component.
 * @description Provides a form for creating a new item with validation and API mutation handling.
 * @module AddItem
 */

"use client"

import { type QueryClient, type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import type React from "react"
import type { FC } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  type ApiError,
  type CancelablePromise,
  type ItemCreate,
  type ItemPublic,
  itemsItemsRouterCreateItem,
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { Button, DialogActionTrigger, DialogTitle, Input, Text, VStack } from "@chakra-ui/react"
// @ts-ignore
import type { OpenChangeDetails } from "@chakra-ui/react/dist/types/components/dialog/namespace"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"
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
 * Form data interface for item creation.
 * @interface ItemCreateForm
 */
interface ItemCreateForm extends ItemCreate {
  // Matches ItemCreate structure
}

/**
 * Type alias for the AddItem component.
 * @type {AddItemComponent}
 */
type AddItemComponent = FC

/**
 * Type alias for the mutation result of creating an item.
 * @type {ItemCreateMutation}
 */
type ItemCreateMutation = UseMutationResult<ItemCreate, ApiError, ItemCreate>

// endregion

// region Main Code

/**
 * Default values for the item creation form.
 * @constant {ItemCreateForm}
 */
const defaultValues: ItemCreateForm = {
  title: "",
  description: "",
}

/**
 * Dialog component for adding a new item.
 * @returns {React.ReactElement} The rendered AddItem dialog component.
 */
const AddItem: AddItemComponent = (): React.ReactElement => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const queryClient: QueryClient = useQueryClient()
  const { showSuccessToast, showApiErrorToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ItemCreateForm>({ mode: "onBlur", criteriaMode: "all", defaultValues })

  /**
   * Mutation for creating a new item via API.
   * @constant {ItemCreateMutation}
   */
  const mutation: ItemCreateMutation = useMutation({
    mutationFn: (data: ItemCreate): CancelablePromise<ItemPublic> => itemsItemsRouterCreateItem({ requestBody: data }),
    onSuccess: (): void => {
      showSuccessToast("Item created successfully.")
      setIsOpen(false)
    },
    onError: (err: ApiError): void => {
      showApiErrorToast(err)
    },
    onSettled: (): void => {
      void queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  /**
   * Handles form submission for item creation.
   * @param {ItemCreateForm} data - The form data for creating an item.
   * @returns {Promise<void>} Resolves when submission is complete.
   */
  const onSubmit: SubmitHandler<ItemCreateForm> = async (data: ItemCreateForm): Promise<void> => {
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
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new item.</Text>
            <VStack gap={4}>
              <Field required invalid={!!errors.title} errorText={errors.title?.message} label="Title" id="title">
                <Input
                  id="title"
                  {...register("title", {
                    required: "Title is required.",
                  })}
                  placeholder="Title"
                  type="text"
                  autoComplete="off"
                />
              </Field>

              <Field
                required
                invalid={!!errors.description}
                errorText={errors.description?.message}
                label="Description"
                id="description"
              >
                <Input
                  id="description"
                  {...register("description", {
                    required: "Description is required.",
                  })}
                  placeholder="Description"
                  type="text"
                  autoComplete="off"
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

AddItem.displayName = "AddItem"

// endregion

export default AddItem
