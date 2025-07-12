/**
 * @file Defines the SidebarItems component.
 * @description Renders a list of navigation items for the sidebar, conditionally including admin links for superusers.
 * @module SidebarItems
 */

"use client"

import { HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { type QueryClient, useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import type React from "react"
import type { FC } from "react"
import { FiBriefcase, FiHome, FiSettings, FiUsers } from "react-icons/fi"

import type { UserPublic } from "@/client"

// region Type Aliases

/**
 * Props for the SidebarItems component.
 * @interface SidebarItemsProps
 */
interface SidebarItemsProps {
  /** Optional callback to close the sidebar. */
  onClose?: () => void
}

/**
 * Interface for a navigation item.
 * @interface Item
 */
interface Item {
  /** Icon component for the item. */
  icon: typeof FiHome
  /** Title of the navigation item. */
  title: string
  /** Path for the navigation link. */
  path: string
}

/**
 * Type alias for the SidebarItems component.
 * @type {SidebarItemsComponent}
 */
type SidebarItemsComponent = FC<SidebarItemsProps>

// endregion

// region Main Code

/**
 * List of default navigation items.
 * @constant {Item[]}
 */
const items: Item[] = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: FiBriefcase, title: "Items", path: "/items" },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

/**
 * SidebarItems component for rendering navigation items in the sidebar.
 * @param {SidebarItemsProps} props - The component props.
 * @returns {React.ReactElement} The rendered SidebarItems component.
 */
const SidebarItems: SidebarItemsComponent = ({ onClose }: SidebarItemsProps): React.ReactElement => {
  const queryClient: QueryClient = useQueryClient()
  const currentUser: UserPublic | undefined = queryClient.getQueryData<UserPublic>(["currentUser"])
  const finalItems: Item[] = currentUser?.is_superuser
    ? [...items, { icon: FiUsers, title: "Admin", path: "/admin" }]
    : items

  return (
    <nav>
      <VStack align="stretch" gap={0}>
        <Text fontSize="xs" px={4} py={2} fontWeight="bold">
          Menu
        </Text>
        {finalItems.map(
          ({ icon, title, path }: Item): React.ReactElement => (
            <RouterLink key={title} to={path} onClick={onClose} aria-label={`Navigate to ${title}`}>
              <HStack gap={4} px={4} py={2} _hover={{ background: "gray.subtle" }} fontSize="sm">
                <Icon as={icon} />
                <Text ml={2}>{title}</Text>
              </HStack>
            </RouterLink>
          ),
        )}
      </VStack>
    </nav>
  )
}

// endregion

// region Optional Declarations

SidebarItems.displayName = "SidebarItems"

// endregion

export default SidebarItems
