/**
 * @file Test utilities for rendering components with necessary providers.
 * @description This file exports a custom `render` function that automatically wraps
 * components in the application's `CustomProvider`, ensuring a consistent
 * test environment.
 */

import type { RenderOptions } from "@testing-library/react"
import { render as testingLibraryRender } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"

import { CustomProvider } from "@/components/ui/provider"

/**
 * A React component that wraps the provided children in the application's
 * `CustomProvider`, to ensure that the component is rendered with the necessary
 * context providers for a consistent test environment.
 *
 * @param children - The React elements to render.
 * @returns The wrapped React elements.
 */
const AllTheProviders = ({
  children,
}: { children: ReactNode }): ReactElement => {
  return <CustomProvider>{children}</CustomProvider>
}

/**
 * A custom render function for testing React components.
 *
 * This function wraps the provided UI element with the application's
 * `CustomProvider`, ensuring that the component is rendered within the
 * necessary context providers for a consistent test environment.
 *
 * @param ui - The React element to render.
 * @param options - Optional configuration for the render, excluding the `wrapper`.
 * @returns The result of rendering the UI with the specified options.
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => testingLibraryRender(ui, { wrapper: AllTheProviders, ...options })

export * from "@testing-library/react"
// noinspection JSUnusedGlobalSymbols
export { customRender as render }
