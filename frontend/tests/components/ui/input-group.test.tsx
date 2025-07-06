/**
 * @file Unit tests for src/components/ui/input-group.tsx
 * @description Verifies the InputGroup component's logic in isolation by mocking its
 * dependencies (Chakra UI components) to avoid environment-specific errors.
 */

import { render, screen } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import { InputGroup } from "@/components/ui/input-group"

// region MOCKING DEPENDENCIES

vi.mock("@chakra-ui/react", async (importOriginal) => {
  const original = await importOriginal<typeof import("@chakra-ui/react")>()
  // noinspection JSUnusedGlobalSymbols
  return {
    ...original,
    // Mocking the Group component to be a simple div
    Group: React.forwardRef<HTMLDivElement, { children: ReactNode }>(
      (props, ref): ReactElement => (
        <div ref={ref} data-testid="mock-group" {...props} />
      ),
    ),
    // Mocking the InputElement to be a simple span
    InputElement: ({
      children,
      ...props
    }: { children: ReactNode }): ReactElement => (
      <span {...props}>{children}</span>
    ),
  }
})

/**
 * A mock Input component for testing purposes. It accepts `ps` and `pe` props
 * to verify that InputGroup correctly injects them.
 *
 * @param {object} props - The component props, including optional `ps` and `pe`.
 * @param {React.Ref<HTMLInputElement>} ref - The ref forwarded to the input element.
 * @returns {ReactElement} The rendered mock input element.
 */
const MockInput = React.forwardRef<
  HTMLInputElement,
  { ps?: string; pe?: string }
>(function MockInput(
  props: { ps?: string; pe?: string },
  ref: React.Ref<HTMLInputElement>,
): ReactElement {
  return <input placeholder="test-input" ref={ref} {...props} />
})
MockInput.displayName = "MockInput"

// endregion

describe("InputGroup", () => {
  it("should render its child component without any adornments or padding", () => {
    render(
      <InputGroup>
        <MockInput />
      </InputGroup>,
    )

    const input = screen.getByPlaceholderText("test-input")
    expect(input).toBeInTheDocument()
    expect(screen.queryByText("Start")).not.toBeInTheDocument()
    expect(screen.queryByText("End")).not.toBeInTheDocument()
    expect(input).not.toHaveAttribute("ps")
    expect(input).not.toHaveAttribute("pe")
  })

  it("should render a startElement and inject start padding `ps` into the child", () => {
    render(
      <InputGroup startElement={<span>Start</span>}>
        <MockInput />
      </InputGroup>,
    )

    const input = screen.getByPlaceholderText("test-input")
    expect(screen.getByText("Start")).toBeInTheDocument()
    expect(input).toHaveAttribute("ps", "10")
    expect(input).not.toHaveAttribute("pe")
  })

  it("should render an endElement and inject end padding `pe` into the child", () => {
    render(
      <InputGroup endElement={<span>End</span>}>
        <MockInput />
      </InputGroup>,
    )

    const input = screen.getByPlaceholderText("test-input")
    expect(screen.getByText("End")).toBeInTheDocument()
    expect(input).toHaveAttribute("pe", "10")
    expect(input).not.toHaveAttribute("ps")
  })
})
