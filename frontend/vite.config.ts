/**
 * @file Vite and Vitest configuration file for the frontend.
 * This file sets up:
 * - Path aliases for easier imports (`@` mapping to `src`).
 * - Vite plugins for React (SWC) and TanStack Router.
 * - Vitest specific testing configurations, including:
 *   - Global variables and JSDOM environment.
 *   - Test file inclusion patterns.
 *   - Coverage reporting settings for `src/utils.ts`.
 * The configurations are merged to ensure both development/build and test environments are correctly set up.
 */

import path from "node:path"
import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { defineConfig, mergeConfig } from "vite"
import {
  configDefaults,
  defineConfig as defineVitestConfig,
} from "vitest/config"

// Defining the basic configuration of Vite
const viteConfig = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react(), TanStackRouterVite()],
  // Production build configuration
  build: {
    minify: true,
  },
})

// Defining the configuration for tests
const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setupTests.ts",
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    // REFACTOR: Use the new, correct configuration key `server.deps.inline`
    // as recommended by the Vitest deprecation warning. This resolves the
    // "Could not parse CSS" errors by forcing Vitest to transform these libraries.
    server: {
      deps: {
        inline: [/@chakra-ui\/.*/, /@emotion\/.*/],
      },
    },
    coverage: {
      ...configDefaults.coverage,
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        ...configDefaults.coverage.exclude,
        "src/client",
        "src/routeTree.gen.ts",
        "src/main.tsx",
        "src/theme.ts",
        "src/theme/**/*.{ts,tsx}",
      ],
    },
  },
})

// Combining configurations
export default mergeConfig(viteConfig, vitestConfig)
