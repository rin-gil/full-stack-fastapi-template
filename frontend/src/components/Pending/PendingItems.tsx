/**
 * @file Defines a PendingItems component for displaying a table placeholder.
 * @description Renders a table with skeleton text placeholders for loading states.
 * @module PendingItems
 */

"use client"

import { Table } from "@chakra-ui/react"
import type * as React from "react"
import { useMemo } from "react"
import type { FC } from "react"
import { SkeletonText } from "../ui/skeleton"

// region Type Aliases

/**
 * Props for the PendingItems component.
 * @interface PendingItemsProps
 */
interface PendingItemsProps extends Record<string, never> {}

/**
 * Type alias for the PendingItems component.
 * @type {PendingItemsComponent}
 */
type PendingItemsComponent = FC<PendingItemsProps>

// endregion

// region Main Code

/**
 * PendingItems component for rendering a table with skeleton placeholders.
 * @returns {React.ReactElement} The rendered PendingItems component.
 */
export const PendingItems: PendingItemsComponent = function PendingItems(): React.ReactElement {
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
            </Table.Row>
          ),
        ),
    [],
  )

  return (
    <Table.Root size={{ base: "sm", md: "md" }}>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader w="sm">ID</Table.ColumnHeader>
          <Table.ColumnHeader w="sm">Title</Table.ColumnHeader>
          <Table.ColumnHeader w="sm">Description</Table.ColumnHeader>
          <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>{rows}</Table.Body>
    </Table.Root>
  )
}

// endregion

// region Optional Declarations

PendingItems.displayName = "PendingItems"

// endregion
