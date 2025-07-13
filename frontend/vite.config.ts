/**
 * @file Vite and Vitest configuration.
 * @description This file configures the Vite build tool and the Vitest test runner.
 * It defines path aliases, plugins (React, TanStack Router), and test environment
 * settings like globals, setup files, and code coverage rules. The configurations
 * are merged to create a unified setup for development, production, and testing.
 */

import path from "node:path"
import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { type UserConfig, defineConfig, mergeConfig } from "vite"
import { configDefaults, defineConfig as defineVitestConfig } from "vitest/config"

/**
 * Base Vite configuration for development and production builds.
 */
const viteConfig: UserConfig = defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  plugins: [react(), TanStackRouterVite()],
  // Production build configuration
  build: { minify: true },
})

/**
 * Vitest-specific configuration for the test environment.
 */
const vitestConfig: UserConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setupTests.tsx",
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    server: { deps: { inline: [/@chakra-ui\/.*/, /@emotion\/.*/] } },
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

/**
 * The final, merged configuration object.
 * It combines the base `viteConfig` with the `vitestConfig` to provide a
 * unified setup for both the development/build server and the test runner.
 */
export default mergeConfig(viteConfig, vitestConfig)
