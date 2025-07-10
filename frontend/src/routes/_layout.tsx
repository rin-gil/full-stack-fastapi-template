/**
 * @file Defines the layout route for the authenticated part of the application.
 * @description Wraps pages requiring user authentication, rendering a common UI shell with Navbar, Sidebar, and Outlet.
 * @module LayoutRoute
 */

import { Flex } from "@chakra-ui/react"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import type { FC, ReactElement } from "react"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

// region Type Aliases

/**
 * Type alias for the Layout component.
 * @type {LayoutComponent}
 */
type LayoutComponent = FC

// endregion

// region Main Code

/**
 * Main layout component for authenticated users.
 * @description Renders the application structure with Navbar, Sidebar, and main content area for child routes.
 * @returns {ReactElement} The rendered layout structure.
 */
const Layout: LayoutComponent = (): ReactElement => {
  return (
    <Flex direction="column" h="100vh">
      <Navbar />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <Flex as="main" flex="1" direction="column" padding="var(--chakra-space-4)" overflowY="auto">
          <Outlet />
        </Flex>
      </Flex>
    </Flex>
  )
}

/**
 * Route definition for the authenticated layout.
 * @description Checks user authentication before loading. Redirects to log in if not authenticated.
 * @returns {void} Nothing, throws redirect if not authenticated.
 * @throws {redirect} Throws a redirect to "/login" with current path if user is not logged in.
 */
export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: (): void => {
    if (!isLoggedIn()) {
      throw redirect({ to: "/login", search: { from: window.location.pathname } })
    }
  },
})

// endregion

// region Optional Declarations

Layout.displayName = "Layout"

// endregion
