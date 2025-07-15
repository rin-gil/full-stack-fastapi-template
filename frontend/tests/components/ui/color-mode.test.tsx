// noinspection JSUnusedGlobalSymbols

/**
 * @file Tests for src/components/ui/color-mode.tsx
 * @description These are unit tests for the ColorMode components and hooks. They verify
 * the rendering of ColorModeProvider, functionality of useColorMode hook, ColorModeButton,
 * and ColorModeWrapper in a mocked environment.
 * @module ColorModeTests
 */

// region Imports
import {
  ColorModeButton,
  ColorModeProvider,
  ColorModeWrapper,
  type UseColorModeReturn,
  useColorMode,
} from "@/components/ui/color-mode"
import { act, render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useTheme } from "next-themes"
import type React from "react"
import { type RefObject, createRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import { describe, expect, it, vi } from "vitest"
// endregion

// region Type Aliases
interface UseThemeReturn {
  theme: string
  setTheme: Dispatch<SetStateAction<string>>
  themes: string[]
}
// endregion

// region Mocks
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }): React.ReactElement => <div>{children}</div>,
  useTheme: vi.fn(),
}))

/**
 * Mocks dependencies from `@chakra-ui/react`.
 * - The IconButton mock is updated to correctly handle the `boxSize` prop, preventing React warnings.
 */
vi.mock("@chakra-ui/react", async () => {
  const React = await import("react")
  // Correctly define types for use within the mock
  type ComponentPropsWithoutRef<T extends React.ElementType> = React.ComponentPropsWithoutRef<T>
  type ForwardedRef<T> = React.ForwardedRef<T>
  type ReactNode = React.ReactNode

  return {
    ...(await vi.importActual<typeof import("@chakra-ui/react")>("@chakra-ui/react")),
    ChakraProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    // FIX: The IconButton mock now correctly handles the `boxSize` prop to prevent warnings.
    IconButton: React.forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button"> & { boxSize?: string }>(
      ({ boxSize, ...rest }, ref: ForwardedRef<HTMLButtonElement>): React.ReactElement => (
        <button ref={ref} {...rest} />
      ),
    ),
    Span: React.forwardRef<
      HTMLSpanElement,
      ComponentPropsWithoutRef<"span"> & { colorPalette?: string; colorScheme?: string }
    >(
      ({ colorPalette, colorScheme, ...props }, ref: ForwardedRef<HTMLSpanElement>): React.ReactElement => (
        <span data-testid="span" ref={ref} {...props} />
      ),
    ),
    ClientOnly: ({ children }: { children: ReactNode; fallback?: ReactNode }): React.ReactElement => <>{children}</>,
    defineRecipe: vi.fn(() => ({})),
  }
})
// endregion

