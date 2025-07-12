/**
 * @file Defines the NotFound component.
 * @description Renders a 404 error page with a message and a button to return to the homepage.
 * @module NotFound
 */

"use client"

import { Button, Text, VStack } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import type React from "react"
import type { FC } from "react"

// region Type Aliases

/**
 * Type alias for the NotFound component.
 * @type {NotFoundComponent}
 */
type NotFoundComponent = FC

// endregion

// region Main Code

/**
 * NotFound component for rendering a 404 error page.
 * @returns {React.ReactElement} The rendered NotFound component.
 */
const NotFound: NotFoundComponent = (): React.ReactElement => {
  return (
    <main>
      <VStack h="100vh" align="center" justify="center" p={4} data-testid="not-found">
        <Text fontSize={{ base: "6xl", md: "8xl" }} fontWeight="bold" lineHeight="1" mb={4}>
          404
        </Text>
        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" mb={2}>
          Oops!
        </Text>
        <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" mb={4} textAlign="center">
          The page you are looking for was not found.
        </Text>
        <Link to="/" aria-label="Navigate to homepage">
          <Button variant="solid" colorScheme="teal" mt={4}>
            Go Back
          </Button>
        </Link>
      </VStack>
    </main>
  )
}

// endregion

// region Optional Declarations

NotFound.displayName = "NotFound"

// endregion

export default NotFound
