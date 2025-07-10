/**
 * @file Defines the root route of the application using TanStack Router.
 * @description Sets up the main layout with an Outlet for nested routes, handles 404 page,
 * and dynamically loads development tools for non-production environments.
 * @module RootRoute
 */

import { Outlet, type RootRoute, createRootRoute } from "@tanstack/react-router"
import type { FC, ReactElement } from "react"
import { Suspense, lazy } from "react"

import NotFound from "@/components/Common/NotFound"

// region Type Aliases

/**
 * Type alias for the devtools component.
 * @type {DevtoolsComponent}
 */
type DevtoolsComponent = FC

// endregion

// region Main Code

/**
 * Dynamically imports TanStack Router and React Query Devtools.
 * @description Lazy loads devtools to exclude them from production bundle. Returns a no-op
 * component in production.
 * @async
 * @returns {Promise<{ default: DevtoolsComponent }>} A Promise resolving to the devtools component.
 */
const loadDevtools = async (): Promise<{ default: DevtoolsComponent }> => {
  if (import.meta.env.MODE === "production") {
    return { default: () => null }
  }
  const [routerDevtools, reactQueryDevtools] = await Promise.all([
    import("@tanstack/router-devtools"),
    import("@tanstack/react-query-devtools"),
  ])
  return {
    default: (): ReactElement => (
      <>
        <routerDevtools.TanStackRouterDevtools />
        <reactQueryDevtools.ReactQueryDevtools />
      </>
    ),
  }
}

/**
 * Lazy-loaded component for TanStack Devtools.
 * @description Renders devtools in development, no-op in production.
 */
const TanStackDevtools: DevtoolsComponent = lazy(loadDevtools)

/**
 * Root component of the application.
 * @description Renders the main outlet for routes and lazy-loaded devtools within a Suspense boundary.
 * @returns {ReactElement} The main application structure.
 */
const RootComponent: FC = (): ReactElement => {
  return (
    <>
      <Outlet />
      <Suspense fallback={<div />}>
        <TanStackDevtools />
      </Suspense>
    </>
  )
}

// endregion

// region Optional Declarations

RootComponent.displayName = "RootComponent"

export const Route: RootRoute = createRootRoute({ component: RootComponent, notFoundComponent: NotFound })

// endregion
