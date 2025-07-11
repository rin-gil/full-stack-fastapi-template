/**
 * @file Defines a menu for user actions (edit/delete).
 * @description Renders a menu with edit and delete options for a user.
 * @module UserActionsMenu
 */

"use client"

import type { UserPublic } from "@/client"
import { IconButton } from "@chakra-ui/react"
import type * as React from "react"
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
  const triggerButton: React.ReactElement = (
    <IconButton variant="ghost" color="inherit" disabled={disabled}>
      <BsThreeDotsVertical />
    </IconButton>
  )

  return (
    <MenuRoot>
      <MenuTrigger asChild>{triggerButton}</MenuTrigger>
      <MenuContent>
        <EditUser user={user} />
        <DeleteUser id={user.id} />
      </MenuContent>
    </MenuRoot>
  )
}

// endregion

// region Optional Declarations

UserActionsMenu.displayName = "UserActionsMenu"

// endregion
