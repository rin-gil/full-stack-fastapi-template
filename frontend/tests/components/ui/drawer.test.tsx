/**
 * @file Unit tests for src/components/ui/drawer.tsx
 * @description Tests rendering and interaction of Drawer components (Root, Trigger, Content, CloseTrigger, etc.).
 * @module DrawerTests
 */

import {
  DrawerActionTrigger,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { RenderOptions, RenderResult } from "@testing-library/react"
import type { ReactElement } from "react"
import { describe, expect, it } from "vitest"

// region Main Code

/**
 * Renders a component with the custom render function from testUtils.
 * @param ui - The React element to render.
 * @param options - Optional render options.
 * @returns The render result.
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult => render(ui, options)

/**
 * Test suite for Drawer components.
 */
describe("Drawer Module", () => {
  /**
   * Tests for DrawerRoot and DrawerTrigger components.
   */
  describe("DrawerRoot and DrawerTrigger", (): void => {
    it("should render DrawerTrigger and open Drawer on click", async (): Promise<void> => {
      customRender(
        <DrawerRoot>
          <DrawerTrigger data-testid="drawer-trigger">Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>Header</DrawerHeader>
            <DrawerBody>Body</DrawerBody>
          </DrawerContent>
        </DrawerRoot>,
      )

      await waitFor((): void => expect(screen.getByTestId("drawer-trigger")).toBeInTheDocument())
      expect(screen.queryByTestId("drawer-content")).not.toBeInTheDocument()

      fireEvent.click(screen.getByTestId("drawer-trigger"))
      await waitFor(() => expect(screen.getByTestId("drawer-content")).toBeInTheDocument())
      expect(screen.getByText("Header")).toBeInTheDocument()
      expect(screen.getByText("Body")).toBeInTheDocument()
    })
  })

  /**
   * Tests for DrawerContent component.
   */
  describe("DrawerContent", () => {
    it("should render content with portal when portalled is true", async (): Promise<void> => {
      customRender(
        <DrawerRoot defaultOpen>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent portalled data-testid="drawer-content">
            <DrawerBody>Content</DrawerBody>
          </DrawerContent>
        </DrawerRoot>,
      )

      await waitFor((): void => expect(screen.getByTestId("drawer-content")).toBeInTheDocument())
      expect(screen.getByTestId("portal")).toBeInTheDocument()
      expect(screen.getByText("Content")).toBeInTheDocument()
    })

    it("should render content without portal when portalled is false", async (): Promise<void> => {
      customRender(
        <DrawerRoot defaultOpen>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent portalled={false} data-testid="drawer-content">
            <DrawerBody>Content</DrawerBody>
          </DrawerContent>
        </DrawerRoot>,
      )

      await waitFor((): void => expect(screen.getByTestId("drawer-content")).toBeInTheDocument())
      expect(screen.queryByTestId("portal")).not.toBeInTheDocument()
      expect(screen.getByText("Content")).toBeInTheDocument()
    })

    it("should apply offset to positioner", async (): Promise<void> => {
      customRender(
        <DrawerRoot defaultOpen>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent offset="16px" data-testid="drawer-content">
            <DrawerBody>Content</DrawerBody>
          </DrawerContent>
        </DrawerRoot>,
      )

      await waitFor((): void => expect(screen.getByTestId("drawer-positioner")).toHaveStyle({ padding: "16px" }))
    })
  })

  /**
   * Tests for DrawerCloseTrigger component.
   */
  describe("DrawerCloseTrigger", (): void => {
    it("should render close button and close drawer on click", async (): Promise<void> => {
      customRender(
        <DrawerRoot defaultOpen>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerCloseTrigger data-testid="close-button" />
            <DrawerBody>Content</DrawerBody>
          </DrawerContent>
        </DrawerRoot>,
      )

      await waitFor((): void => expect(screen.getByTestId("close-button")).toBeInTheDocument())
      expect(screen.getByTestId("drawer-content")).toBeInTheDocument()

      fireEvent.click(screen.getByTestId("close-button"))
      await waitFor((): void => expect(screen.queryByTestId("drawer-content")).not.toBeInTheDocument())
    })

    it("should not render close button when isClosable is false", async (): Promise<void> => {
      customRender(
        <DrawerRoot defaultOpen>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerCloseTrigger isClosable={false} />
            <DrawerBody>Content</DrawerBody>
          </DrawerContent>
        </DrawerRoot>,
      )

      await waitFor((): void => expect(screen.getByTestId("drawer-content")).toBeInTheDocument())
      expect(screen.queryByTestId("close-button")).not.toBeInTheDocument()
    })
  })

  /**
   * Tests for DrawerHeader, DrawerBody, DrawerFooter, DrawerTitle, DrawerDescription, DrawerActionTrigger, and DrawerBackdrop components.
   */
  describe("Drawer Subcomponents", (): void => {
    it("should render header, body, footer, title, description, action trigger, and backdrop", async (): Promise<void> => {
      customRender(
        <DrawerRoot defaultOpen>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader data-testid="drawer-header">Header</DrawerHeader>
            <DrawerTitle data-testid="drawer-title">Title</DrawerTitle>
            <DrawerDescription data-testid="drawer-description">Description</DrawerDescription>
            <DrawerBody data-testid="drawer-body">Body</DrawerBody>
            <DrawerFooter data-testid="drawer-footer">Footer</DrawerFooter>
            <DrawerActionTrigger data-testid="drawer-action-trigger">Action</DrawerActionTrigger>
            <DrawerBackdrop data-testid="drawer-backdrop" />
          </DrawerContent>
        </DrawerRoot>,
      )

      await waitFor((): void => {
        expect(screen.getByTestId("drawer-header")).toBeInTheDocument()
        expect(screen.getByTestId("drawer-title")).toBeInTheDocument()
        expect(screen.getByTestId("drawer-description")).toBeInTheDocument()
        expect(screen.getByTestId("drawer-body")).toBeInTheDocument()
        expect(screen.getByTestId("drawer-footer")).toBeInTheDocument()
        expect(screen.getByTestId("drawer-action-trigger")).toBeInTheDocument()
        expect(screen.getByTestId("drawer-backdrop")).toBeInTheDocument()
      })
    })
  })
})

// endregion
