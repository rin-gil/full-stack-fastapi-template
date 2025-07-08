// noinspection JSUnusedGlobalSymbols

/**
 * @file Unit tests for src/routes/_layout.tsx
 * @description This file contains tests for the Layout component rendering and
 * the route's beforeLoad logic. It employs robust mocking strategies and
 * suppresses known, benign console errors for a cleaner test output.
 */

import type * as React from "react"
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "../test-utils"

import { isLoggedIn } from "@/hooks/useAuth"
import { Route } from "@/routes/_layout"

// region Mocks
/**
 * Mocking 'next-themes' to prevent it from running in JSDOM.
 * Its logic, which relies on browser APIs like `matchMedia`, causes errors in the test environment.
 * We replace ThemeProvider with a simple component that just renders its children.
 */
vi.mock("next-themes", () => ({ ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))

/**
 * Mocking the authentication hook to control the user's login state for tests.
 * This allows us to simulate both authenticated and unauthenticated scenarios.
 */
vi.mock("@/hooks/useAuth", () => ({ isLoggedIn: vi.fn() }))

/**
 * Mocking common UI components to isolate the layout.
 * These are replaced with simple placeholders (divs with test-ids) to verify they are rendered,
 * without testing their internal implementation.
 */
vi.mock("@/components/Common/Navbar", () => ({ default: () => <div data-testid="navbar-mock" /> }))

vi.mock("@/components/Common/Sidebar", () => ({ default: () => <div data-testid="sidebar-mock" /> }))

/**
 * Mocking TanStack Router's `Outlet` component.
 * This allows us to confirm that the layout provides a space for child routes to be rendered.
 * Other exports from the library are kept as original.
 */
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original = await importOriginal<typeof import("@tanstack/react-router")>()
  return { ...original, Outlet: () => <div data-testid="outlet-mock" /> }
})
// endregion

/**
 * @description Test suite for the main authenticated layout and its associated route logic.
 */
describe("Authenticated Layout and Route", () => {
  /**
   * @description Resets all mocks before each test to ensure a clean state and prevent test pollution.
   */
  beforeEach(() => {
    vi.resetAllMocks()
  })
  // region Tests

  /**
   * @description Test suite for the rendering and structure of the Layout component itself.
   */
  describe("Layout Component", () => {
    /** @type {typeof console.error} Stores the original 'console.error' function to be restored after tests. */
    let originalConsoleError: typeof console.error

    /**
     * @description Suppresses a known, benign 'Could not parse CSS stylesheet' error from JSDOM
     * before each test in this suite. This keeps the test output clean.
     */
    beforeEach(() => {
      originalConsoleError = console.error
      console.error = vi.fn((message: string) => {
        if (message.includes("Could not parse CSS stylesheet")) {
          return
        }
        originalConsoleError(message)
      })
    })

    /**
     * @description Restores the original 'console.error' function after each test to avoid side effects.
     */
    afterEach(() => {
      console.error = originalConsoleError
    })

    /**
     * @description Verifies that the layout correctly renders its essential child components.
     */
    it("should render Navbar, Sidebar, and Outlet correctly", () => {
      const LayoutComponent: React.FC = Route.options.component!
      render(<LayoutComponent />)
      expect(screen.getByTestId("navbar-mock")).toBeInTheDocument()
      expect(screen.getByTestId("sidebar-mock")).toBeInTheDocument()
      expect(screen.getByTestId("outlet-mock")).toBeInTheDocument()
    })

    /**
     * @description Checks for the semantic 'main' tag to ensure accessibility standards are met.
     */
    it("should render the main content area with a 'main' role for accessibility", () => {
      const LayoutComponent: React.FC = Route.options.component!
      render(<LayoutComponent />)
      expect(screen.getByRole("main")).toBeInTheDocument()
    })
  })

  /**
   * @description Test suite for the route's `beforeLoad` guard logic.
   */
  describe("Route.beforeLoad", () => {
    /**
     * @description Tests the route guard's failure case where an unauthenticated user is redirected.
     */
    it("should throw a redirect to /login if the user is not logged in", () => {
      // Arrange: Simulate a logged-out user.
      ;(isLoggedIn as Mock).mockReturnValue(false)
      const beforeLoad = Route.options.beforeLoad
      // Act & Assert: Use a try/catch block to reliably inspect the thrown error.
      try {
        // Pass a dummy object to satisfy the function's type signature.
        beforeLoad?.({} as any)
        // If it doesn't throw, the test must fail.
        expect.fail("beforeLoad should have thrown a redirect error but did not.")
      } catch (error: any) {
        expect(error.isRedirect).toBe(true)
        expect(error.to).toBe("/login")
      }
      expect(isLoggedIn).toHaveBeenCalledOnce()
    })

    /**
     * @description Tests the route guard's success case where an authenticated user is allowed access.
     */
    it("should not throw and should return undefined if the user is logged in", () => {
      // Arrange: Simulate a logged-in user.
      ;(isLoggedIn as Mock).mockReturnValue(true)
      const action = () => Route.options.beforeLoad?.({} as any)
      let result: unknown
      // Act & Assert: Call the action once and verify it does not throw.
      expect(() => {
        result = action()
      }).not.toThrow()
      // Assert the outcome.
      expect(result).toBeUndefined()
      expect(isLoggedIn).toHaveBeenCalledOnce()
    })
  })
  // endregion
})
