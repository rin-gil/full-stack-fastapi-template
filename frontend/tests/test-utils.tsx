/**
 * @file Test utilities for rendering components with necessary providers.
 * @description This file exports a custom `render` function that automatically wraps
 * components in the application's `CustomProvider`, ensuring a consistent
 * test environment.
 */

import type { RenderOptions, RenderResult } from "@testing-library/react"
import { render as testingLibraryRender } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"

import { CustomProvider } from "@/components/ui/provider"

/**
 * An internal component that wraps children in all necessary application providers.
 *
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The React elements to be wrapped.
 * @returns {ReactElement} The children wrapped in `CustomProvider`.
 */
const AllTheProviders = ({
  children,
}: { children: ReactNode }): ReactElement => {
  return <CustomProvider>{children}</CustomProvider>
}

/**
 * A custom render function that wraps a UI component with application providers.
 * This ensures components are tested in a realistic, consistent environment.
 *
 * @param {ReactElement} ui - The React element to render.
 * @param {Omit<RenderOptions, "wrapper">} [options] - Optional configuration for the render, excluding the `wrapper` property.
 * @returns {RenderResult} The result of rendering the UI, providing access to query functions.
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult =>
  testingLibraryRender(ui, { wrapper: AllTheProviders, ...options })

// Re-export all of `@testing-library/react` for convenience in test files.
export * from "@testing-library/react"
// Override the original `render` with our custom one.
// noinspection JSUnusedGlobalSymbols
export { customRender as render }
