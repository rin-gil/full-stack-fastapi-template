/**
 * @file Test setup file for Vitest.
 */

import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock `window.matchMedia` for Vitest/JSDOM environment.
// This is required by libraries like `next-themes` that check for OS color scheme.
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
