/**
 * @file Defines a PendingUsers component for displaying a table placeholder for users.
 * @description Renders a table with skeleton text placeholders for loading user data.
 * @module PendingUsers
 */

"use client"

import { Table } from "@chakra-ui/react"
import type * as React from "react"
import { useMemo } from "react"
import type { FC } from "react"
import { SkeletonText } from "../ui/skeleton"

// region Type Aliases

/**
 * Props for the PendingUsers component.
 * @interface PendingUsersProps
 */
interface PendingUsersProps extends Record<string, never> {}

/**
 * Type alias for the PendingUsers component.
 * @type {PendingUsersComponent}
 */
type PendingUsersComponent = FC<PendingUsersProps>

// endregion

// region Main Code

/**
 * PendingUsers component for rendering a table with skeleton placeholders for user data.
 * @returns {React.ReactElement} The rendered PendingUsers component.
 */
export const PendingUsers: PendingUsersComponent = function PendingUsers(): React.ReactElement {
  const skeletonCell: React.ReactElement = <SkeletonText noOfLines={1} />
  const rows: React.ReactElement[] = useMemo(
    (): React.ReactElement[] =>
      Array(5)
        .fill(0)
        .map(
          (_: any, index: number): React.ReactElement => (
            <Table.Row key={index}>
              <Table.Cell>{skeletonCell}</Table.Cell>
              <Table.Cell>{skeletonCell}</Table.Cell>
              <Table.Cell>{skeletonCell}</Table.Cell>
              <Table.Cell>{skeletonCell}</Table.Cell>
              <Table.Cell>{skeletonCell}</Table.Cell>
            </Table.Row>
          ),
        ),
    [],
  )

  return (
    <Table.Root size={{ base: "sm", md: "md" }}>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader w="sm">Full name</Table.ColumnHeader>
          <Table.ColumnHeader w="sm">Email</Table.ColumnHeader>
          <Table.ColumnHeader w="sm">Role</Table.ColumnHeader>
          <Table.ColumnHeader w="sm">Status</Table.ColumnHeader>
          <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>{rows}</Table.Body>
    </Table.Root>
  )
}

// endregion

// region Optional Declarations

PendingUsers.displayName = "PendingUsers"

// endregion
