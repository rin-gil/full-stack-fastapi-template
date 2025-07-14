/**
 * @file Contains the Pagination components built on top of Chakra UI's Pagination.
 * @description Provides a flexible and customizable pagination system with support for different variants,
 * link-based navigation, and optional prefetching capabilities triggered by `onMouseDown`.
 * @module Pagination
 */

"use client"

import type { ButtonProps, TextProps } from "@chakra-ui/react"
import {
  Button,
  Pagination as ChakraPagination,
  IconButton,
  Text,
  createContext,
  usePaginationContext,
} from "@chakra-ui/react"
import * as React from "react"
import type { ForwardedRef, MouseEventHandler } from "react"
import { HiChevronLeft, HiChevronRight, HiMiniEllipsisHorizontal } from "react-icons/hi2"
import { LinkButton, type LinkButtonProps } from "./link-button"

// region Type Aliases

/**
 * Defines the Chakra UI button variants for different pagination item states.
 * @interface ButtonVariantMap
 */
interface ButtonVariantMap {
  /**
   * Variant for the current page button.
   * @type {ButtonProps["variant"]}
   */
  current: ButtonProps["variant"]
  /**
   * Variant for default (non-current) page buttons.
   * @type {ButtonProps["variant"]}
   */
  default: ButtonProps["variant"]
  /**
   * Variant for the ellipsis button.
   * @type {ButtonProps["variant"]}
   */
  ellipsis: ButtonProps["variant"]
}

/**
 * Defines the possible visual variants for the pagination component.
 * @type {PaginationVariant}
 */
type PaginationVariant = "outline" | "solid" | "subtle"

/**
 * Context interface for sharing button size, variant map, and href generation function.
 * @interface ButtonVariantContext
 */
interface ButtonVariantContext {
  /**
   * The size of the buttons in the pagination.
   * @type {ButtonProps["size"]}
   */
  size: ButtonProps["size"]
  /**
   * A map of button variants based on the chosen pagination variant.
   * @type {ButtonVariantMap}
   */
  variantMap: ButtonVariantMap
  /**
   * Optional function to generate href for link-based pagination.
   * @type {(page: number) => string}
   */
  getHref?: (page: number) => string
}

/**
 * Type for pagination page or ellipsis items in PaginationItems.
 * @type {PaginationPage}
 */
type PaginationPage = { type: "page"; value: number } | { type: "ellipsis" }

/**
 * Props for the PaginationRoot component.
 * @interface PaginationRootProps
 * @extends Omit<ChakraPagination.RootProps, "type">
 */
interface PaginationRootProps extends Omit<ChakraPagination.RootProps, "type"> {
  /**
   * The size of the pagination buttons.
   * @type {ButtonProps["size"]}
   * @default "sm"
   */
  size?: ButtonProps["size"]
  /**
   * The visual variant of the pagination.
   * @type {PaginationVariant}
   * @default "outline"
   */
  variant?: PaginationVariant
  /**
   * Optional function to generate href for link-based pagination.
   * @type {(page: number) => string}
   */
  getHref?: (page: number) => string
}

/**
 * Props for the PaginationItem component, adding an optional onMouseDown handler.
 * @interface PaginationItemProps
 * @extends ChakraPagination.ItemProps
 */
interface PaginationItemProps extends ChakraPagination.ItemProps {
  /**
   * Optional mouse down handler for prefetching.
   * @type {React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>}
   */
  onMouseDown?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
}

/**
 * Base props for previous and next pagination triggers, adding an optional onMouseDown handler.
 * @interface PaginationTriggerProps
 * @extends Omit<ChakraPagination.PrevTriggerProps, "onMouseEnter" | "onMouseDown">
 */
interface PaginationTriggerProps extends Omit<ChakraPagination.PrevTriggerProps, "onMouseEnter" | "onMouseDown"> {
  /**
   * Optional mouse down handler for prefetching.
   * @type {React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>}
   */
  onMouseDown?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
}

/**
 * Props for the PaginationItems component, including an optional onMouseDown handler for individual items.
 * @interface PaginationItemsProps
 * @extends React.HTMLAttributes<HTMLElement>
 */
interface PaginationItemsProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Optional mouse down handler for individual page items.
   * @type {React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>}
   */
  onMouseDownItem?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
}

/**
 * Props for the PaginationPageText component.
 * @interface PageTextProps
 * @extends TextProps
 */
interface PageTextProps extends TextProps {
  /**
   * The format for displaying page text.
   * @type {"short" | "compact" | "long"}
   * @default "compact"
   */
  format?: "short" | "compact" | "long"
}

