// noinspection JSUnusedGlobalSymbols

/**
 * @file Global test setup for Vitest.
 * @description This file configures the global environment for all Vitest tests.
 * It mocks browser APIs not present in JSDOM (like `window.matchMedia`) and provides
 * a global, test-safe mock for the `@chakra-ui/react` library to prevent common
 * issues with CSS parsing and React Context in a Node.js test environment.
 * @module TestSetup
 */

import React, { type ComponentPropsWithoutRef, type ForwardedRef, type ReactNode } from "react"
import "@testing-library/jest-dom"
import { vi } from "vitest"

/**
 * Mocks `window.matchMedia` for the JSDOM environment.
 * This is necessary because JSDOM, the environment Vitest uses for tests, does not
 * implement this browser API. Many UI libraries, including Chakra UI, rely on it
 * to detect user preferences like OS color scheme (dark/light mode). Without this
 * mock, tests for components that use such features would fail.
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated, but added for legacy compatibility
    removeListener: vi.fn(), // Deprecated, but added for legacy compatibility
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

/**
 * Globally mocks the `@chakra-ui/react` library for all tests.
 *
 * This mock is crucial and solves three fundamental problems when testing
 * Chakra UI components in a JSDOM environment:
 * 1. Hoisting Issues: `vi.mock` is called at the top level, allowing Vitest to
 *    correctly hoist it before any imports occur.
 * 2. CSS Parsing Errors: The mock provides a simple `ChakraProvider` that does
 *    not inject any CSS, bypassing JSDOM's inability to parse modern CSS syntax
 *    like `@layer`.
 * 3. Context Errors: Components that rely on Chakra's context (like `useTheme`)
 *    are replaced with simple, "dumb" versions that do not use `useContext`,
 *    preventing "context is undefined" errors.
 */
vi.mock("@chakra-ui/react", () => ({
  ChakraProvider: ({ children }: { children: ReactNode }): React.ReactElement => <>{children}</>,
  AbsoluteCenter: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
    <div data-testid="absolute-center" {...props} />
  ),
  Span: (props: ComponentPropsWithoutRef<"span">): React.ReactElement => <span {...props} />,
  Spinner: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
    <div role="status" data-testid="spinner" {...props} />
  ),
  Button: React.forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(
    (props: ComponentPropsWithoutRef<"button">, ref: ForwardedRef<HTMLButtonElement>): React.ReactElement => (
      <button ref={ref} {...props} />
    ),
  ),
  Checkbox: {
    Root: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
      <div data-testid="checkbox-root" {...props} />
    ),
    HiddenInput: React.forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
      (props: ComponentPropsWithoutRef<"input">, ref: ForwardedRef<HTMLInputElement>): React.ReactElement => (
        <input type="checkbox" data-testid="checkbox-input" ref={ref} {...props} />
      ),
    ),
    Control: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
      <div data-testid="checkbox-control" {...props} />
    ),
    Indicator: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
      <div data-testid="checkbox-indicator" {...props} />
    ),
    // Replace <label> with <span> to remove the requirement for association with input.
    Label: (props: ComponentPropsWithoutRef<"span">): React.ReactElement => (
      <span data-testid="checkbox-label" {...props} />
    ),
  },
  // Provides a dummy function for `defineRecipe` so that imports in files
  // like `theme.tsx` do not fail, even if they are not directly used in a test.
  defineRecipe: vi.fn(() => ({})),
}))
