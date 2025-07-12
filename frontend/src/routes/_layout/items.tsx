/**
 * @file Defines the Items component.
 * @description Renders a page for managing items with a table, pagination, and add item functionality.
 * @module Items
 */

import { Container, EmptyState, Flex, Heading, Table, VStack } from "@chakra-ui/react"
// @ts-ignore
import type { PageChangeDetails } from "@chakra-ui/react/dist/types/components/pagination/namespace"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type React from "react"
import type { FC } from "react"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import type { CancelablePromise, ItemPublic, ItemsItemsRouterReadItemsResponse } from "@/client"
import { itemsItemsRouterReadItems } from "@/client"
import { ItemActionsMenu } from "@/components/Common/ItemActionsMenu"
import AddItem from "@/components/Items/AddItem"
import { PendingItems } from "@/components/Pending/PendingItems"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"

// region Type Aliases

/**
 * Type alias for the search parameters schema.
 * @type {SearchParams}
 */
type SearchParams = { page: number }

/**
 * Type alias for the Items component.
 * @type {ItemsComponent}
 */
type ItemsComponent = FC

/**
 * Type alias for the ItemsTable component.
 * @type {ItemsTableComponent}
 */
type ItemsTableComponent = FC

// endregion

// region Main Code

/**
 * Schema for validating search parameters for items pagination.
 * @constant {z.ZodObject}
 */
const itemsSearchSchema = z.object({
  /** The current page number. */
  page: z.number().catch(1),
})

/**
 * Number of items per page.
 * @constant {number}
 */
const PER_PAGE = 5

/**
 * Generates query options for fetching items.
 * @param {{ page: number }} params - The pagination parameters.
 * @param {number} params.page - The current page number.
 * @returns {{ queryFn: () => Promise<ItemsItemsRouterReadItemsResponse>, queryKey: [string, { page: number }] }} The query options.
 */
function getItemsQueryOptions({ page }: { page: number }): {
  queryFn: () => Promise<ItemsItemsRouterReadItemsResponse>
  queryKey: [string, { page: number }]
} {
  return {
    queryFn: (): CancelablePromise<ItemsItemsRouterReadItemsResponse> =>
      itemsItemsRouterReadItems({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["items", { page }],
  }
}

/**
 * Component for rendering the items table with pagination.
 * @returns {React.ReactElement} The rendered items table component.
 */
const ItemsTable: ItemsTableComponent = (): React.ReactElement => {
  const navigate: ReturnType<typeof useNavigate> = useNavigate({ from: Route.fullPath })
  const { page }: SearchParams = Route.useSearch()

  const { data, isPlaceholderData, isLoading } = useQuery({
    ...getItemsQueryOptions({ page }),
    placeholderData: (
      prevData: ItemsItemsRouterReadItemsResponse | undefined,
    ): ItemsItemsRouterReadItemsResponse | undefined => prevData,
  })

  const setPage: (page: number) => void = (page: number): void =>
    void navigate({
      search: (prev: SearchParams): { page: number } => ({ ...prev, page }),
    })

  const items: ItemPublic[] = data?.data ?? []
  const count: number = data?.count ?? 0

  if (isLoading) {
    return <PendingItems />
  }

  if (items.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any items yet</EmptyState.Title>
            <EmptyState.Description>Add a new item to get started</EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="sm">ID</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Title</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Description</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map(
            (item: ItemPublic): React.ReactElement => (
              <Table.Row key={item.id} opacity={isPlaceholderData ? 0.5 : 1}>
                <Table.Cell truncate maxW="sm">
                  {item.id}
                </Table.Cell>
                <Table.Cell truncate maxW="sm">
                  {item.title}
                </Table.Cell>
                <Table.Cell color={!item.description ? "gray" : "inherit"} truncate maxW="30%">
                  {item.description || "N/A"}
                </Table.Cell>
                <Table.Cell>
                  <ItemActionsMenu item={item} />
                </Table.Cell>
              </Table.Row>
            ),
          )}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({ page }: PageChangeDetails): void => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger aria-label="Previous page" />
            <PaginationItems />
            <PaginationNextTrigger aria-label="Next page" />
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

/**
 * Main component for the items management page.
 * @returns {React.ReactElement} The rendered items component.
 */
const Items: ItemsComponent = (): React.ReactElement => {
  return (
    <main>
      <Container maxW="full">
        <Heading size="lg" pt={12}>
          Items Management
        </Heading>
        <AddItem />
        <ItemsTable />
      </Container>
    </main>
  )
}

// endregion

// region Optional Declarations

Items.displayName = "Items"
ItemsTable.displayName = "ItemsTable"

export const Route = createFileRoute("/_layout/items")({
  component: Items,
  validateSearch: (search: Record<string, unknown>): SearchParams => itemsSearchSchema.parse(search),
})

// endregion

// noinspection JSUnusedGlobalSymbols
export default Items
