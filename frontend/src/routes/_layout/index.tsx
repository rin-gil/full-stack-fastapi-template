/**
 * @file Defines the Dashboard component.
 * @description Renders the dashboard page with a greeting for the logged-in user.
 * @module Dashboard
 */

import { Box, Container, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import type React from "react"
import type { FC } from "react"

import useAuth from "@/hooks/useAuth"

// region Type Aliases

/**
 * Type alias for the Dashboard component.
 * @type {DashboardComponent}
 */
type DashboardComponent = FC

// endregion

// region Main Code

/**
 * Dashboard component for rendering the dashboard page.
 * @returns {React.ReactElement} The rendered Dashboard component.
 */
const Dashboard: DashboardComponent = (): React.ReactElement => {
  const { user: currentUser } = useAuth()

  return (
    <main>
      <Container maxW="full">
        <Box pt={12} m={4}>
          <Text fontSize="2xl" truncate maxW="sm" aria-label="User greeting">
            Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
          </Text>
          <Text>Welcome back, nice to see you again!</Text>
        </Box>
      </Container>
    </main>
  )
}

// endregion

// region Optional Declarations

Dashboard.displayName = "Dashboard"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

// endregion

// noinspection JSUnusedGlobalSymbols
export default Dashboard
