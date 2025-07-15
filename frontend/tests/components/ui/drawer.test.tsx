/**
 * @file Unit tests for src/components/ui/drawer.tsx
 * @description Tests rendering and interaction of Drawer components (Root, Trigger, Content, CloseTrigger, etc.).
 * @module DrawerTests
 */

// region Imports
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
import React, { type ReactElement } from "react"
import { describe, expect, it, vi } from "vitest"
// endregion

// region Mocks
vi.mock("@chakra-ui/react", async () => {
  const React = await import("react")
  const { useState, createContext, useContext } = React

  // region Type Aliases (Copied EXACTLY from original TestSetup)
  type ComponentPropsWithoutRef<T extends React.ElementType> = React.ComponentPropsWithoutRef<T>
  type ReactNode = React.ReactNode
  type ForwardedRef<T> = React.ForwardedRef<T>

  type DialogRootProps = {
    children: ReactNode
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (details: { open: boolean }) => void
  } & ComponentPropsWithoutRef<"div">
  type DrawerRootProps = DialogRootProps

  type DialogCloseTriggerProps = {
    children?: ReactNode
    asChild?: boolean
    insetEnd?: string
    top?: string
    position?: string
    ref?: ForwardedRef<HTMLButtonElement>
  } & ComponentPropsWithoutRef<"button">
  type DrawerCloseTriggerProps = DialogCloseTriggerProps & { isClosable?: boolean }

  type DialogTriggerProps = {
    children: ReactNode
    isOpen?: boolean
    onOpen?: () => void
  } & ComponentPropsWithoutRef<"button">
  type DrawerTriggerProps = DialogTriggerProps

  type DialogContentProps = {
    children: ReactNode
    portalled?: boolean
    backdrop?: boolean
    ref?: ForwardedRef<HTMLDivElement>
  } & ComponentPropsWithoutRef<"div">
  type DrawerContentProps = DialogContentProps

  type CloseButtonProps = { children?: ReactNode } & ComponentPropsWithoutRef<"button">
  type DialogContextType = { onClose: () => void; isOpen: boolean }
  interface RefElement extends React.ReactElement {
    ref?: ForwardedRef<HTMLButtonElement>
  }
  // endregion

  const DialogContext = createContext<DialogContextType | undefined>(undefined)
  const ThemeContext = createContext({ theme: { _config: {} } })

  // region Mock Components (Copied EXACTLY from original TestSetup)
  const MockCloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(({ children, ...props }, ref) => (
    <button ref={ref} data-testid="close-button" {...props}>
      {children}
    </button>
  ))

  const MockDrawerCloseTrigger = React.forwardRef<HTMLButtonElement, DrawerCloseTriggerProps>(
    ({ children, asChild, insetEnd, top, position, isClosable = true, ...props }, ref) => {
      const context = useContext(DialogContext)
      const buttonProps = {
        ...props,
        position,
        top,
        insetend: insetEnd,
        "data-testid": isClosable ? "close-button" : undefined,
      }

      if (!isClosable) return <></>

      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
          ...buttonProps,
          // @ts-ignore
          ref,
          onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (children.props.onClick) children.props.onClick(e)
            if (!e.defaultPrevented) context?.onClose?.()
          },
        })
      }
      if (!children) return <></>
      return (
        <MockCloseButton
          ref={ref}
          onClick={(e) => {
            if (!e.defaultPrevented) context?.onClose?.()
          }}
          {...buttonProps}
        >
          {children}
        </MockCloseButton>
      )
    },
  )
  // endregion

  return {
    ...(await vi.importActual<typeof import("@chakra-ui/react")>("@chakra-ui/react")),
    ChakraProvider: ({ children }: { children: ReactNode }): React.ReactElement => (
      <ThemeContext.Provider value={{ theme: { _config: {} } }}>{children}</ThemeContext.Provider>
    ),
    Portal: ({ children, disabled }: { children: ReactNode; disabled?: boolean }): React.ReactElement =>
      disabled ? <>{children}</> : <div data-testid="portal">{children}</div>,
    // NOTE: IconButton is mocked because custom CloseButton depends on it.
    IconButton: React.forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(
      (props, ref): React.ReactElement => <button data-testid="icon-button" ref={ref} {...props} />,
    ),
    defineRecipe: vi.fn(() => ({})),
    Drawer: {
      Root: ({ children, defaultOpen, open, onOpenChange, ...props }: DrawerRootProps) => {
        const [isOpen, setIsOpen] = useState(defaultOpen ?? open ?? false)
        const isControlled = open !== undefined
        const effectiveOpen = isControlled ? open : isOpen
        const handleOpenChange = (newOpen: boolean) => {
          if (!isControlled) setIsOpen(newOpen)
          onOpenChange?.({ open: newOpen })
        }
        return (
          <div data-testid="drawer-root" {...props}>
            <DialogContext.Provider value={{ onClose: () => handleOpenChange(false), isOpen: effectiveOpen }}>
              {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child
                const childType =
                  typeof child.type !== "string" && "displayName" in child.type ? child.type.displayName : undefined
                if (childType === "DrawerTrigger") {
                  return React.cloneElement(child as React.ReactElement<DrawerTriggerProps>, {
                    isOpen: effectiveOpen,
                    onOpen: () => handleOpenChange(true),
                  })
                }
                if (childType === "DrawerCloseTrigger") {
                  const closeTriggerChild = child as RefElement & { props: DrawerCloseTriggerProps }
                  return React.cloneElement(closeTriggerChild, {
                    ...closeTriggerChild.props,
                    asChild: true,
                    isClosable: closeTriggerChild.props.isClosable,
                  })
                }
                if (childType === "DrawerContent" && !effectiveOpen) return null
                return child
              })}
            </DialogContext.Provider>
          </div>
        )
      },
      Trigger: ({ children, isOpen, onOpen, ...props }: DrawerTriggerProps) => (
        <button data-testid="drawer-trigger" onClick={() => !isOpen && onOpen?.()} {...props}>
          {children}
        </button>
      ),
      Positioner: ({ children, padding }: { children: ReactNode; padding?: string }) => (
        <div data-testid="drawer-positioner" style={{ padding }}>
          {children}
        </div>
      ),
      Backdrop: (props: ComponentPropsWithoutRef<"div">) => <div data-testid="drawer-backdrop" {...props} />,
      Content: React.forwardRef<HTMLDivElement, DrawerContentProps & { offset?: string }>(
        ({ portalled, offset, ...props }, ref) => <div data-testid="drawer-content" ref={ref} {...props} />,
      ),
      CloseTrigger: MockDrawerCloseTrigger,
      Footer: (props: ComponentPropsWithoutRef<"div">) => <div data-testid="drawer-footer" {...props} />,
      Header: (props: ComponentPropsWithoutRef<"div">) => <div data-testid="drawer-header" {...props} />,
      Body: (props: ComponentPropsWithoutRef<"div">) => <div data-testid="drawer-body" {...props} />,
      Title: (props: ComponentPropsWithoutRef<"h2">) => <h2 data-testid="drawer-title" {...props} />,
      Description: (props: ComponentPropsWithoutRef<"p">) => <p data-testid="drawer-description" {...props} />,
      ActionTrigger: (props: ComponentPropsWithoutRef<"button">) => (
        <button data-testid="drawer-action-trigger" {...props} />
      ),
    },
  }
})
// endregion

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