/**
 * Type alias for the PaginationRoot component's type.
 * @type {PaginationRootComponent}
 */
type PaginationRootComponent = React.ForwardRefExoticComponent<
  PaginationRootProps & React.RefAttributes<HTMLDivElement>
>

/**
 * Type alias for the PaginationEllipsis component's type.
 * @type {PaginationEllipsisComponent}
 */
type PaginationEllipsisComponent = React.ForwardRefExoticComponent<
  ChakraPagination.EllipsisProps & React.RefAttributes<HTMLDivElement>
>

/**
 * Type alias for the PaginationItem component's type.
 * @type {PaginationItemComponent}
 */
type PaginationItemComponent = React.ForwardRefExoticComponent<
  PaginationItemProps & React.RefAttributes<HTMLButtonElement>
>

/**
 * Type alias for the PaginationTrigger component's type.
 * @type {PaginationTriggerComponent}
 */
type PaginationTriggerComponent = React.ForwardRefExoticComponent<
  PaginationTriggerProps & React.RefAttributes<HTMLButtonElement>
>

/**
 * Type alias for the PaginationItems component's type.
 * @type {PaginationItemsComponent}
 */
type PaginationItemsComponent = React.NamedExoticComponent<PaginationItemsProps>

/**
 * Type alias for the PaginationPageText component's type.
 * @type {PageTextComponent}
 */
type PageTextComponent = React.ForwardRefExoticComponent<PageTextProps & React.RefAttributes<HTMLParagraphElement>>

// endregion

// region Constants

/**
 * Maps pagination variants to specific Chakra UI button variants for different states.
 * @constant variantMap
 * @type {Record<PaginationVariant, ButtonVariantMap>}
 */
const variantMap: Record<PaginationVariant, ButtonVariantMap> = {
  outline: { default: "ghost", ellipsis: "plain", current: "outline" },
  solid: { default: "outline", ellipsis: "outline", current: "solid" },
  subtle: { default: "ghost", ellipsis: "plain", current: "subtle" },
}

// endregion

// region Main Code

const [RootPropsProvider, useRootProps] = createContext<ButtonVariantContext>({
  name: "RootPropsProvider",
})

/**
 * The root component for the pagination system. It sets up the context for shared properties
 * like button size, variants, and href generation.
 * @param {PaginationRootProps} props - The props for the component, destructured.
 * @param {ButtonProps["size"]} [props.size="sm"] - The size of the pagination buttons.
 * @param {PaginationVariant} [props.variant="outline"] - The visual variant of the pagination.
 * @param {(page: number) => string} [props.getHref] - Optional function to generate href for links.
 * @param {Omit<ChakraPagination.RootProps, "type">} props.rest - Other Chakra UI pagination props.
 * @param {ForwardedRef<HTMLDivElement>} ref - Ref to the div element.
 * @returns {React.ReactElement} The rendered pagination root.
 */
const PaginationRootComponent: PaginationRootComponent = React.forwardRef<HTMLDivElement, PaginationRootProps>(
  function PaginationRoot(
    { size = "sm", variant = "outline", getHref, ...rest }: PaginationRootProps,
    ref: ForwardedRef<HTMLDivElement>,
  ): React.ReactElement {
    const variantMapValue: ButtonVariantMap = variantMap[variant]
    return (
      <RootPropsProvider value={{ size, variantMap: variantMapValue, getHref }}>
        <ChakraPagination.Root ref={ref} type={getHref ? "link" : "button"} {...rest} />
      </RootPropsProvider>
    )
  },
)

/**
 * Represents the ellipsis (...) button in the pagination, indicating skipped pages.
 * @param {ChakraPagination.EllipsisProps} props - The props for the component, destructured.
 * @param {Omit<ChakraPagination.EllipsisProps, "index">} props.rest - Other Chakra UI ellipsis props.
 * @param {number} props.index - The index of the ellipsis.
 * @param {ForwardedRef<HTMLDivElement>} ref - Ref to the div element.
 * @returns {React.ReactElement} The rendered ellipsis button.
 */
const PaginationEllipsisComponent: PaginationEllipsisComponent = React.forwardRef<
  HTMLDivElement,
  ChakraPagination.EllipsisProps
