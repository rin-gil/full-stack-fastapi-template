/**
 * @file Defines the Navbar component.
 * @description Renders a navigation bar with a logo and user menu, responsive to screen size.
 * @module Navbar
 */

"use client"

import { Flex, HStack, Image, useBreakpointValue } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import type React from "react"
import type { FC } from "react"

import Logo from "/assets/images/fastapi-logo.svg"
import UserMenu from "./UserMenu"

// region Type Aliases

/**
 * Type alias for the Navbar component.
 * @type {NavbarComponent}
 */
type NavbarComponent = FC

// endregion

// region Main Code

/**
 * Navbar component for rendering a navigation bar with a logo and user menu.
 * @returns {React.ReactElement} The rendered Navbar component.
 */
const Navbar: NavbarComponent = (): React.ReactElement => {
  const display: string | undefined = useBreakpointValue({ base: "none", md: "flex" })

  return (
    <Flex
      display={display}
      justify="space-between"
      position="sticky"
      color="white"
      align="center"
      bg="bg.muted"
      w="100%"
      top={0}
      p={4}
    >
      <Link to="/" aria-label="Navigate to homepage">
        <Image src={Logo} alt="Logo" maxW="3xs" p={2} />
      </Link>
      <HStack gap={2}>
        <UserMenu />
      </HStack>
    </Flex>
  )
}

// endregion

// region Optional Declarations

Navbar.displayName = "Navbar"

// endregion

export default Navbar
