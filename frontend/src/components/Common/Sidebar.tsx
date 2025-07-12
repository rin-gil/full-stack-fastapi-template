/**
 * @file Defines the Sidebar component.
 * @description Renders a responsive sidebar with navigation items and a logout button for mobile view.
 * @module Sidebar
 */

"use client"

import { Box, Flex, IconButton, Text, VStack } from "@chakra-ui/react"
import { type QueryClient, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type React from "react"
import type { FC } from "react"
import { FaBars } from "react-icons/fa"
import { FiLogOut } from "react-icons/fi"

import type { UserPublic } from "@/client"
import useAuth from "@/hooks/useAuth"
import { DrawerBackdrop, DrawerBody, DrawerCloseTrigger, DrawerContent, DrawerRoot, DrawerTrigger } from "../ui/drawer"
import SidebarItems from "./SidebarItems"

// region Type Aliases

/**
 * Type alias for the Sidebar component.
 * @type {SidebarComponent}
 */
type SidebarComponent = FC

// endregion

// region Main Code

/**
 * Sidebar component for rendering a responsive sidebar with navigation items.
 * @returns {React.ReactElement} The rendered Sidebar component.
 */
const Sidebar: SidebarComponent = (): React.ReactElement => {
  const queryClient: QueryClient = useQueryClient()
  const currentUser: UserPublic | undefined = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { logout } = useAuth()
  const [open, setOpen] = useState<boolean>(false)

  return (
    <aside>
      {/* Mobile */}
      <DrawerRoot placement="start" open={open} onOpenChange={({ open }) => setOpen(open)}>
        <DrawerBackdrop />
        <DrawerTrigger asChild>
          <IconButton
            variant="ghost"
            color="inherit"
            display={{ base: "flex", md: "none" }}
            aria-label="Open Menu"
            position="absolute"
            zIndex="100"
            m={4}
          >
            <FaBars />
          </IconButton>
        </DrawerTrigger>
        <DrawerContent maxW="xs">
          <DrawerCloseTrigger />
          <DrawerBody>
            <VStack justify="space-between" gap={0}>
              <Box>
                <SidebarItems onClose={() => setOpen(false)} />
                <Flex
                  as="button"
                  onClick={() => {
                    logout()
                  }}
                  alignItems="center"
                  gap={4}
                  px={4}
                  py={2}
                >
                  <FiLogOut />
                  <Text>Log Out</Text>
                </Flex>
              </Box>
              {currentUser?.email && (
                <Text fontSize="sm" p={2} truncate maxW="sm">
                  Logged in as: {currentUser.email}
                </Text>
              )}
            </VStack>
          </DrawerBody>
          <DrawerCloseTrigger />
        </DrawerContent>
      </DrawerRoot>

      {/* Desktop */}
      <Box display={{ base: "none", md: "flex" }} position="sticky" bg="bg.subtle" top={0} minW="xs" h="100vh" p={4}>
        <Box w="100%">
          <SidebarItems />
        </Box>
      </Box>
    </aside>
  )
}

// endregion

// region Optional Declarations

Sidebar.displayName = "Sidebar"

// endregion

export default Sidebar
