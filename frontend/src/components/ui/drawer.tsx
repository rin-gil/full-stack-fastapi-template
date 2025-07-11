/**
 * @file Defines custom Drawer components for modal panels.
 * @description Provides Chakra UI-based drawer components with portal support and custom close trigger.
 * @module Drawer
 */

"use client"

import {
  Drawer as ChakraDrawer,
  type DrawerCloseTriggerProps as ChakraDrawerCloseTriggerProps,
  type DrawerContentProps as ChakraDrawerContentProps,
  Portal,
} from "@chakra-ui/react"
import * as React from "react"
import type { FC } from "react"
import { CloseButton } from "./close-button"

// region Type Aliases

/**
 * Props for the DrawerContent component.
 * @interface DrawerContentProps
 */
interface DrawerContentProps extends ChakraDrawerContentProps {
  /** Whether to use a portal for rendering. */
  portalled?: boolean
  /** Reference to the portal container. */
  portalRef?: React.RefObject<HTMLElement>
  /** Padding offset for the drawer positioner. */
  offset?: ChakraDrawerContentProps["padding"]
}

/**
 * Props for the DrawerCloseTrigger component.
 * @interface DrawerCloseTriggerProps
 */
interface DrawerCloseTriggerProps extends ChakraDrawerCloseTriggerProps {
  /** Whether the close button is visible. */
  isClosable?: boolean
}

/**
 * Type alias for the DrawerRoot component.
 * @type {DrawerRootComponent}
 */
type DrawerRootComponent = FC<ChakraDrawer.RootProps>

/**
 * Type alias for the DrawerTrigger component.
 * @type {DrawerTriggerComponent}
 */
type DrawerTriggerComponent = FC<ChakraDrawer.TriggerProps>

/**
 * Type alias for the DrawerContent component.
 * @type {DrawerContentComponent}
 */
type DrawerContentComponent = FC<DrawerContentProps>

/**
 * Type alias for the DrawerCloseTrigger component.
 * @type {DrawerCloseTriggerComponent}
 */
type DrawerCloseTriggerComponent = FC<DrawerCloseTriggerProps>

/**
 * Type alias for the DrawerFooter component.
 * @type {DrawerFooterComponent}
 */
type DrawerFooterComponent = FC<ChakraDrawer.FooterProps>

/**
 * Type alias for the DrawerHeader component.
 * @type {DrawerHeaderComponent}
 */
type DrawerHeaderComponent = FC<ChakraDrawer.HeaderProps>

/**
 * Type alias for the DrawerBody component.
 * @type {DrawerBodyComponent}
 */
type DrawerBodyComponent = FC<ChakraDrawer.BodyProps>

/**
 * Type alias for the DrawerBackdrop component.
 * @type {DrawerBackdropComponent}
 */
type DrawerBackdropComponent = FC<ChakraDrawer.BackdropProps>

/**
 * Type alias for the DrawerDescription component.
 * @type {DrawerDescriptionComponent}
 */
type DrawerDescriptionComponent = FC<ChakraDrawer.DescriptionProps>

/**
 * Type alias for the DrawerTitle component.
 * @type {DrawerTitleComponent}
 */
type DrawerTitleComponent = FC<ChakraDrawer.TitleProps>

/**
 * Type alias for the DrawerActionTrigger component.
 * @type {DrawerActionTriggerComponent}
 */
type DrawerActionTriggerComponent = FC<ChakraDrawer.ActionTriggerProps>

// endregion

// region Main Code

/**
 * DrawerRoot component for initializing the drawer.
 * @type {DrawerRootComponent}
 */
export const DrawerRoot: DrawerRootComponent = ChakraDrawer.Root

/**
 * DrawerTrigger component for opening the drawer.
 * @type {DrawerTriggerComponent}
 */
export const DrawerTrigger: DrawerTriggerComponent = ChakraDrawer.Trigger

/**
 * DrawerContent component for rendering drawer content with portal support.
 * @param {DrawerContentProps} props - Props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered DrawerContent component.
 */
export const DrawerContent: DrawerContentComponent = React.memo(
  React.forwardRef<HTMLDivElement, DrawerContentProps>(function DrawerContent(props, ref): React.ReactElement {
    const { children, portalled = true, portalRef, offset, ...rest } = props
    const content = (
      <ChakraDrawer.Positioner padding={offset}>
        <ChakraDrawer.Content ref={ref} {...rest}>
          {children}
        </ChakraDrawer.Content>
      </ChakraDrawer.Positioner>
    )
    return portalled ? (
      <Portal disabled={!portalled} container={portalRef}>
        {content}
      </Portal>
    ) : (
      content
    )
  }),
)

/**
 * DrawerCloseTrigger component for closing the drawer.
 * @param {DrawerCloseTriggerProps} props - Props for the component.
 * @param {React.Ref<HTMLButtonElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered DrawerCloseTrigger component.
 */
export const DrawerCloseTrigger: DrawerCloseTriggerComponent = React.memo(
  React.forwardRef<HTMLButtonElement, DrawerCloseTriggerProps>(
    function DrawerCloseTrigger(props, ref): React.ReactElement {
      const { isClosable = true, ...rest } = props
      return (
        <ChakraDrawer.CloseTrigger position="absolute" top="2" insetEnd="2" {...rest} asChild>
          {isClosable && <CloseButton size="sm" ref={ref} />}
        </ChakraDrawer.CloseTrigger>
      )
    },
  ),
)

/**
 * DrawerFooter component for the drawer footer.
 * @type {DrawerFooterComponent}
 */
export const DrawerFooter: DrawerFooterComponent = ChakraDrawer.Footer

/**
 * DrawerHeader component for the drawer header.
 * @type {DrawerHeaderComponent}
 */
export const DrawerHeader: DrawerHeaderComponent = ChakraDrawer.Header

/**
 * DrawerBody component for the drawer body.
 * @type {DrawerBodyComponent}
 */
export const DrawerBody: DrawerBodyComponent = ChakraDrawer.Body

/**
 * DrawerBackdrop component for the drawer backdrop.
 * @type {DrawerBackdropComponent}
 */
export const DrawerBackdrop: DrawerBackdropComponent = ChakraDrawer.Backdrop

/**
 * DrawerDescription component for the drawer description.
 * @type {DrawerDescriptionComponent}
 */
export const DrawerDescription: DrawerDescriptionComponent = ChakraDrawer.Description

/**
 * DrawerTitle component for the drawer title.
 * @type {DrawerTitleComponent}
 */
export const DrawerTitle: DrawerTitleComponent = ChakraDrawer.Title

/**
 * DrawerActionTrigger component for drawer actions.
 * @type {DrawerActionTriggerComponent}
 */
export const DrawerActionTrigger: DrawerActionTriggerComponent = ChakraDrawer.ActionTrigger

// endregion

// region Optional Declarations

DrawerRoot.displayName = "DrawerRoot"
DrawerTrigger.displayName = "DrawerTrigger"
DrawerContent.displayName = "DrawerContent"
DrawerCloseTrigger.displayName = "DrawerCloseTrigger"
DrawerFooter.displayName = "DrawerFooter"
DrawerHeader.displayName = "DrawerHeader"
DrawerBody.displayName = "DrawerBody"
DrawerBackdrop.displayName = "DrawerBackdrop"
DrawerDescription.displayName = "DrawerDescription"
DrawerTitle.displayName = "DrawerTitle"
DrawerActionTrigger.displayName = "DrawerActionTrigger"

// endregion
