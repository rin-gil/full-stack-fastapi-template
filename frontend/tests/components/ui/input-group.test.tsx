/**
 * @file Unit tests for src/components/ui/input-group.tsx
 * @description These tests use mocking to isolate the InputGroup's logic
 * from its child dependencies, preventing environment-specific errors (CSS, providers).
 */

import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import { InputGroup } from "@/components/ui/input-group"

// --- MOCKING DEPENDENCIES ---
vi.mock("@chakra-ui/react", async (importOriginal) => {
  const original = await importOriginal<typeof import("@chakra-ui/react")>()
  // noinspection JSUnusedGlobalSymbols
  return {
    ...original,
    Group: React.forwardRef<HTMLDivElement, { children: ReactNode }>(
      (props, ref) => <div ref={ref} data-testid="mock-group" {...props} />,
    ),
    InputElement: ({ children, ...props }: { children: ReactNode }) => (
      <span {...props}>{children}</span>
    ),
  }
})

const MockInput = React.forwardRef<
  HTMLInputElement,
  { ps?: string; pe?: string }
>(
  (props, ref): ReactNode => (
    <input placeholder="test-input" ref={ref} {...props} />
  ),
)

// --- END OF MOCKING ---

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
