/**
 * @file Defines a menu for item actions (edit/delete).
 * @description Renders a menu with edit and delete options for an item.
 * @module ItemActionsMenu
 */

"use client"

import type { ItemPublic } from "@/client"
import { IconButton } from "@chakra-ui/react"
import type * as React from "react"
import type { FC } from "react"
import { BsThreeDotsVertical } from "react-icons/bs"
import DeleteItem from "../Items/DeleteItem"
import EditItem from "../Items/EditItem"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

// region Type Aliases

/**
 * Props for the ItemActionsMenu component.
 * @interface ItemActionsMenuProps
 */
interface ItemActionsMenuProps {
  /** The item to perform actions on. */
  item: ItemPublic
}

/**
 * Type alias for the ItemActionsMenu component.
 * @type {ItemActionsMenuComponent}
 */
type ItemActionsMenuComponent = FC<ItemActionsMenuProps>

// endregion

// region Main Code

/**
 * ItemActionsMenu component for rendering a menu with edit and delete actions.
 * @param {ItemActionsMenuProps} props - Props for the component.
 * @returns {React.ReactElement} The rendered ItemActionsMenu component.
 */
export const ItemActionsMenu: ItemActionsMenuComponent = function ItemActionsMenu({
  item,
}: ItemActionsMenuProps): React.ReactElement {
  const triggerButton: React.ReactElement = (
    <IconButton variant="ghost" color="inherit">
      <BsThreeDotsVertical />
    </IconButton>
  )

  return (
    <MenuRoot>
      <MenuTrigger asChild>{triggerButton}</MenuTrigger>
      <MenuContent>
        <EditItem item={item} />
        <DeleteItem id={item.id} />
      </MenuContent>
    </MenuRoot>
  )
}

// endregion

// region Optional Declarations

ItemActionsMenu.displayName = "ItemActionsMenu"

// endregion