>(function PaginationEllipsis(
  { index, ...rest }: ChakraPagination.EllipsisProps,
  ref: ForwardedRef<HTMLDivElement>,
): React.ReactElement {
  const { size, variantMap }: ButtonVariantContext = useRootProps()
  return (
    <ChakraPagination.Ellipsis ref={ref} index={index} {...rest} asChild>
      <Button as="span" variant={variantMap.ellipsis} size={size}>
        <HiMiniEllipsisHorizontal />
      </Button>
    </ChakraPagination.Ellipsis>
  )
})

/**
 * Represents an individual page number button in the pagination.
 * It can render as a button or a link depending on `getHref` prop in `PaginationRoot`.
 * Includes an optional `onMouseDown` prop for prefetching.
 * @param {PaginationItemProps} props - The props for the component, destructured.
 * @param {MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>} [props.onMouseDown] - Optional mouse down handler.
 * @param {ChakraPagination.ItemProps} props.restProps - Other Chakra UI item props.
 * @param {ForwardedRef<HTMLButtonElement>} ref - Ref to the button element.
 * @returns {React.ReactElement} The rendered page item button/link.
 */
const PaginationItemComponent: PaginationItemComponent = React.forwardRef<HTMLButtonElement, PaginationItemProps>(
  function PaginationItem(
    { onMouseDown, ...restProps }: PaginationItemProps,
    ref: ForwardedRef<HTMLButtonElement>,
  ): React.ReactElement {
    const { page }: { page: number } = usePaginationContext()
    const { size, variantMap, getHref }: ButtonVariantContext = useRootProps()
    const current: boolean = page === restProps.value
    const variant: ButtonProps["variant"] = current ? variantMap.current : variantMap.default
    if (getHref) {
      const itemHref: string = getHref(restProps.value)
      return (
        <LinkButton
          to={itemHref}
          variant={variant as LinkButtonProps["variant"]}
          size={size}
          onMouseDown={onMouseDown as MouseEventHandler<HTMLAnchorElement>}
        >
          {restProps.value}
        </LinkButton>
      )
    }
    return (
      <ChakraPagination.Item ref={ref} {...restProps} asChild>
        <Button variant={variant} size={size} onMouseDown={onMouseDown}>
          {restProps.value}
        </Button>
      </ChakraPagination.Item>
    )
  },
)

/**
 * The button to navigate to the previous page.
 * Supports both button and link types, and includes an optional `onMouseDown` prop for prefetching.
 * @param {PaginationTriggerProps} props - The props for the component.
 * @param {ForwardedRef<HTMLButtonElement>} ref - Ref to the button element.
 * @returns {React.ReactElement} The rendered previous page button/link.
 */
const PaginationPrevTriggerComponent: PaginationTriggerComponent = React.forwardRef<
  HTMLButtonElement,
  PaginationTriggerProps
>(function PaginationPrevTrigger(
  props: PaginationTriggerProps,
  ref: ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  const { previousPage }: { previousPage: number | null } = usePaginationContext()
  const { size, variantMap, getHref }: ButtonVariantContext = useRootProps()
  const { onMouseDown, ...restProps } = props
  if (getHref && previousPage != null) {
    const href: string = getHref(previousPage)
    return (
      <LinkButton
        to={href}
        variant={variantMap.default as LinkButtonProps["variant"]}
        size={size}
        onMouseDown={onMouseDown as MouseEventHandler<HTMLAnchorElement>}
      >
        <HiChevronLeft />
      </LinkButton>
    )
  }
  return (
    <ChakraPagination.PrevTrigger ref={ref} {...restProps} asChild onMouseDown={onMouseDown}>
      <IconButton variant={variantMap.default} size={size}>
        <HiChevronLeft />
      </IconButton>
    </ChakraPagination.PrevTrigger>
  )
})

/**
 * The button to navigate to the next page.
 * Supports both button and link types, and includes an optional `onMouseDown` prop for prefetching.
 * @param {PaginationTriggerProps} props - The props for the component.
 * @param {ForwardedRef<HTMLButtonElement>} ref - Ref to the button element.
 * @returns {React.ReactElement} The rendered next page button/link.
 */
const PaginationNextTriggerComponent: PaginationTriggerComponent = React.forwardRef<
  HTMLButtonElement,
  PaginationTriggerProps
