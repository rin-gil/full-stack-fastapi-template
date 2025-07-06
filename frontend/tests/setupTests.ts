/**
 * @file Global test setup for Vitest.
 * @description This file configures the global environment for all Vitest tests.
 * It includes polyfills and mocks, such as mocking the `window.matchMedia` API,
 * which is required for components that interact with OS-level features like color schemes.
 */

import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock `window.matchMedia` for the JSDOM environment used by Vitest.
// This is necessary because JSDOM does not implement this browser API,
// but many UI libraries depend on it to detect the user's OS color scheme.
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
