// noinspection JSUnusedGlobalSymbols

/** @file Global test setup for Vitest.
 * @description Configures the global environment for Vitest tests, mocking browser APIs and Chakra UI components
 *              to isolate module functionality in a JSDOM environment.
 * @module TestSetup
 */

import React, {
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type ReactNode,
  useState,
  createContext,
  useContext,
} from "react"
import "@testing-library/jest-dom"
import { vi } from "vitest"

// region Type Aliases

/** Props for DialogRoot and DrawerRoot components */
type DialogRootProps = {
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (details: { open: boolean }) => void
} & ComponentPropsWithoutRef<"div">

type DrawerRootProps = DialogRootProps

/** Props for DialogCloseTrigger and DrawerCloseTrigger components */
type DialogCloseTriggerProps = {
  children?: ReactNode
  asChild?: boolean
  insetEnd?: string
  top?: string
  position?: string
  ref?: ForwardedRef<HTMLButtonElement>
} & ComponentPropsWithoutRef<"button">

type DrawerCloseTriggerProps = DialogCloseTriggerProps & {
  isClosable?: boolean
}

/** Props for DialogTrigger and DrawerTrigger components */
type DialogTriggerProps = {
  children: ReactNode
  isOpen?: boolean
  onOpen?: () => void
} & ComponentPropsWithoutRef<"button">

type DrawerTriggerProps = DialogTriggerProps

/** Props for DialogContent and DrawerContent components */
type DialogContentProps = {
  children: ReactNode
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement>
  backdrop?: boolean
  ref?: ForwardedRef<HTMLDivElement>
} & ComponentPropsWithoutRef<"div">

type DrawerContentProps = DialogContentProps

/** Props for CloseButton component */
type CloseButtonProps = {
  children?: ReactNode
  size?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
} & ComponentPropsWithoutRef<"button">

/** Props for ChakraField components */
type ChakraFieldRootProps = {
  children: ReactNode
  ref?: ForwardedRef<HTMLDivElement>
} & ComponentPropsWithoutRef<"div">

type ChakraFieldLabelProps = {
  children: ReactNode
  htmlFor?: string
} & ComponentPropsWithoutRef<"label">

type ChakraFieldHelperTextProps = {
  children: ReactNode
} & ComponentPropsWithoutRef<"div">

type ChakraFieldErrorTextProps = {
  children: ReactNode
} & ComponentPropsWithoutRef<"div">

type ChakraFieldRequiredIndicatorProps = {
  fallback?: ReactNode
} & ComponentPropsWithoutRef<"span">

/** Dialog context type */
type DialogContextType = {
  onClose: () => void
  isOpen: boolean
}

/** Extended ReactElement type with ref */
interface RefElement extends React.ReactElement {
  ref?: ForwardedRef<HTMLButtonElement>
}

// endregion

// region Main Code

/**
 * Mocks `window.matchMedia` for the JSDOM environment.
 * @description Necessary because JSDOM does not implement this browser API.
 */
const mockWindowMatchMedia = (): void => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

/** Dialog context to emulate Chakra UI context */
const DialogContext = createContext<DialogContextType | undefined>(undefined)

/**
 * Globally mocks the `@chakra-ui/react` library for all tests.
 * @description Provides mocks for Chakra UI components to support testing of custom components.
 */
