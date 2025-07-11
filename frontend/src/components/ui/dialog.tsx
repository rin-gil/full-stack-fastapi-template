/**
 * @file Defines custom Dialog components for modal dialogs.
 * @description Provides Chakra UI-based dialog components with portal support and custom close trigger.
 * @module Dialog
 */

"use client"

import { Dialog as ChakraDialog, Portal } from "@chakra-ui/react"
import * as React from "react"
import type { FC, ForwardedRef } from "react"
import { CloseButton } from "./close-button"

// region Type Aliases

/**
 * Props for the DialogContent component.
 * @interface DialogContentProps
 */
interface DialogContentProps extends ChakraDialog.ContentProps {
  /** Whether to use a portal for rendering. */
  portalled?: boolean
  /** Reference to the portal container. */
  portalRef?: React.RefObject<HTMLElement>
  /** Whether to show the backdrop. */
  backdrop?: boolean
}

/**
 * Props for the DialogCloseTrigger component.
 * @interface DialogCloseTriggerProps
 */
interface DialogCloseTriggerProps extends ChakraDialog.CloseTriggerProps {}

/**
 * Type alias for the DialogRoot component.
 * @type {DialogRootComponent}
 */
type DialogRootComponent = FC<ChakraDialog.RootProps>

/**
 * Type alias for the DialogTrigger component.
 * @type {DialogTriggerComponent}
 */
type DialogTriggerComponent = FC<ChakraDialog.TriggerProps>

/**
 * Type alias for the DialogContent component.
 * @type {DialogContentComponent}
 */
type DialogContentComponent = FC<DialogContentProps>

/**
 * Type alias for the DialogCloseTrigger component.
 * @type {DialogCloseTriggerComponent}
 */
type DialogCloseTriggerComponent = FC<DialogCloseTriggerProps>

/**
 * Type alias for the DialogFooter component.
 * @type {DialogFooterComponent}
 */
type DialogFooterComponent = FC<ChakraDialog.FooterProps>

/**
 * Type alias for the DialogHeader component.
 * @type {DialogHeaderComponent}
 */
type DialogHeaderComponent = FC<ChakraDialog.HeaderProps>

/**
 * Type alias for the DialogBody component.
 * @type {DialogBodyComponent}
 */
type DialogBodyComponent = FC<ChakraDialog.BodyProps>

/**
 * Type alias for the DialogBackdrop component.
 * @type {DialogBackdropComponent}
 */
type DialogBackdropComponent = FC<ChakraDialog.BackdropProps>

/**
 * Type alias for the DialogTitle component.
 * @type {DialogTitleComponent}
 */
type DialogTitleComponent = FC<ChakraDialog.TitleProps>

/**
 * Type alias for the DialogDescription component.
 * @type {DialogDescriptionComponent}
 */
type DialogDescriptionComponent = FC<ChakraDialog.DescriptionProps>

/**
 * Type alias for the DialogActionTrigger component.
 * @type {DialogActionTriggerComponent}
 */
type DialogActionTriggerComponent = FC<ChakraDialog.ActionTriggerProps>

// endregion

// region Main Code

/**
 * DialogRoot component for initializing the dialog.
 * @type {DialogRootComponent}
 */
export const DialogRoot: DialogRootComponent = ChakraDialog.Root

/**
 * DialogTrigger component for opening the dialog.
 * @type {DialogTriggerComponent}
 */
export const DialogTrigger: DialogTriggerComponent = ChakraDialog.Trigger

/**
 * DialogContent component for rendering dialog content with portal and backdrop support.
 * @param {DialogContentProps} props - Props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered DialogContent component.
 */
export const DialogContent: DialogContentComponent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(props: DialogContentProps, ref: ForwardedRef<HTMLDivElement>): React.ReactElement {
    const { children, portalled = true, portalRef, backdrop = true, ...rest } = props
    return (
      <Portal disabled={!portalled} container={portalRef}>
        {backdrop && <ChakraDialog.Backdrop />}
        <ChakraDialog.Positioner>
          <ChakraDialog.Content ref={ref} {...rest}>
            {children}
          </ChakraDialog.Content>
        </ChakraDialog.Positioner>
      </Portal>
    )
  },
)

/**
 * DialogCloseTrigger component for closing the dialog.
 * @param {DialogCloseTriggerProps} props - Props for the component.
 * @param {React.Ref<HTMLButtonElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered DialogCloseTrigger component.
 */
export const DialogCloseTrigger: DialogCloseTriggerComponent = React.forwardRef<
  HTMLButtonElement,
  DialogCloseTriggerProps
>(function DialogCloseTrigger(
  props: DialogCloseTriggerProps,
  ref: ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  return (
    <ChakraDialog.CloseTrigger position="absolute" top="2" insetEnd="2" {...props} asChild>
      <CloseButton size="sm" ref={ref}>
        {props.children}
      </CloseButton>
    </ChakraDialog.CloseTrigger>
  )
})

/**
 * DialogFooter component for the dialog footer.
 * @type {DialogFooterComponent}
 */
export const DialogFooter: DialogFooterComponent = ChakraDialog.Footer

/**
 * DialogHeader component for the dialog header.
 * @type {DialogHeaderComponent}
 */
export const DialogHeader: DialogHeaderComponent = ChakraDialog.Header

/**
 * DialogBody component for the dialog body.
 * @type {DialogBodyComponent}
 */
export const DialogBody: DialogBodyComponent = ChakraDialog.Body

/**
 * DialogBackdrop component for the dialog backdrop.
 * @type {DialogBackdropComponent}
 */
export const DialogBackdrop: DialogBackdropComponent = ChakraDialog.Backdrop

/**
 * DialogTitle component for the dialog title.
 * @type {DialogTitleComponent}
 */
export const DialogTitle: DialogTitleComponent = ChakraDialog.Title

/**
 * DialogDescription component for the dialog description.
 * @type {DialogDescriptionComponent}
 */
export const DialogDescription: DialogDescriptionComponent = ChakraDialog.Description

/**
 * DialogActionTrigger component for dialog actions.
 * @type {DialogActionTriggerComponent}
 */
export const DialogActionTrigger: DialogActionTriggerComponent = ChakraDialog.ActionTrigger

// endregion

// region Optional Declarations

DialogRoot.displayName = "DialogRoot"
DialogTrigger.displayName = "DialogTrigger"
DialogContent.displayName = "DialogContent"
DialogCloseTrigger.displayName = "DialogCloseTrigger"
DialogFooter.displayName = "DialogFooter"
DialogHeader.displayName = "DialogHeader"
DialogBody.displayName = "DialogBody"
DialogBackdrop.displayName = "DialogBackdrop"
DialogTitle.displayName = "DialogTitle"
DialogDescription.displayName = "DialogDescription"
DialogActionTrigger.displayName = "DialogActionTrigger"

// endregion
