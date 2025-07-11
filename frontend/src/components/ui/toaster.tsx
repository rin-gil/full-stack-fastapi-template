/**
 * @file Defines a custom Toaster component and toaster instance.
 * @description Provides a Chakra UI-based toaster for displaying notifications with customizable content.
 * Renders toasts in a portal with support for loading states, actions, and closable toasts.
 * @module Toaster
 */

"use client"

import { Toaster as ChakraToaster, Portal, Spinner, Stack, Toast, createToaster } from "@chakra-ui/react"
// @ts-ignore
import type { Options } from "@testing-library/user-event/options"
import type React from "react"
import type { ReactNode } from "react"
import type { FC } from "react"

// region Type Aliases

/**
 * Props for the Toaster component.
 * @interface ToasterProps
 */
interface ToasterProps extends Record<string, never> {}

/**
 * Type for the toaster instance.
 * @type {ToasterInstance}
 */
type ToasterInstance = ReturnType<typeof createToaster>

/**
 * Type alias for the Toaster component.
 * @type {ToasterComponent}
 */
type ToasterComponent = FC<ToasterProps>

// endregion

// region Main Code

/**
 * Instance of the toaster with predefined configuration.
 * @type {ToasterInstance}
 */
export const toaster: ToasterInstance = createToaster({ placement: "top-end", pauseOnPageIdle: true })

/**
 * Toaster component for rendering notifications.
 * @returns {React.ReactElement} The rendered Toaster component.
 */
export const Toaster: ToasterComponent = (): React.ReactElement => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast: Options<ReactNode>): React.ReactElement => (
          <Toast.Root width={{ md: "sm" }} color={toast.meta?.color}>
            {toast.type === "loading" ? <Spinner size="sm" color="blue.solid" /> : <Toast.Indicator />}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
            </Stack>
            {toast.action?.label && <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>}
            {toast.meta?.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}

// endregion

// region Optional Declarations

Toaster.displayName = "Toaster"

// endregion
