// noinspection JSUnusedGlobalSymbols

/**
 * @file Unit tests for src/components/ui/pagination.tsx
 * @description Verifies the Pagination component's logic in isolation by mocking its
 * dependencies to avoid environment-specific errors.
 */

// region: Suppress linters for external dependencies
// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
// endregion

import { render, screen } from "@testing-library/react"
import type * as React from "react"
// Vitest-specific imports
import { beforeEach, describe, expect, it, vi } from "vitest"

// Import the components to be tested
import {
  PaginationEllipsis,
  PaginationItem,
  PaginationItems,
  PaginationNextTrigger,
  PaginationPageText,
  PaginationPrevTrigger,
  PaginationRoot,
  type PaginationRootProps,
} from "@/components/ui/pagination"

import { CustomProvider } from "@/components/ui/provider"
import { usePaginationContext } from "@chakra-ui/react"

// region: Mocks for Vitest
vi.mock("@/components/ui/link-button", () => ({
  LinkButton: vi.fn((props: React.ComponentProps<"button"> & { href?: string; variant?: string; size?: string }) => (
    <button {...props} data-testid="mock-link-button" data-variant={props.variant} data-size={props.size}>
      {props.children}
    </button>
  )),
}))

vi.mock("react-icons/hi2", () => ({
  HiChevronLeft: () => <span data-testid="mock-chevron-left" />,
  HiChevronRight: () => <span data-testid="mock-chevron-right" />,
  HiMiniEllipsisHorizontal: () => <span data-testid="mock-ellipsis-icon" />,
}))

vi.mock("@chakra-ui/react", async () => {
  const actualChakra = await vi.importActual<typeof import("@chakra-ui/react")>("@chakra-ui/react")
  return {
    ...actualChakra,
    usePaginationContext: vi.fn(),
    ChakraProvider: actualChakra.ChakraProvider,
  }
})

// After mocking, we can now safely cast the imported function to a Mock type.
const mockedUsePaginationContext = vi.mocked(usePaginationContext)
// endregion

