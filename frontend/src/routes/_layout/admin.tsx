/**
 * @file Defines the Admin page component for managing users.
 * @description Renders a page with a paginated table of users, providing functionality to add users and perform actions on existing users.
 * @module Admin
 */

import { Badge, Container, EmptyState, Flex, Heading, Table, VStack } from "@chakra-ui/react"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type React from "react"
import type { FC } from "react"
import { useCallback, useEffect } from "react"
import { FiUsers } from "react-icons/fi"
import { z } from "zod"

import { type CancelablePromise, type UserPublic, type UsersPublic, usersUsersRouterReadUsers } from "@/client"
import AddUser from "@/components/Admin/AddUser"
import { UserActionsMenu } from "@/components/Common/UserActionsMenu"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import useAuth from "@/hooks/useAuth"

// region Type Aliases

/**
 * Type alias for the search parameters schema.
 * @type {SearchParams}
 */
type SearchParams = { page: number }

/**
 * Type alias for the Admin component.
 * @type {AdminComponent}
 */
type AdminComponent = FC

/**
 * Type alias for the UsersTable component.
 * @type {UsersTableComponent}
 */
type UsersTableComponent = FC

// endregion

// region Main Code

/**
 * Schema for validating search parameters for users pagination.
 * @constant {z.ZodObject}
 */
const usersSearchSchema = z.object({
  /** The current page number. */
  page: z.number().int().min(1).catch(1),
})

/**
 * Number of users per page.
 * @constant {number}
 */
const PER_PAGE: number = 5

/**
 * Main Admin page component for managing users.
 * @returns {React.ReactElement} The rendered Admin component.
 */
const Admin: AdminComponent = (): React.ReactElement => {
  return (
    <main>
      <Container maxW="full">
        <Heading size="lg" pt={12}>
          Users Management
        </Heading>
        <AddUser />
        <UsersTable />
      </Container>
    </main>
  )
}

/**
 * Component for rendering a paginated table of users with actions.
 * @returns {React.ReactElement} The rendered UsersTable component.
 */
const UsersTable: UsersTableComponent = (): React.ReactElement => {
  const { user: currentUser } = useAuth()
  const navigate: ReturnType<typeof useNavigate> = useNavigate({ from: Route.fullPath })
  const { page }: SearchParams = Route.useSearch()

  const usersQueryKey: [string, { page: number }] = ["users", { page }]

  const { data, isPlaceholderData }: UseQueryResult<UsersPublic, Error> = useQuery({
    queryFn: (): CancelablePromise<UsersPublic> =>
      usersUsersRouterReadUsers({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: usersQueryKey,
    placeholderData: (prevData: UsersPublic | undefined): UsersPublic | undefined => prevData,
    staleTime: 1000 * 10,
  })

  const setPage: (page: number) => void = useCallback(
    (newPage: number): void => {
      void navigate({
        search: (prev: SearchParams): { page: number } => ({ ...prev, page: newPage }),
      })
    },
    [navigate],
  )

  useEffect((): void => {
    if (data && data.data.length === 0 && data.count > 0 && page > 1) {
      setPage(page - 1)
    }
  }, [data, page, setPage])

  const users: UserPublic[] = data?.data ?? []
  const count: number = data?.count ?? 0

  if (users.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiUsers />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>No users found</EmptyState.Title>
            <EmptyState.Description>Add a new user to get started</EmptyState.Description>
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
            <Table.ColumnHeader w="sm">Full name</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Email</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Role</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Status</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map(
            (user: UserPublic): React.ReactElement => (
              <Table.Row key={user.id} opacity={isPlaceholderData ? 0.5 : 1}>
                <Table.Cell color={!user.full_name ? "gray" : "inherit"}>
                  {user.full_name || "N/A"}
                  {currentUser?.id === user.id && (
                    <Badge ml="1" colorScheme="teal">
                      You
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell truncate maxW="sm">
                  {user.email}
                </Table.Cell>
                <Table.Cell>{user.is_superuser ? "Superuser" : "User"}</Table.Cell>
                <Table.Cell>{user.is_active ? "Active" : "Inactive"}</Table.Cell>
                <Table.Cell>
                  <UserActionsMenu user={user} disabled={currentUser?.id === user.id} />
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
          page={page}
          onPageChange={({ page: newPage }) => setPage(newPage)}
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

// endregion

// region Optional Declarations

Admin.displayName = "Admin"
UsersTable.displayName = "UsersTable"

export const Route = createFileRoute("/_layout/admin")({
  component: Admin,
  validateSearch: (search: Record<string, unknown>): SearchParams => usersSearchSchema.parse(search),
})

// endregion

// noinspection JSUnusedGlobalSymbols
export default Admin
