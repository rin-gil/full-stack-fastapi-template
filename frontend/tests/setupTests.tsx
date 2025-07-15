// noinspection JSUnusedGlobalSymbols

/** @file Global test setup for Vitest.
 * @description Configures the global environment for Vitest tests by mocking browser APIs
 *              and importing essential Jest-DOM matchers.
 * @module TestSetup
 */

import "@testing-library/jest-dom"
import { vi } from "vitest"

/**
 * Mocks `window.matchMedia` for the JSDOM environment.
 * @description Necessary because JSDOM does not implement this browser API.
 */
const mockWindowMatchMedia = (): void => {
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
}

mockWindowMatchMedia()