>(function PaginationNextTrigger(
  props: PaginationTriggerProps,
  ref: ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  const { nextPage }: { nextPage: number | null } = usePaginationContext()
  const { size, variantMap, getHref }: ButtonVariantContext = useRootProps()
  const { onMouseDown, ...restProps } = props
  if (getHref && nextPage != null) {
    const href: string = getHref(nextPage)
    return (
      <LinkButton
        to={href}
        variant={variantMap.default as LinkButtonProps["variant"]}
        size={size}
        onMouseDown={onMouseDown as MouseEventHandler<HTMLAnchorElement>}
      >
        <HiChevronRight />
      </LinkButton>
    )
  }
  return (
    <ChakraPagination.NextTrigger ref={ref} {...restProps} asChild onMouseDown={onMouseDown}>
      <IconButton variant={variantMap.default} size={size}>
        <HiChevronRight />
      </IconButton>
    </ChakraPagination.NextTrigger>
  )
})

/**
 * Renders a sequence of pagination item components (page numbers or ellipsis) based on the context.
 * @param {PaginationItemsProps} props - The props for the component, destructured.
 * @param {MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>} [props.onMouseDownItem] - Optional mouse down handler for items.
 * @param {React.HTMLAttributes<HTMLElement>} props.restProps - Other HTML attributes.
 * @returns {React.ReactElement} The rendered list of pagination items.
 */
const PaginationItemsComponent: PaginationItemsComponent = React.memo(function PaginationItems({
  onMouseDownItem,
  ...restProps
}: PaginationItemsProps): React.ReactElement {
  return (
    <ChakraPagination.Context>
      {({ pages }: { pages: PaginationPage[] }) =>
        pages.map((page: PaginationPage, index: number): React.ReactElement => {
          return page.type === "ellipsis" ? (
            <PaginationEllipsis key={index} index={index} {...restProps} />
          ) : (
            <PaginationItem key={index} type="page" value={page.value} onMouseDown={onMouseDownItem} {...restProps} />
          )
        })
      }
    </ChakraPagination.Context>
  )
})

/**
 * Displays the current page information (e.g., "Page 1 of 5").
 * @param {PageTextProps} props - The props for the component, destructured.
 * @param {"short" | "compact" | "long"} [props.format="compact"] - The format for displaying page text.
 * @param {TextProps} props.rest - Other Chakra UI text props.
 * @param {ForwardedRef<HTMLParagraphElement>} ref - Ref to the paragraph element.
 * @returns {React.ReactElement} The rendered page text.
 */
const PaginationPageTextComponent: PageTextComponent = React.forwardRef<HTMLParagraphElement, PageTextProps>(
  function PaginationPageText(
    { format = "compact", ...rest }: PageTextProps,
    ref: ForwardedRef<HTMLParagraphElement>,
  ): React.ReactElement {
    const {
      page,
      totalPages,
      pageRange,
      count,
    }: {
      page: number
      totalPages: number
      pageRange: { start: number; end: number }
      count: number
    } = usePaginationContext()
    const content: string = React.useMemo<string>((): string => {
      if (format === "short") return `${page} / ${totalPages}`
      if (format === "compact") return `${page} of ${totalPages}`
      return `${pageRange.start + 1} - ${Math.min(pageRange.end, count)} of ${count}`
    }, [format, page, totalPages, pageRange, count])
    return (
      <Text fontWeight="medium" ref={ref} {...rest}>
        {content}
      </Text>
    )
  },
)

// endregion

// region Optional Declarations

PaginationRootComponent.displayName = "PaginationRoot"
export const PaginationRoot: React.MemoExoticComponent<PaginationRootComponent> = React.memo(PaginationRootComponent)

PaginationEllipsisComponent.displayName = "PaginationEllipsis"
export const PaginationEllipsis: React.MemoExoticComponent<PaginationEllipsisComponent> =
  React.memo(PaginationEllipsisComponent)

PaginationItemComponent.displayName = "PaginationItem"
export const PaginationItem: React.MemoExoticComponent<PaginationItemComponent> = React.memo(PaginationItemComponent)

PaginationPrevTriggerComponent.displayName = "PaginationPrevTrigger"
export const PaginationPrevTrigger: React.MemoExoticComponent<PaginationTriggerComponent> =
  React.memo(PaginationPrevTriggerComponent)

PaginationNextTriggerComponent.displayName = "PaginationNextTrigger"
export const PaginationNextTrigger: React.MemoExoticComponent<PaginationTriggerComponent> =
  React.memo(PaginationNextTriggerComponent)

PaginationItemsComponent.displayName = "PaginationItems"
export const PaginationItems: React.MemoExoticComponent<PaginationItemsComponent> = React.memo(PaginationItemsComponent)

PaginationPageTextComponent.displayName = "PaginationPageText"
export const PaginationPageText: React.MemoExoticComponent<PageTextComponent> = React.memo(PaginationPageTextComponent)

// endregion
