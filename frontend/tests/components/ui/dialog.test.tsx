/**
 * @file Tests for src/components/ui/dialog.tsx
 * @description Unit tests for Dialog components, verifying rendering, functionality,
 * and behavior of DialogRoot, DialogTrigger, DialogContent, DialogCloseTrigger,
 * DialogFooter, DialogHeader, DialogBody, DialogTitle, DialogDescription,
 * and DialogActionTrigger in a mocked environment.
 * @module DialogTests
 */

// region Imports
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ChakraProvider } from "@chakra-ui/react"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type React from "react"
import { type ForwardedRef, type ReactNode, type RefObject, createRef, useState } from "react"
import { describe, expect, it } from "vitest"

// endregion

// region Type Aliases

/** Props for DialogContent with ref */
type DialogContentProps = {
  children?: ReactNode
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement>
  backdrop?: boolean
} & React.ComponentPropsWithoutRef<"div">

/** Props for DialogCloseTrigger with ref */
type DialogCloseTriggerProps = {
  children?: ReactNode
  asChild?: boolean
  insetEnd?: string
  top?: string
  position?: string
} & React.ComponentPropsWithoutRef<"button">

// endregion

// region Tests
describe("Dialog", (): void => {
  /**
   * Wrapper component to provide ChakraProvider for tests.
   * @param {ReactNode} children - Child components to render.
   * @returns {React.ReactElement} The wrapped component.
   */
  const Wrapper = ({ children }: { children: ReactNode }): React.ReactElement => (
    // @ts-ignore
    <ChakraProvider value={{ theme: { _config: {} } }}>{children}</ChakraProvider>
  )

  /**
   * Test case: Renders DialogRoot with children.
   * It verifies that DialogRoot renders its children correctly.
   */
  it("renders DialogRoot with children", (): void => {
    render(
      <Wrapper>
        <DialogRoot>
          <span data-testid="child">Test Child</span>
        </DialogRoot>
      </Wrapper>,
    )
    const child: HTMLElement = screen.getByTestId("child")
    expect(child).toBeInTheDocument()
    expect(child).toHaveTextContent("Test Child")
  })

  /**
   * Test case: Renders DialogTrigger.
   * It verifies that DialogTrigger renders as a button with correct props.
   */
  it("renders DialogTrigger", (): void => {
    render(
      <Wrapper>
        <DialogRoot>
          <DialogTrigger data-testid="trigger">Open Dialog</DialogTrigger>
        </DialogRoot>
      </Wrapper>,
    )
    const trigger: HTMLElement = screen.getByTestId("trigger")
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveTextContent("Open Dialog")
  })

  /**
   * Test case: Renders DialogContent with portal and backdrop.
   * It verifies that DialogContent renders with Portal, Backdrop, and Positioner.
   */
  it("renders DialogContent with portal and backdrop", (): void => {
    render(
      <Wrapper>
        <DialogRoot open>
          <DialogContent data-testid="content">
            <span>Test Content</span>
          </DialogContent>
        </DialogRoot>
      </Wrapper>,
    )
    const portal: HTMLElement = screen.getByTestId("portal")
    const content: HTMLElement = screen.getByTestId("content")
    const backdrop: HTMLElement = screen.getByTestId("dialog-backdrop")
    expect(portal).toBeInTheDocument()
    expect(content).toBeInTheDocument()
    expect(content).toHaveTextContent("Test Content")
    expect(backdrop).toBeInTheDocument()
  })

  /**
   * Test case: Renders DialogContent without portal.
   * It verifies that DialogContent renders without Portal when portalled is false.
   */
  it("renders DialogContent without portal", (): void => {
    render(
      <Wrapper>
        <DialogRoot open>
          <DialogContent portalled={false} data-testid="content">
            <span>Test Content</span>
          </DialogContent>
        </DialogRoot>
      </Wrapper>,
    )
    const content: HTMLElement = screen.getByTestId("content")
    expect(content).toBeInTheDocument()
    expect(content).toHaveTextContent("Test Content")
    expect(screen.queryByTestId("portal")).not.toBeInTheDocument()
  })

  /**
   * Test case: Renders DialogContent without backdrop.
   * It verifies that DialogContent renders without Backdrop when backdrop is false.
   */
  it("renders DialogContent without backdrop", (): void => {
    render(
      <Wrapper>
        <DialogRoot open>
          <DialogContent backdrop={false} data-testid="content">
            <span>Test Content</span>
          </DialogContent>
        </DialogRoot>
      </Wrapper>,
    )
    const content: HTMLElement = screen.getByTestId("content")
    expect(content).toBeInTheDocument()
    expect(content).toHaveTextContent("Test Content")
    expect(screen.queryByTestId("dialog-backdrop")).not.toBeInTheDocument()
  })

  /**
   * Test case: Forwards ref to DialogContent.
   * It verifies that the ref is forwarded to the underlying content element.
   */
  it("forwards ref to DialogContent", (): void => {
    const ref: RefObject<HTMLDivElement> = createRef<HTMLDivElement>()

    render(
      <Wrapper>
        <DialogRoot open>
          <DialogContent
            // @ts-ignore
            ref={ref as ForwardedRef<HTMLDivElement>}
            {...({} as DialogContentProps)}
          />
        </DialogRoot>
      </Wrapper>,
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  /**
   * Test case: Renders DialogCloseTrigger with CloseButton.
   * It verifies that DialogCloseTrigger renders with CloseButton and correct props.
   */
  it("renders DialogCloseTrigger with CloseButton", (): void => {
    render(
      <Wrapper>
        <DialogRoot open>
          <DialogCloseTrigger data-testid="close-trigger">Close</DialogCloseTrigger>
        </DialogRoot>
      </Wrapper>,
    )
    const closeButton: HTMLElement = screen.getByTestId("close-button")
    expect(closeButton).toBeInTheDocument()
    expect(closeButton).toHaveTextContent("Close")
  })

  /**
   * Test case: Forwards ref to DialogCloseTrigger.
   * It verifies that the ref is forwarded to the underlying button element.
   */
  it("forwards ref to DialogCloseTrigger", (): void => {
    const ref: RefObject<HTMLButtonElement> = createRef<HTMLButtonElement>()
    render(
      <Wrapper>
        <DialogRoot open>
          <DialogCloseTrigger
            // @ts-ignore
            ref={ref as ForwardedRef<HTMLButtonElement>}
            {...({} as DialogCloseTriggerProps)}
          />
        </DialogRoot>
      </Wrapper>,
    )
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  /**
   * Test case: DialogCloseTrigger closes dialog on click.
   * It verifies that clicking DialogCloseTrigger closes the dialog.
   */
  it("DialogCloseTrigger closes dialog on click", async (): Promise<void> => {
    const TestComponent = (): React.ReactElement => {
      const [isOpen, setIsOpen] = useState(true)
      return (
        <Wrapper>
          <DialogRoot open={isOpen} onOpenChange={(details) => setIsOpen(details.open)}>
            <DialogContent data-testid="content">
              <DialogCloseTrigger data-testid="close-trigger">Close</DialogCloseTrigger>
            </DialogContent>
          </DialogRoot>
        </Wrapper>
      )
    }
    render(<TestComponent />)
    const closeButton: HTMLElement = screen.getByTestId("close-button")
    expect(screen.getByTestId("content")).toBeInTheDocument()

    await act(async () => {
      await userEvent.click(closeButton)
    })
    expect(screen.queryByTestId("content")).not.toBeInTheDocument()
  })

  /**
   * Test case: Renders DialogFooter.
   * It verifies that DialogFooter renders correctly.
   */
  it("renders DialogFooter", (): void => {
    render(
      <Wrapper>
        <DialogRoot open>
          <DialogContent>
            <DialogFooter data-testid="footer">Footer Content</DialogFooter>
          </DialogContent>
        </DialogRoot>
      </Wrapper>,
    )
    const footer: HTMLElement = screen.getByTestId("footer")
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveTextContent("Footer Content")
  })

  /**
   * Test case: Renders DialogHeader.
   * It verifies that DialogHeader renders correctly.
   */
  it("renders DialogHeader", (): void => {
    render(
      <Wrapper>
        <DialogRoot open>
          <DialogContent>
            <DialogHeader data-testid="header">Header Content</DialogHeader>
          </DialogContent>
        </DialogRoot>
      </Wrapper>,
    )
    const header: HTMLElement = screen.getByTestId("header")
    expect(header).toBeInTheDocument()
    expect(header).toHaveTextContent("Header Content")
  })

  /**
   * Test case: Renders DialogBody.
   * It verifies that DialogBody renders correctly.
   */
  it("renders DialogBody", (): void => {
    render(
      <Wrapper>
        <DialogRoot open>
          <DialogContent>
            <DialogBody data-testid="body">Body Content</DialogBody>
          </DialogContent>
        </DialogRoot>
      </Wrapper>,
    )
    const body: HTMLElement = screen.getByTestId("body")
    expect(body).toBeInTheDocument()
    expect(body).toHaveTextContent("Body Content")
  })

  /**
   * Test case: Renders DialogTitle.
   * It verifies that DialogTitle renders correctly.
   */
  it("renders DialogTitle", (): void => {
    render(
      <Wrapper>
        <DialogRoot open>
          <DialogContent>
            <DialogTitle data-testid="title">Title Content</DialogTitle>
          </DialogContent>
        </DialogRoot>
      </Wrapper>,
    )
    const title: HTMLElement = screen.getByTestId("title")
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent("Title Content")
  })

  /**
   * Test case: Renders DialogDescription.
   * It verifies that DialogDescription renders correctly.
   */
  it("renders DialogDescription", (): void => {
    render(
      <Wrapper>
        <DialogRoot open>
          <DialogContent>
            <DialogDescription data-testid="description">Description Content</DialogDescription>
          </DialogContent>
        </DialogRoot>
      </Wrapper>,
    )
    const description: HTMLElement = screen.getByTestId("description")
    expect(description).toBeInTheDocument()
    expect(description).toHaveTextContent("Description Content")
  })

  /**
   * Test case: Renders DialogActionTrigger.
   * It verifies that DialogActionTrigger renders correctly.
   */
  it("renders DialogActionTrigger", (): void => {
    render(
      <Wrapper>
        <DialogRoot open>
          <DialogContent>
            <DialogActionTrigger data-testid="action-trigger">Action</DialogActionTrigger>
          </DialogContent>
        </DialogRoot>
      </Wrapper>,
    )
    const actionTrigger: HTMLElement = screen.getByTestId("action-trigger")
    expect(actionTrigger).toBeInTheDocument()
    expect(actionTrigger).toHaveTextContent("Action")
  })
})
// endregion
