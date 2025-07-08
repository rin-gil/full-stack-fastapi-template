/**
 * @file This file defines the root route of the application using TanStack Router.
 * @description It sets up the main layout structure with an <Outlet> for nested routes,
 * handles the 404 page, and dynamically loads development tools for non-production environments.
 */

import { Outlet, createRootRoute } from "@tanstack/react-router"
import type { ComponentType, ReactElement } from "react"
import React, { Suspense } from "react"

import NotFound from "@/components/Common/NotFound"

/**
 * A function that dynamically imports the TanStack Router and React Query Devtools.
 * @description This lazy loading approach ensures that the development tools are only
 * fetched when needed and are not included in the production bundle.
 * It returns a promise that resolves to an object with a `default` property,
 * which is a component rendering both devtools.
 * @returns {Promise<{ default: ComponentType }>} A Promise resolving to the devtools component.
 */
const loadDevtools = (): Promise<{ default: ComponentType }> =>
  Promise.all([import("@tanstack/router-devtools"), import("@tanstack/react-query-devtools")]).then(
    ([routerDevtools, reactQueryDevtools]) => {
      return {
        default: (): ReactElement => (
          <>
            <routerDevtools.TanStackRouterDevtools />
            <reactQueryDevtools.ReactQueryDevtools />
          </>
        ),
      }
    },
  )

/**
 * A lazy-loaded component for TanStack Devtools.
 * @description In a production environment, this component is a no-op (returns null).
 * In development, it lazily loads the devtools to prevent them from blocking the initial render.
 */
const TanStackDevtools: React.ComponentType =
  process.env.NODE_ENV === "production" ? () => null : React.lazy(loadDevtools)

/**
 * The root component of the application.
 * @description It renders the main outlet for all other routes and includes the
 * lazily-loaded devtools wrapped in a Suspense component.
 * @returns {ReactElement} The main structure of the application.
 */
const RootComponent: React.FC = (): ReactElement => {
  return (
    <>
      <Outlet />
      {/* The Suspense boundary is necessary for React.lazy to work. */}
      {/* It will render a fallback (null in this case) while the devtools are loading. */}
      <Suspense>
        <TanStackDevtools />
      </Suspense>
    </>
  )
}
RootComponent.displayName = "RootComponent"

/**
 * The root route configuration for the application.
 * @description It defines the main component to render, `RootComponent`, and specifies
 * a `notFoundComponent` to handle any routes that do not match.
 */
export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
})