const mockChakraUI = (): void => {
  vi.mock("@chakra-ui/react", async () => {
    const actual = await vi.importActual("@chakra-ui/react")
    const ThemeContext = createContext({ theme: { _config: {} } })

    // region Mock Components

    const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
      (
        { children, size, onClick, ...props }: CloseButtonProps,
        ref: ForwardedRef<HTMLButtonElement>,
      ): React.ReactElement => (
        <button ref={ref} onClick={onClick} data-testid="close-button" {...props}>
          {children}
        </button>
      ),
    )

    const DialogCloseTrigger = React.forwardRef<HTMLButtonElement, DialogCloseTriggerProps>(
      (
        { children, asChild, insetEnd, top, position, ...props }: DialogCloseTriggerProps,
        ref: ForwardedRef<HTMLButtonElement>,
      ): React.ReactElement => {
        const context: DialogContextType | undefined = useContext(DialogContext)
        const buttonProps = { ...props, position, top, insetend: insetEnd, "data-testid": "close-button" }

        // Handle asChild with valid children (e.g., <CloseButton> in dialog.tsx)
        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(children, {
            ...buttonProps,
            // @ts-ignore
            ref,
            onClick: (e: React.MouseEvent<HTMLButtonElement>): void => {
              if (children.props.onClick) {
                children.props.onClick(e)
              }
              if (!e.defaultPrevented) {
                context?.onClose?.()
              }
            },
          })
        }

        // Default rendering for DialogCloseTrigger (always renders CloseButton)
        return (
          <CloseButton
            size="sm"
            ref={ref}
            onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
              if (!e.defaultPrevented) {
                context?.onClose?.()
              }
            }}
            {...buttonProps}
          >
            {typeof children === "string" ? (
              children
            ) : (
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Close</title>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            )}
          </CloseButton>
        )
      },
    )

    const DrawerCloseTrigger = React.forwardRef<HTMLButtonElement, DrawerCloseTriggerProps>(
      (
        { children, asChild, insetEnd, top, position, isClosable = true, ...props }: DrawerCloseTriggerProps,
        ref: ForwardedRef<HTMLButtonElement>,
      ): React.ReactElement => {
        const context: DialogContextType | undefined = useContext(DialogContext)
        const buttonProps = {
          ...props,
          position,
          top,
          insetend: insetEnd,
          "data-testid": isClosable ? "close-button" : undefined,
        }

        // Early return if not closable to match drawer.tsx behavior
        if (!isClosable) {
          return <></>
        }

        // Handle asChild with valid children (e.g., <CloseButton> in drawer.tsx)
        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(children, {
            ...buttonProps,
            // @ts-ignore
            ref,
            onClick: (e: React.MouseEvent<HTMLButtonElement>): void => {
              if (children.props.onClick) {
                children.props.onClick(e)
              }
              if (!e.defaultPrevented) {
                context?.onClose?.()
              }
            },
          })
        }

        // Default rendering only when isClosable is true and no valid children
        if (!children) {
          return <></>
        }

        return (
          <CloseButton
            size="sm"
            ref={ref}
            onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
              if (!e.defaultPrevented) {
                context?.onClose?.()
              }
            }}
            {...buttonProps}
          >
            {typeof children === "string" ? (
              children
            ) : (
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Close</title>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            )}
          </CloseButton>
        )
      },
    )

    const FieldRoot = React.forwardRef<HTMLDivElement, ChakraFieldRootProps>(
      ({ children, ...props }: ChakraFieldRootProps, ref: ForwardedRef<HTMLDivElement>): React.ReactElement => (
        <div data-testid="field-root" ref={ref} {...props}>
          {children}
        </div>
      ),
    )

    const FieldLabel = ({ children, htmlFor, ...props }: ChakraFieldLabelProps): React.ReactElement => (
      <label data-testid="field-label" htmlFor={htmlFor} {...props}>
        {children}
      </label>
    )

    const FieldHelperText = ({ children, ...props }: ChakraFieldHelperTextProps): React.ReactElement => (
      <div data-testid="field-helper-text" {...props}>
        {children}
      </div>
    )

    const FieldErrorText = ({ children, ...props }: ChakraFieldErrorTextProps): React.ReactElement => (
      <div data-testid="field-error-text" {...props}>
        {children}
      </div>
    )

    const FieldRequiredIndicator = ({ fallback, ...props }: ChakraFieldRequiredIndicatorProps): React.ReactElement => (
      <span data-testid="field-required-indicator" {...props}>
        {fallback || "*"}
      </span>
    )

    // endregion

    return {
      ...actual,
      ChakraProvider: ({ children }: { children: ReactNode }): React.ReactElement => (
        <ThemeContext.Provider value={{ theme: { _config: {} } }}>{children}</ThemeContext.Provider>
      ),
      Portal: ({
        children,
        disabled,
        container,
      }: {
        children: ReactNode
        disabled?: boolean
        container?: React.RefObject<HTMLDivElement>
      }): React.ReactElement =>
        disabled ? (
          <>{children}</>
        ) : (
          <div data-testid="portal" ref={container}>
            {children}
          </div>
        ),
      CloseButton,
      Field: {
        Root: FieldRoot,
        Label: FieldLabel,
        HelperText: FieldHelperText,
        ErrorText: FieldErrorText,
        RequiredIndicator: FieldRequiredIndicator,
      },
      Dialog: {
        Root: ({ children, defaultOpen, open, onOpenChange, ...props }: DialogRootProps): React.ReactElement => {
          const [isOpen, setIsOpen] = useState(defaultOpen ?? open ?? false)
          const isControlled = open !== undefined
          const effectiveOpen = isControlled ? open : isOpen
          const handleOpenChange = (newOpen: boolean): void => {
            if (!isControlled) setIsOpen(newOpen)
            onOpenChange?.({ open: newOpen })
          }

          return (
            <div data-testid="dialog-root" {...props}>
              <DialogContext.Provider value={{ onClose: (): void => handleOpenChange(false), isOpen: effectiveOpen }}>
                {React.Children.map(children, (child) => {
                  if (!React.isValidElement(child)) {
                    return child
                  }
                  const childType =
                    typeof child.type !== "string" && "displayName" in child.type ? child.type.displayName : undefined
                  if (childType === "DialogTrigger" || childType === "DrawerTrigger") {
                    return React.cloneElement(child as React.ReactElement, {
                      isOpen: effectiveOpen,
                      onOpen: (): void => handleOpenChange(true),
                    })
                  }
                  if (childType === "DialogCloseTrigger") {
                    const closeTriggerChild = child as RefElement & {
                      props: { "data-testid"?: string; children?: ReactNode }
                    }
                    return (
                      <DialogCloseTrigger
                        ref={closeTriggerChild.ref}
                        data-testid={closeTriggerChild.props["data-testid"]}
                        asChild={true}
                      >
                        {closeTriggerChild.props.children}
                      </DialogCloseTrigger>
                    )
                  }
                  if (childType === "DrawerCloseTrigger") {
                    const closeTriggerChild = child as RefElement & {
                      props: { "data-testid"?: string; children?: ReactNode; isClosable?: boolean }
                    }
                    return (
                      <DrawerCloseTrigger
                        ref={closeTriggerChild.ref}
                        data-testid={closeTriggerChild.props["data-testid"]}
                        asChild={true}
                        isClosable={closeTriggerChild.props.isClosable}
                      >
                        {closeTriggerChild.props.isClosable ? closeTriggerChild.props.children : undefined}
                      </DrawerCloseTrigger>
                    )
                  }
                  if ((childType === "DialogContent" || childType === "DrawerContent") && !effectiveOpen) {
                    return null
                  }
                  return child
                })}
              </DialogContext.Provider>
            </div>
          )
        },
        Trigger: ({ children, isOpen, onOpen, ...props }: DialogTriggerProps): React.ReactElement => (
          <button data-testid="dialog-trigger" onClick={() => !isOpen && onOpen?.()} {...props}>
            {children}
          </button>
        ),
        Positioner: ({ children }: { children: ReactNode }): React.ReactElement => (
          <div data-testid="dialog-positioner">{children}</div>
        ),
        Backdrop: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
          <div data-testid="dialog-backdrop" {...props} />
        ),
        CloseTrigger: DialogCloseTrigger,
        Footer: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"div">): React.ReactElement => (
          <div data-testid="dialog-footer" {...props}>
            {children}
          </div>
        ),
        Header: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"div">): React.ReactElement => (
          <div data-testid="dialog-header" {...props}>
            {children}
          </div>
        ),
        Body: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"div">): React.ReactElement => (
          <div data-testid="dialog-body" {...props}>
            {children}
          </div>
        ),
        Title: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"h2">): React.ReactElement => (
          <h2 data-testid="dialog-title" {...props}>
            {children}
          </h2>
        ),
        Description: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"p">): React.ReactElement => (
          <p data-testid="dialog-description" {...props}>
            {children}
          </p>
        ),
        ActionTrigger: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"button">): React.ReactElement => (
          <button data-testid="dialog-action-trigger" {...props}>
            {children}
          </button>
        ),
        Content: React.forwardRef<HTMLDivElement, DialogContentProps>(
          (
            { children, portalled = true, backdrop = true, ...props }: DialogContentProps,
            ref: ForwardedRef<HTMLDivElement>,
          ): React.ReactElement => (
            <div data-testid="dialog-content" ref={ref} {...props}>
              {children}
            </div>
          ),
        ),
      },
      Drawer: {
        Root: ({ children, defaultOpen, open, onOpenChange, ...props }: DrawerRootProps): React.ReactElement => {
          const [isOpen, setIsOpen] = useState(defaultOpen ?? open ?? false)
          const isControlled = open !== undefined
          const effectiveOpen = isControlled ? open : isOpen
          const handleOpenChange = (newOpen: boolean): void => {
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
                    return React.cloneElement(child as React.ReactElement, {
                      isOpen: effectiveOpen,
                      onOpen: () => handleOpenChange(true),
                    })
                  }
                  if (childType === "DrawerCloseTrigger") {
                    const closeTriggerChild = child as RefElement & {
                      props: { "data-testid"?: string; children?: ReactNode; isClosable?: boolean }
                    }
                    return (
                      <DrawerCloseTrigger
                        ref={closeTriggerChild.ref}
                        data-testid={closeTriggerChild.props["data-testid"]}
                        asChild={true}
                        isClosable={closeTriggerChild.props.isClosable}
                      >
                        {closeTriggerChild.props.isClosable ? closeTriggerChild.props.children : undefined}
                      </DrawerCloseTrigger>
                    )
                  }
                  if (childType === "DialogCloseTrigger") {
                    const closeTriggerChild = child as RefElement & {
                      props: { "data-testid"?: string; children?: ReactNode }
                    }
                    return (
                      <DialogCloseTrigger
                        ref={closeTriggerChild.ref}
                        data-testid={closeTriggerChild.props["data-testid"]}
                        asChild={true}
                      >
                        {closeTriggerChild.props.children}
                      </DialogCloseTrigger>
                    )
                  }
                  if (childType === "DrawerContent" && !effectiveOpen) return null
                  return child
                })}
              </DialogContext.Provider>
            </div>
          )
        },
        Trigger: ({ children, isOpen, onOpen, ...props }: DrawerTriggerProps): React.ReactElement => (
          <button data-testid="drawer-trigger" onClick={() => !isOpen && onOpen?.()} {...props}>
            {children}
          </button>
        ),
        Positioner: ({ children, padding }: { children: ReactNode; padding?: string }): React.ReactElement => (
          <div data-testid="drawer-positioner" style={{ padding }}>
            {children}
          </div>
        ),
        Backdrop: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
          <div data-testid="drawer-backdrop" {...props} />
        ),
        CloseTrigger: DrawerCloseTrigger,
        Footer: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"div">): React.ReactElement => (
          <div data-testid="drawer-footer" {...props}>
            {children}
          </div>
        ),
        Header: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"div">): React.ReactElement => (
          <div data-testid="drawer-header" {...props}>
            {children}
          </div>
        ),
        Body: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"div">): React.ReactElement => (
          <div data-testid="drawer-body" {...props}>
            {children}
          </div>
        ),
        Title: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"h2">): React.ReactElement => (
          <h2 data-testid="drawer-title" {...props}>
            {children}
          </h2>
        ),
        Description: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"p">): React.ReactElement => (
          <p data-testid="drawer-description" {...props}>
            {children}
          </p>
        ),
        ActionTrigger: ({
          children,
          ...props
        }: { children: ReactNode } & ComponentPropsWithoutRef<"button">): React.ReactElement => (
          <button data-testid="drawer-action-trigger" {...props}>
            {children}
          </button>
        ),
        Content: React.forwardRef<HTMLDivElement, DrawerContentProps>(
          (
            { children, portalled = true, backdrop = true, ...props }: DrawerContentProps,
            ref: ForwardedRef<HTMLDivElement>,
          ): React.ReactElement => (
            <div data-testid="drawer-content" ref={ref} {...props}>
              {children}
            </div>
          ),
        ),
      },
      AbsoluteCenter: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
        <div data-testid="absolute-center" {...props} />
      ),
      Span: React.forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(
        (
          {
            colorPalette,
            colorScheme,
            ...props
          }: ComponentPropsWithoutRef<"span"> & {
            colorPalette?: string
            colorScheme?: string
          },
          ref: ForwardedRef<HTMLSpanElement>,
        ): React.ReactElement => <span data-testid="span" ref={ref} {...props} />,
      ),
      Spinner: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
        <div role="status" data-testid="spinner" {...props} />
      ),
      Button: React.forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(
        (props: ComponentPropsWithoutRef<"button">, ref: ForwardedRef<HTMLButtonElement>): React.ReactElement => (
          <button ref={ref} {...props} />
        ),
      ),
      IconButton: React.forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(
        (
          { boxSize, ...props }: ComponentPropsWithoutRef<"button"> & { boxSize?: string },
          ref: ForwardedRef<HTMLButtonElement>,
        ): React.ReactElement => <button data-testid="icon-button" ref={ref} {...props} />,
      ),
      Checkbox: {
        Root: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
          <div data-testid="checkbox-root" {...props} />
        ),
        HiddenInput: React.forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
          (props: ComponentPropsWithoutRef<"input">, ref: ForwardedRef<HTMLInputElement>): React.ReactElement => (
            <input type="checkbox" data-testid="checkbox-input" ref={ref} {...props} />
          ),
        ),
        Control: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
          <div data-testid="checkbox-control" {...props} />
        ),
        Indicator: (props: ComponentPropsWithoutRef<"div">): React.ReactElement => (
          <div data-testid="checkbox-indicator" {...props} />
        ),
        Label: (props: ComponentPropsWithoutRef<"span">): React.ReactElement => (
          <span data-testid="checkbox-label" {...props} />
        ),
      },
      ClientOnly: ({ children }: { children: ReactNode; fallback?: ReactNode }): React.ReactElement => <>{children}</>,
      Skeleton: ({ boxSize, ...props }: ComponentPropsWithoutRef<"div"> & { boxSize?: string }): React.ReactElement => (
        <div data-testid="skeleton" data-box-size={boxSize} {...props} />
      ),
      defineRecipe: vi.fn(() => ({})),
    }
  })
}

// endregion

// region Setup Execution

mockWindowMatchMedia()
mockChakraUI()

// endregion
