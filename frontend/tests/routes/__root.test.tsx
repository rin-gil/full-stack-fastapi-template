// noinspection JSUnusedGlobalSymbols

/**
 * @file Unit tests for src/routes/__root.tsx
 * @description This file tests the root route, conditional devtools loading, and 404 handling.
 * It uses dynamic imports to test behavior under different NODE_ENV conditions and suppresses
 * known benign console errors for a clean test output.
 */

// region --- Imports
import type React from "react"
import type { ReactElement } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
// endregion

// region --- Mocks
vi.mock("@tanstack/router-devtools", () => ({
  TanStackRouterDevtools: (): ReactElement => <div data-testid="router-devtools-mock" />,
}))
vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: (): ReactElement => <div data-testid="query-devtools-mock" />,
}))

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original = await importOriginal<typeof import("@tanstack/react-router")>()
  return {
    ...original,
    Outlet: (): ReactElement => <div data-testid="outlet-mock" />,
    Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }): ReactElement => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }
})

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
// endregion

describe("Root Route and Component", () => {
  let originalConsoleError: typeof console.error

  /**
   * @description Sets up mocks before each test. It resets all modules to allow for
   * dynamic imports with different environments and suppresses known benign errors.
   */
  beforeEach(() => {
    vi.resetModules()
    originalConsoleError = console.error
    console.error = vi.fn((message: string) => {
      if (message.includes("Could not parse CSS stylesheet")) {
        return
      }
      originalConsoleError(message)
    })
  })

  /**
   * @description Cleans up and restores mocks after each test.
   */
  afterEach(() => {
    console.error = originalConsoleError
    vi.unstubAllEnvs()
  })

  // region --- Devtools Loading Logic
  describe("TanStackDevtools Loading Logic", () => {
    it("should render devtools in development mode", async () => {
      // Arrange
      vi.stubEnv("NODE_ENV", "development")
      const { render, screen } = await import("../test-utils")
      const { Route } = await import("@/routes/__root")
      const RootComponent = Route.options.component!

      // Act
      render(<RootComponent />)

      // Assert
      expect(screen.getByTestId("outlet-mock")).toBeInTheDocument()
      expect(await screen.findByTestId("router-devtools-mock")).toBeInTheDocument()
      expect(await screen.findByTestId("query-devtools-mock")).toBeInTheDocument()
    })

    it("should not render devtools in production mode", async () => {
      // Arrange
      vi.stubEnv("NODE_ENV", "production")
      const { render, screen } = await import("../test-utils")
      const { Route } = await import("@/routes/__root")
      const RootComponent = Route.options.component!

      // Act
      render(<RootComponent />)

      // Assert
      expect(screen.getByTestId("outlet-mock")).toBeInTheDocument()
      expect(screen.queryByTestId("router-devtools-mock")).not.toBeInTheDocument()
      expect(screen.queryByTestId("query-devtools-mock")).not.toBeInTheDocument()
    })
  })
  // endregion

  // region --- Route Not Found Logic
  describe("Route Not Found Logic", () => {
    it("should render the NotFound component when using the notFoundComponent property", async () => {
      // Arrange
      const { render, screen } = await import("../test-utils")
      const { Route } = await import("@/routes/__root")
      const NotFoundComponent = Route.options.notFoundComponent!

      // Act
      render(<NotFoundComponent data={undefined} />)

      // Assert
      expect(screen.getByTestId("not-found")).toBeInTheDocument()
    })
  })
  // endregion
})
