/**
 * @file Defines a menu for user actions (edit/delete).
 * @description Renders a menu with edit and delete options for a user.
 * @module UserActionsMenu
 */

"use client"

import type { UserPublic } from "@/client"
import { IconButton } from "@chakra-ui/react"
import * as React from "react"
import { useState } from "react"
import type { FC } from "react"
import { BsThreeDotsVertical } from "react-icons/bs"
import DeleteUser from "../Admin/DeleteUser"
import EditUser from "../Admin/EditUser"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

// region Type Aliases

/**
 * Props for the UserActionsMenu component.
 * @interface UserActionsMenuProps
 */
interface UserActionsMenuProps {
  /** The user to perform actions on. */
  user: UserPublic
  /** Whether the menu trigger is disabled. */
  disabled?: boolean
}

/**
 * Type alias for the UserActionsMenu component.
 * @type {UserActionsMenuComponent}
 */
type UserActionsMenuComponent = FC<UserActionsMenuProps>

// endregion

// region Main Code

/**
 * UserActionsMenu component for rendering a menu with edit and delete actions for a user.
 * @param {UserActionsMenuProps} props - Props for the component.
 * @returns {React.ReactElement} The rendered UserActionsMenu component.
 */
export const UserActionsMenu: UserActionsMenuComponent = function UserActionsMenu({
  user,
  disabled,
}: UserActionsMenuProps): React.ReactElement {
  const [isEditOpen, setEditOpen] = useState<boolean>(false)
  const [isDeleteOpen, setDeleteOpen] = useState<boolean>(false)

  const triggerButton: React.ReactElement = (
    <IconButton variant="ghost" color="inherit" disabled={disabled}>
      <BsThreeDotsVertical />
    </IconButton>
  )

  return (
    <React.Fragment>
      <MenuRoot>
        <MenuTrigger asChild>{triggerButton}</MenuTrigger>
        <MenuContent>
          <EditUser user={user} onOpen={(): void => setEditOpen(true)} />
          <DeleteUser id={user.id} onOpen={(): void => setDeleteOpen(true)} />
        </MenuContent>
      </MenuRoot>

      <EditUser.Dialog user={user} isOpen={isEditOpen} onClose={(): void => setEditOpen(false)} />
      <DeleteUser.Dialog id={user.id} isOpen={isDeleteOpen} onClose={(): void => setDeleteOpen(false)} />
    </React.Fragment>
  )
}

// endregion

// region Optional Declarations

UserActionsMenu.displayName = "UserActionsMenu"

// endregion
