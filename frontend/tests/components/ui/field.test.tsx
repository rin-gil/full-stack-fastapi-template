/**
 * @file Unit tests for the Field component.
 * @description These tests verify the Field component's rendering logic. Key child
 * dependencies from Chakra UI are mocked to ensure true unit testing in isolation,
 * preventing CSS parsing and environment-specific errors.
 */

import { render, screen } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import { Field } from "@/components/ui/field"

// region Mocks
/**
 * Mocks the necessary parts of Chakra UI's Field component system.
 * This follows the established project pattern of replacing complex UI library
 * components with simple, native elements (like divs and spans) during unit tests.
 * This isolates the component under test from its dependencies and prevents
 * environment-specific errors like "Could not parse CSS stylesheet" in JSDOM.
 */
vi.mock("@chakra-ui/react", async (importOriginal) => {
  const original = await importOriginal<typeof import("@chakra-ui/react")>()

  /**
   * Mock for ChakraField.Root.
   * @param {object} props - Component props.
   * @param {ReactNode} props.children - The child elements.
   * @param {string} [props."data-testid"] - The test ID.
   * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref.
   * @returns {ReactElement} A mocked div.
   */
  const MockFieldRoot = React.forwardRef<
    HTMLDivElement,
    { children: ReactNode; "data-testid"?: string }
  >(function MockFieldRoot(props, ref): ReactElement {
    return (
      <div ref={ref} data-testid={props["data-testid"]}>
        {props.children}
      </div>
    )
  })
  MockFieldRoot.displayName = "MockFieldRoot"

  // noinspection JSUnusedGlobalSymbols
  return {
    ...original,
    Field: {
      Root: MockFieldRoot,
      /**
       * Mock for ChakraField.Label that includes htmlFor to satisfy a11y linter rules.
       * @param {{children: ReactNode}} props - The component props.
       * @returns {ReactElement} A mocked label.
       */
      Label: ({ children }: { children: ReactNode }): ReactElement => (
        <label htmlFor="test-id">{children}</label>
      ),
      /**
       * Mock for ChakraField.RequiredIndicator.
       * @param {{fallback?: ReactNode}} props - The component props.
       * @returns {ReactElement | null} The fallback or a default indicator.
       */
      RequiredIndicator: ({
        fallback,
      }: {
        fallback?: ReactNode
      }): ReactElement => (fallback ? <>{fallback}</> : <span>*</span>),
      /**
       * Mock for ChakraField.HelperText.
       * @param {{children: ReactElement}} props - The component props.
       * @returns {ReactElement} A mocked div.
       */
      HelperText: ({ children }: { children: ReactElement }): ReactElement => (
        <div data-testid="helper-text">{children}</div>
      ),
      /**
       * Mock for ChakraField.ErrorText.
       * @param {{children: ReactElement}} props - The component props.
       * @returns {ReactElement} A mocked div.
       */
      ErrorText: ({ children }: { children: ReactElement }): ReactElement => (
        <div data-testid="error-text">{children}</div>
      ),
    },
  }
})
// endregion

describe("Field", (): void => {
  // region Test Cases
  it("should render its children correctly", (): void => {
    render(
      <Field>
        <input data-testid="child-input" />
      </Field>,
    )
    expect(screen.getByTestId("child-input")).toBeInTheDocument()
  })

  it("should render the label when the 'label' prop is provided", (): void => {
    // An input with a matching ID is included to satisfy the a11y linter.
    render(
      <Field label="Username">
        <input id="test-id" />
      </Field>,
    )
    expect(screen.getByText("Username")).toBeInTheDocument()
  })

  it("should render helper text when provided", (): void => {
    render(<Field helperText="Enter your unique username" />)
    expect(screen.getByText("Enter your unique username")).toBeInTheDocument()
  })

  it("should render error text when provided", (): void => {
    render(<Field errorText="This field is required" />)
    expect(screen.getByText("This field is required")).toBeInTheDocument()
  })

  it("should render both helper and error text if both are provided", (): void => {
    render(
      <Field
        helperText="This is a helper"
        errorText="This is an error"
        invalid
      />,
    )
    expect(screen.getByText("This is a helper")).toBeInTheDocument()
    expect(screen.getByText("This is an error")).toBeInTheDocument()
  })

  it("should render optionalText as part of the label", (): void => {
    render(
      <Field label="Topic" optionalText=" (Optional)">
        <input id="test-id" />
      </Field>,
    )
    // Use a regex to find the label containing both text nodes,
    // as they are rendered within the same <label> element.
    const label: HTMLElement = screen.getByText(/Topic \(Optional\)/)
    expect(label).toBeInTheDocument()
  })

  it("should render the required indicator when isRequired is true", (): void => {
    render(
      <Field label="Email" required>
        <input id="test-id" />
      </Field>,
    )
    const label: HTMLElement = screen.getByText("Email")
    const requiredIndicator = screen.getByText("*")
    expect(label).toContainElement(requiredIndicator)
  })

  it("should forward the ref to the root element", (): void => {
    const ref: React.RefObject<HTMLDivElement> =
      React.createRef<HTMLDivElement>()
    render(<Field ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it("should pass through additional props like data-testid", (): void => {
    render(<Field data-testid="field-root-testid" />)
    expect(screen.getByTestId("field-root-testid")).toBeInTheDocument()
  })
  // endregion
})
