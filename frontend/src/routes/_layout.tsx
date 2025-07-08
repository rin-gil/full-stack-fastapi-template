/**
 * @file This file defines the layout route for the authenticated part of the application.
 * @description It serves as a wrapper for all pages that require a user to be logged in.
 * It uses the TanStack Router beforeLoad property to protect the route and renders a common UI shell
 * with a Navbar and a Sidebar.
 */

import { Flex } from "@chakra-ui/react"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import type * as React from "react"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

/**
 * The main layout component for authenticated users.
 * @description It renders the common application structure, including the Navbar,
 * Sidebar, and the main content area for child routes.
 * @returns {React.ReactElement} The rendered layout structure.
 */
const Layout: React.FC = (): React.ReactElement => {
  return (
    <Flex direction="column" h="100vh">
      <Navbar />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <Flex as="main" flex="1" direction="column" p={4} overflowY="auto">
          <Outlet />
        </Flex>
      </Flex>
    </Flex>
  )
}
Layout.displayName = "Layout"

/**
 * @description The route definition for the layout.
 * It is configured to run a check before loading. If the user is not logged in,
 * they are redirected to the login page. This check is synchronous.
 */
export const Route = createFileRoute("/_layout")({
  component: Layout,
  /**
   * @description A synchronous function that runs before the route loads.
   * It checks if the user is logged in using {@link isLoggedIn} and, if not,
   * redirects them to the login page using {@link redirect}.
   * @returns {void} Nothing, but throws a redirect error if the user is not logged in.
   */
  beforeLoad: (): void => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})