// region Tests
describe("ColorMode", (): void => {
  /**
   * Test case: Renders ColorModeProvider with children.
   * It verifies that the provider renders its children correctly.
   */
  it("renders ColorModeProvider with children", (): void => {
    render(
      <ColorModeProvider>
        <span data-testid="child">Test Child</span>
      </ColorModeProvider>,
    )
    const child: HTMLElement = screen.getByTestId("child")
    expect(child).toBeInTheDocument()
    expect(child).toHaveTextContent("Test Child")
  })

  /**
   * Test case: useColorMode hook returns correct values and toggles theme.
   * It verifies that the hook returns the current theme and toggles between light and dark.
   */
  it("useColorMode returns correct values and toggles theme", (): void => {
    let currentTheme = "light"
    const setTheme = vi.fn((newTheme: string | ((prev: string) => string)): void => {
      currentTheme = typeof newTheme === "string" ? newTheme : newTheme(currentTheme)
    })
    vi.mocked(useTheme).mockImplementation(
      (): UseThemeReturn => ({ theme: currentTheme, setTheme, themes: ["light", "dark", "system"] }),
    )

    const { result, rerender } = renderHook((): UseColorModeReturn => useColorMode(), {
      wrapper: ({ children }: { children: React.ReactNode }): React.ReactElement => (
        <ColorModeProvider>{children}</ColorModeProvider>
      ),
    })
    expect(result.current.colorMode).toBe("light")
    expect(typeof result.current.setColorMode).toBe("function")
    expect(typeof result.current.toggleColorMode).toBe("function")

    act((): void => {
      result.current.toggleColorMode()
    })
    expect(setTheme).toHaveBeenCalledWith("dark")
    rerender()
    expect(result.current.colorMode).toBe("dark")

    act((): void => {
      result.current.toggleColorMode()
    })
    expect(setTheme).toHaveBeenCalledWith("light")
    rerender()
    expect(result.current.colorMode).toBe("light")
  })

  /**
   * Test case: Renders ColorModeButton with default aria-label and icon.
   * It verifies that the button renders with the correct aria-label and icon based on the current theme.
   */
  it("renders ColorModeButton with default aria-label and icon", (): void => {
    vi.mocked(useTheme).mockReturnValue({ theme: "light", setTheme: vi.fn(), themes: ["light", "dark", "system"] })

    render(
      <ColorModeProvider>
        <ColorModeButton />
      </ColorModeProvider>,
    )
    const button: HTMLElement = screen.getByRole("button", { name: /switch to dark mode/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("aria-label", "Switch to dark mode")
    expect(button.querySelector("svg")).toBeInTheDocument()
  })

  /**
   * Test case: Renders ColorModeButton with custom aria-label.
   * It verifies that the button uses a custom aria-label when provided.
   */
  it("renders ColorModeButton with custom aria-label", (): void => {
    vi.mocked(useTheme).mockReturnValue({ theme: "light", setTheme: vi.fn(), themes: ["light", "dark", "system"] })

    render(
      <ColorModeProvider>
        <ColorModeButton aria-label="Toggle Theme" />
      </ColorModeProvider>,
    )
    const button: HTMLElement = screen.getByRole("button", { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("aria-label", "Toggle Theme")
  })

  /**
   * Test case: ColorModeButton toggles theme on click.
   * It verifies that clicking the button toggles the theme using useColorMode.
   */
  it("ColorModeButton toggles theme on click", async (): Promise<void> => {
    let currentTheme = "light"
    const setTheme = vi.fn((newTheme: string | ((prev: string) => string)) => {
      currentTheme = typeof newTheme === "string" ? newTheme : newTheme(currentTheme)
    })
    vi.mocked(useTheme).mockImplementation(
      (): UseThemeReturn => ({ theme: currentTheme, setTheme, themes: ["light", "dark", "system"] }),
    )

    render(
      <ColorModeProvider>
        <ColorModeButton />
      </ColorModeProvider>,
    )
    const button: HTMLElement = screen.getByRole("button", { name: /switch to dark mode/i })
    await act(async (): Promise<void> => {
      await userEvent.click(button)
    })
    expect(setTheme).toHaveBeenCalledWith("dark")

    render(
      <ColorModeProvider>
        <ColorModeButton />
      </ColorModeProvider>,
    )
    const updatedButton: HTMLElement = screen.getByRole("button", { name: /switch to light mode/i })
    await act(async (): Promise<void> => {
      await userEvent.click(updatedButton)
    })
    expect(setTheme).toHaveBeenCalledWith("light")
  })

  /**
   * Test case: Renders ColorModeWrapper with correct mode and props.
   * It verifies that the wrapper renders with the specified mode and additional props.
   */
  it("renders ColorModeWrapper with correct mode and props", (): void => {
    render(<ColorModeWrapper mode="dark" data-test="wrapper-prop" />)
    const wrapper: HTMLElement = screen.getByTestId("span")
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveClass("chakra-theme", "dark")
    expect(wrapper).toHaveAttribute("data-test", "wrapper-prop")
  })

  /**
   * Test case: Forwards ref to ColorModeButton.
   * It verifies that the ref is forwarded to the underlying button element.
   */
  it("forwards ref to ColorModeButton", (): void => {
    vi.mocked(useTheme).mockReturnValue({ theme: "light", setTheme: vi.fn(), themes: ["light", "dark", "system"] })

    const ref: RefObject<HTMLButtonElement> = createRef<HTMLButtonElement>()
    render(
      <ColorModeProvider>
        <ColorModeButton ref={ref} />
      </ColorModeProvider>,
    )
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  /**
   * Test case: Forwards ref to ColorModeWrapper.
   * It verifies that the ref is forwarded to the underlying span element.
   */
  it("forwards ref to ColorModeWrapper", (): void => {
    const ref: RefObject<HTMLSpanElement> = createRef<HTMLSpanElement>()
    render(<ColorModeWrapper mode="light" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })
})
// endregion