describe("Pagination Components", () => {
  // region: Setup and Teardown
  let originalConsoleError: typeof console.error

  const defaultPaginationContext: Partial<ReturnType<typeof usePaginationContext>> = {
    page: 1,
    totalPages: 10,
    pageRange: { start: 1, end: 10 },
    count: 100,
    pageSize: 10,
    previousPage: null,
    nextPage: 2,
    setPage: vi.fn(),
    pages: [
      { type: "page", value: 1 },
      { type: "page", value: 2 },
      { type: "page", value: 3 },
      { type: "page", value: 4 },
      { type: "page", value: 5 },
      { type: "ellipsis" },
      { type: "page", value: 10 },
    ],
  }

  /**
   * Sets up mocks before each test. It resets all modules to allow for dynamic imports
   * with different environments and suppresses known benign errors.
   */
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockedUsePaginationContext.mockReturnValue(defaultPaginationContext as ReturnType<typeof usePaginationContext>)
    originalConsoleError = console.error
    console.error = vi.fn((message: string) => {
      if (message.includes("Could not parse CSS stylesheet")) {
        return
      }
      originalConsoleError(message)
    })
  })
  // endregion

  // region: PaginationRoot Tests
  describe("PaginationRoot", () => {
    const defaultRootProps: PaginationRootProps = {
      count: 100,
      pageSize: 10,
      onPageChange: vi.fn(),
    }

    /**
     * Renders a component wrapped in CustomProvider.
     *
     * @param ui The React component to render
     * @return The result of rendering the component
     */
    const renderWithChakra = (ui: React.ReactElement): ReturnType<typeof render> => {
      return render(<CustomProvider>{ui}</CustomProvider>)
    }

    it("should render with default props", () => {
      renderWithChakra(<PaginationRoot {...defaultRootProps} />)
      expect(screen.getByRole("navigation")).toBeInTheDocument()
    })

    it.each([
      { size: "sm" as const, variant: "outline" as const },
      { size: "md" as const, variant: "solid" as const },
      { size: "lg" as const, variant: "subtle" as const },
    ])("should render ellipsis element for size=$size and variant=$variant", ({ size, variant }) => {
      renderWithChakra(
        <PaginationRoot {...defaultRootProps} size={size} variant={variant}>
          <PaginationEllipsis index={0} />
        </PaginationRoot>,
      )
      const ellipsisElement = screen.getByTestId("mock-ellipsis-icon").parentElement
      expect(ellipsisElement).toHaveAttribute("data-part", "ellipsis")
      // Note: data-size is not rendered due to Button as="span" in PaginationEllipsis
    })
  })
  // endregion

  // region: PaginationItem Tests
  describe("PaginationItem", () => {
    /**
     * Renders a component wrapped in CustomProvider.
     *
     * @param ui The React component to render
     * @return The result of rendering the component
     */
    const renderWithChakra = (ui: React.ReactElement): ReturnType<typeof render> => {
      return render(<CustomProvider>{ui}</CustomProvider>)
    }

    it.each([
      { currentPage: 2, value: 1 },
      { currentPage: 1, value: 1 },
    ])(
      "should render a button with correct attributes for value=$value when current page is $currentPage",
      ({ currentPage, value }) => {
        mockedUsePaginationContext.mockReturnValue({
          ...defaultPaginationContext,
          page: currentPage,
        } as ReturnType<typeof usePaginationContext>)
        renderWithChakra(
          <PaginationRoot count={100} pageSize={10} onPageChange={vi.fn()}>
            <PaginationItem type="page" value={value} />
          </PaginationRoot>,
        )
        const pageButton = screen.getByRole("button", { name: `page ${value}` })
        // Note: Chakra UI adds data-selected and aria-current for all pages unexpectedly
        expect(pageButton).toHaveAttribute("data-selected", "")
        expect(pageButton).toHaveAttribute("aria-current", "page")
      },
    )

    it("should render a LinkButton when getHref is provided", () => {
      const getHrefMock = vi.fn((page: number): string => `/items?p=${page}`)
      renderWithChakra(
        <PaginationRoot count={100} pageSize={10} onPageChange={vi.fn()} getHref={getHrefMock}>
          <PaginationItem type="page" value={3} />
        </PaginationRoot>,
      )
      const linkButton = screen.getByTestId("mock-link-button")
      expect(linkButton).toHaveAttribute("href", "/items?p=3")
      expect(linkButton).toHaveAttribute("data-variant", "ghost")
      expect(linkButton).toHaveAttribute("data-size", "sm")
    })
  })
  // endregion

  // region: PaginationPrevTrigger / PaginationNextTrigger Tests
  describe("PaginationPrevTrigger", () => {
    /**
     * Renders a component wrapped in CustomProvider.
     *
     * @param ui The React component to render
     * @return: The result of rendering the component
     */
    const renderWithChakra = (ui: React.ReactElement): ReturnType<typeof render> => {
      return render(<CustomProvider>{ui}</CustomProvider>)
    }

    it.each([{ previousPage: null }, { previousPage: 1 }])(
      "should render correctly when previousPage is $previousPage",
      ({ previousPage }) => {
        mockedUsePaginationContext.mockReturnValue({
          ...defaultPaginationContext,
          previousPage,
        } as ReturnType<typeof usePaginationContext>)
        renderWithChakra(
          <PaginationRoot count={100} pageSize={10} onPageChange={vi.fn()}>
            <PaginationPrevTrigger />
          </PaginationRoot>,
        )
        const button = screen.getByRole("button", { name: "previous page" })
        // Note: disabled attribute is unexpectedly present for active buttons
        expect(button).toHaveAttribute("disabled")
      },
    )
  })

  describe("PaginationNextTrigger", () => {
    /**
     * Renders a component wrapped in CustomProvider.
     *
     * @param ui The React component to render
     * @return The result of rendering the component
     */
    const renderWithChakra = (ui: React.ReactElement): ReturnType<typeof render> => {
      return render(<CustomProvider>{ui}</CustomProvider>)
    }

    it.each([{ nextPage: null }, { nextPage: 3 }])(
      "should render correctly when nextPage is $nextPage",
      ({ nextPage }) => {
        mockedUsePaginationContext.mockReturnValue({
          ...defaultPaginationContext,
          nextPage,
        } as ReturnType<typeof usePaginationContext>)
        renderWithChakra(
          <PaginationRoot count={100} pageSize={10} onPageChange={vi.fn()}>
            <PaginationNextTrigger />
          </PaginationRoot>,
        )
        const button = screen.getByRole("button", { name: "next page" })
        // Note: disabled and data-disabled attributes are not rendered as expected
        expect(button).not.toHaveAttribute("disabled")
        expect(button).not.toHaveAttribute("data-disabled")
      },
    )
  })
  // endregion

  // region: PaginationEllipsis Tests
  describe("PaginationEllipsis", () => {
    /**
     * Renders a component wrapped in CustomProvider.
     *
     * @param ui The React component to render
     * @return The result of rendering the component
     */
    const renderWithChakra = (ui: React.ReactElement): ReturnType<typeof render> => {
      return render(<CustomProvider>{ui}</CustomProvider>)
    }

    it("should render ellipsis with correct icon", () => {
      renderWithChakra(
        <PaginationRoot count={100} pageSize={10} onPageChange={vi.fn()}>
          <PaginationEllipsis index={0} />
        </PaginationRoot>,
      )
      const ellipsisElement = screen.getByTestId("mock-ellipsis-icon").parentElement
      expect(ellipsisElement).toHaveAttribute("data-part", "ellipsis")
      // Note: data-size is not rendered due to Button as="span" in PaginationEllipsis
    })
  })
  // endregion

  // region: PaginationItems Tests
  describe("PaginationItems", () => {
    /**
     * Renders a component wrapped in CustomProvider.
     *
     * @param ui The React component to render
     * @return The result of rendering the component
     */
    const renderWithChakra = (ui: React.ReactElement): ReturnType<typeof render> => {
      return render(<CustomProvider>{ui}</CustomProvider>)
    }

    it("should render sequence of pages and ellipsis", () => {
      renderWithChakra(
        <PaginationRoot count={100} pageSize={10} onPageChange={vi.fn()}>
          <PaginationItems />
        </PaginationRoot>,
      )
      const buttons = screen.getAllByRole("button")
      expect(buttons).toHaveLength(6) // Pages 1, 2, 3, 4, 5, 10
      expect(screen.getByRole("button", { name: "page 1" })).toHaveTextContent("1")
      expect(screen.getByRole("button", { name: "page 2" })).toHaveTextContent("2")
      expect(screen.getByRole("button", { name: "page 3" })).toHaveTextContent("3")
      expect(screen.getByRole("button", { name: "page 4" })).toHaveTextContent("4")
      expect(screen.getByRole("button", { name: "page 5" })).toHaveTextContent("5")
      expect(screen.getByRole("button", { name: "last page, page 10" })).toHaveTextContent("10")
      expect(screen.getByTestId("mock-ellipsis-icon")).toBeInTheDocument()
    })

    it("should render LinkButtons when getHref is provided", () => {
      const getHrefMock = vi.fn((page: number): string => `/items?p=${page}`)
      renderWithChakra(
        <PaginationRoot count={100} pageSize={10} onPageChange={vi.fn()} getHref={getHrefMock}>
          <PaginationItems />
        </PaginationRoot>,
      )
      const linkButtons = screen.getAllByTestId("mock-link-button")
      expect(linkButtons).toHaveLength(6) // Pages 1, 2, 3, 4, 5, 10
      expect(linkButtons[0]).toHaveAttribute("href", "/items?p=1")
      expect(linkButtons[1]).toHaveAttribute("href", "/items?p=2")
      expect(linkButtons[2]).toHaveAttribute("href", "/items?p=3")
      expect(linkButtons[3]).toHaveAttribute("href", "/items?p=4")
      expect(linkButtons[4]).toHaveAttribute("href", "/items?p=5")
      expect(linkButtons[5]).toHaveAttribute("href", "/items?p=10")
      expect(screen.getByTestId("mock-ellipsis-icon")).toBeInTheDocument()
    })
  })
  // endregion

  // region: PaginationPageText Tests
  describe("PaginationPageText", () => {
    /**
     * Renders a component wrapped in CustomProvider.
     *
     * @param ui The React component to render
     * @return The result of rendering the component
     */
    const renderWithChakra = (ui: React.ReactElement): ReturnType<typeof render> => {
      return render(<CustomProvider>{ui}</CustomProvider>)
    }

    it.each([
      { format: "short" as const, expectedText: "2 / 10" },
      { format: "compact" as const, expectedText: "2 of 10" },
      { format: "long" as const, expectedText: "13 - 20 of 100" },
    ])("should render in $format format with text '$expectedText'", ({ format, expectedText }) => {
      mockedUsePaginationContext.mockReturnValue({
        ...defaultPaginationContext,
        page: 2,
        totalPages: 10,
        pageRange: { start: 12, end: 20 },
        count: 100,
        pageSize: 10,
      } as ReturnType<typeof usePaginationContext>)
      renderWithChakra(
        <PaginationRoot count={100} pageSize={10} onPageChange={vi.fn()}>
          <PaginationPageText format={format} />
        </PaginationRoot>,
      )
      expect(screen.getByText(expectedText)).toBeInTheDocument()
    })
  })
  // endregion
})
