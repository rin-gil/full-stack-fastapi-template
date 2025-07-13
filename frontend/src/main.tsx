// noinspection JSUnusedGlobalSymbols

/**
 * @file Entry point for the React application.
 * @description Initializes the application with routing, query client, and custom provider.
 * @module Main
 */

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type Router, RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { ApiError } from "./client"
import { CustomProvider } from "./components/ui/provider"
import { routeTree } from "./routeTree.gen"

// region Main Code

/**
 * Configures the API client with base URL and token retrieval.
 * @returns {void}
 */
import "./apiConfig"

/**
 * Handles API errors, redirecting to log in on 401/403 errors.
 * @param error - The error object.
 * @param router - The router instance for navigation.
 * @returns {void}
 */
const handleApiError = async (error: Error, router: Router): Promise<void> => {
  if (error instanceof ApiError && [401, 403].includes(error.status)) {
    localStorage.removeItem("access_token")
    await router.navigate({ to: "/login" })
  }
}

/**
 * Creates and configures the router with the route tree.
 * @type {Router}
 */
const router: Router = createRouter({ routeTree })

/**
 * Declares the router type for TanStack Router.
 */
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

/**
 * Configures the query client with error handling and default options.
 * @type {QueryClient}
 */
const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: Error): Promise<void> => handleApiError(error, router),
  }),
  mutationCache: new MutationCache({
    onError: (error: Error): Promise<void> => handleApiError(error, router),
  }),
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
})

/**
 * Renders the application to the DOM.
 * @returns {void}
 * @throws {Error} If the root element is not found.
 */
const rootElement: HTMLElement | null = document.getElementById("root")
if (!rootElement) {
  throw new Error("Root element not found")
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <CustomProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </CustomProvider>
  </StrictMode>,
)

// endregion
