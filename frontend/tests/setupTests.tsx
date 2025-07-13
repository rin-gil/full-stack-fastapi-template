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
 * @description Necessary because JSDOM does not implement this browser API.
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

/**
 * Globally mocks the `@chakra-ui/react` library for all tests.
 * @description Provides mocks to avoid CSS parsing and context errors in JSDOM.
 */
vi.mock("@chakra-ui/react", () => ({
  ChakraProvider: ({ children }: { children: ReactNode }): React.ReactElement => <>{children}</>,
  AbsoluteCenter: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
    <div data-testid="absolute-center" {...props} />
  ),
  Span: React.forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(
    (
      {
        colorPalette,
        colorScheme,
        ...props
      }: ComponentPropsWithoutRef<"span"> & { colorPalette?: string; colorScheme?: string },
      ref: ForwardedRef<HTMLSpanElement>,
    ): React.ReactElement => <span data-testid="span" ref={ref} {...props} />,
  ),
  Spinner: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
    <div role="status" data-testid="spinner" {...props} />
  ),
  Button: React.forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(
    (props: ComponentPropsWithoutRef<"button">, ref: ForwardedRef<HTMLButtonElement>): React.ReactElement => (
      <button ref={ref} {...props} />
    ),
  ),
  IconButton: React.forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(
    (
      { boxSize, ...props }: ComponentPropsWithoutRef<"button"> & { boxSize?: string },
      ref: ForwardedRef<HTMLButtonElement>,
    ): React.ReactElement => <button data-testid="icon-button" ref={ref} data-box-size={boxSize} {...props} />,
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
  ClientOnly: ({ children }: { children: ReactNode; fallback?: ReactNode }): React.ReactElement => <>{children}</>,
  Skeleton: ({ boxSize, ...props }: ComponentPropsWithoutRef<"div"> & { boxSize?: string }): React.ReactElement => (
    <div data-testid="skeleton" data-box-size={boxSize} {...props} />
  ),
  defineRecipe: vi.fn(() => ({})),
}))
