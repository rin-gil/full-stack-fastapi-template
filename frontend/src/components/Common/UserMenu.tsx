/**
 * @file Defines the UserMenu component for user navigation.
 * @description Renders a dropdown menu for user profile and logout actions.
 * @module UserMenu
 */

"use client"

import { Box, Button, Flex, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import type { FC } from "react"
import { FaUserAstronaut } from "react-icons/fa"
import { FiLogOut, FiUser } from "react-icons/fi"

import useAuth from "@/hooks/useAuth"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"

// region Type Aliases

/**
 * Props for the UserMenu component.
 * @interface UserMenuProps
 */
type UserMenuProps = Record<string, never>

// endregion

// region Main Code

/**
 * UserMenu component for rendering user dropdown menu.
 * @returns {React.ReactElement} The rendered UserMenu component.
 */
const UserMenu: FC<UserMenuProps> = () => {
  const { user, logout } = useAuth()

  /**
   * Handles user logout action.
   * @returns {Promise<void>} A promise that resolves when logout is complete.
   */
  const handleLogout = async (): Promise<void> => {
    logout()
  }

  return (
    <Flex>
      <MenuRoot>
        <MenuTrigger asChild p={2}>
          <Button data-testid="user-menu" variant="solid" maxW="sm" truncate>
            <FaUserAstronaut fontSize="18" />
            <Text>{user?.full_name || "User"}</Text>
          </Button>
        </MenuTrigger>

        <MenuContent>
          <Link to="/settings">
            <MenuItem value="user-settings" gap={2} py={2} mb={1} style={{ cursor: "pointer" }}>
              <FiUser fontSize="18px" />
              <Box flex="1">My Profile</Box>
            </MenuItem>
          </Link>

          <MenuItem value="logout" gap={2} py={2} onClick={handleLogout} style={{ cursor: "pointer" }}>
            <FiLogOut />
            Log Out
          </MenuItem>
        </MenuContent>
      </MenuRoot>
    </Flex>
  )
}

// endregion

// region Optional Declarations

UserMenu.displayName = "UserMenu"

// endregion

export default UserMenu
