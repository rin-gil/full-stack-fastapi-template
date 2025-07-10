/**
 * @file Defines the delete account page component.
 * @description Provides the UI for initiating account deletion, including a confirmation component.
 * Renders a heading, description, and the DeleteConfirmation component.
 * @module DeleteAccount
 */

import { Container, Heading, Text } from "@chakra-ui/react"
import type { FC, ReactElement } from "react"

import DeleteConfirmation from "./DeleteConfirmation"

// region Type Aliases

/**
 * Type alias for the DeleteAccount component.
 * @type {DeleteAccountComponent}
 */
type DeleteAccountComponent = FC

// endregion

// region Main Code

/**
 * Main component for the delete account page.
 * @description Renders a container with a heading, description, and the DeleteConfirmation component.
 * @returns {ReactElement} The rendered delete account component.
 */
const DeleteAccount: DeleteAccountComponent = (): ReactElement => {
  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        Delete Account
      </Heading>
      <Text>Permanently delete your data and everything associated with your account.</Text>
      <DeleteConfirmation />
    </Container>
  )
}

// endregion

// region Optional Declarations

DeleteAccount.displayName = "DeleteAccount"

// endregion

export default DeleteAccount
