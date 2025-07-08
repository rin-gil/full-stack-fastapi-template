/**
 * @file This file contains the Pagination components built on top of Chakra UI's Pagination.
 * @description Provides a flexible and customizable pagination system with support for different variants,
 *              link-based navigation, and optional prefetching capabilities.
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
import type { ForwardRefExoticComponent, NamedExoticComponent } from "react"
import { HiChevronLeft, HiChevronRight, HiMiniEllipsisHorizontal } from "react-icons/hi2"
import { LinkButton } from "./link-button"

/**
 * @interface ButtonVariantMap
 * @description Defines the Chakra UI button variants for different pagination item states.
 * @property {ButtonProps["variant"]} current - Variant for the current page button.
 * @property {ButtonProps["variant"]} default - Variant for default (non-current) page buttons.
 * @property {ButtonProps["variant"]} ellipsis - Variant for the ellipsis button.
 */
interface ButtonVariantMap {
  current: ButtonProps["variant"]
  default: ButtonProps["variant"]
  ellipsis: ButtonProps["variant"]
}

/**
 * @description Defines the possible visual variants for the pagination component.
 */
type PaginationVariant = "outline" | "solid" | "subtle"

/**
 * @interface ButtonVariantContext
 * @description Context interface for sharing button size, variant map, and href generation function.
 * @property {ButtonProps["size"]} size - The size of the buttons in the pagination.
 * @property {ButtonVariantMap} variantMap - A map of button variants based on the chosen pagination variant.
 * @property {(page: number) => string} [getHref] - Optional function to generate href for link-based pagination.
 */
interface ButtonVariantContext {
  size: ButtonProps["size"]
  variantMap: ButtonVariantMap
  getHref?: (page: number) => string
}

const [RootPropsProvider, useRootProps] = createContext<ButtonVariantContext>({
  name: "RootPropsProvider",
})

/**
 * @interface PaginationRootProps
 * @extends Omit<ChakraPagination.RootProps, "type">
 * @description Props for the PaginationRoot component.
 * @property {ButtonProps["size"]} [size="sm"] - The size of the pagination buttons. Defaults to "sm".
 * @property {PaginationVariant} [variant="outline"] - The visual variant of the pagination. Defaults to "outline".
 * @property {(page: number) => string} [getHref] - Optional function to generate href for link-based pagination.
 */
export interface PaginationRootProps extends Omit<ChakraPagination.RootProps, "type"> {
  size?: ButtonProps["size"]
  variant?: PaginationVariant
  getHref?: (page: number) => string
}

/**
 * @constant variantMap
 * @description Maps pagination variants to specific Chakra UI button variants for different states.
 */
const variantMap: Record<PaginationVariant, ButtonVariantMap> = {
  outline: { default: "ghost", ellipsis: "plain", current: "outline" },
  solid: { default: "outline", ellipsis: "outline", current: "solid" },
  subtle: { default: "ghost", ellipsis: "plain", current: "subtle" },
}

/**
 * @component PaginationRoot
 * @description The root component for the pagination system. It sets up the context for shared properties
 *              like button size, variants, and href generation.
 * @param {PaginationRootProps} props - The props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Ref to the div element.
 * @returns {React.ReactElement} The rendered pagination root.
 */
const PaginationRootComponent: ForwardRefExoticComponent<PaginationRootProps> = React.forwardRef<
  HTMLDivElement,
  PaginationRootProps
>(function PaginationRoot(props: PaginationRootProps, ref: React.Ref<HTMLDivElement>): React.ReactElement {
  const { size = "sm", variant = "outline", getHref, ...rest }: PaginationRootProps = props
  const variantMapValue: ButtonVariantMap = variantMap[variant]
  return (
    <RootPropsProvider value={{ size, variantMap: variantMapValue, getHref }}>
      <ChakraPagination.Root ref={ref} type={getHref ? "link" : "button"} {...rest} />
    </RootPropsProvider>
  )
})
PaginationRootComponent.displayName = "PaginationRoot"
export const PaginationRoot: React.MemoExoticComponent<
  React.ForwardRefExoticComponent<PaginationRootProps & React.RefAttributes<HTMLDivElement>>
> = React.memo(PaginationRootComponent)

/**
 * @component PaginationEllipsis
 * @description Represents the ellipsis (...) button in the pagination, indicating skipped pages.
 * @param {ChakraPagination.EllipsisProps} props - The props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Ref to the div element.
 * @returns {React.ReactElement} The rendered ellipsis button.
 */
const PaginationEllipsisComponent: ForwardRefExoticComponent<ChakraPagination.EllipsisProps> = React.forwardRef<
  HTMLDivElement,
  ChakraPagination.EllipsisProps
>(function PaginationEllipsis(
  props: ChakraPagination.EllipsisProps,
  ref: React.Ref<HTMLDivElement>,
): React.ReactElement {
  const { size, variantMap }: ButtonVariantContext = useRootProps()
  return (
    <ChakraPagination.Ellipsis ref={ref} {...props} asChild>
      <Button as="span" variant={variantMap.ellipsis} size={size}>
        <HiMiniEllipsisHorizontal />
      </Button>
    </ChakraPagination.Ellipsis>
  )
})

PaginationEllipsisComponent.displayName = "PaginationEllipsis"

export const PaginationEllipsis: React.MemoExoticComponent<
  React.ForwardRefExoticComponent<ChakraPagination.EllipsisProps & React.RefAttributes<HTMLDivElement>>
> = React.memo(PaginationEllipsisComponent)

/**
 * @component PaginationItem
 * @description Represents an individual page number button in the pagination.
 *              It can render as a button or a link depending on `getHref` prop in `PaginationRoot`.
 * @param {ChakraPagination.ItemProps} props - The props for the component.
 * @param {React.Ref<HTMLButtonElement>} ref - Ref to the button element.
 * @returns {React.ReactElement} The rendered page item button/link.
 */
const PaginationItemComponent: ForwardRefExoticComponent<ChakraPagination.ItemProps> = React.forwardRef<
  HTMLButtonElement,
  ChakraPagination.ItemProps
>(function PaginationItem(props: ChakraPagination.ItemProps, ref: React.Ref<HTMLButtonElement>): React.ReactElement {
  const { page }: { page: number } = usePaginationContext()
  const { size, variantMap, getHref }: ButtonVariantContext = useRootProps()
  const current: boolean = page === props.value
  const variant: ButtonProps["variant"] = current ? variantMap.current : variantMap.default
  if (getHref) {
    const itemHref: string = getHref(props.value)
    return (
      <LinkButton href={itemHref} variant={variant} size={size}>
        {props.value}
      </LinkButton>
    )
  }
  return (
    <ChakraPagination.Item ref={ref} {...props} asChild>
      <Button variant={variant} size={size}>
        {props.value}
      </Button>
    </ChakraPagination.Item>
  )
})

PaginationItemComponent.displayName = "PaginationItem"

export const PaginationItem: React.MemoExoticComponent<
  React.ForwardRefExoticComponent<ChakraPagination.ItemProps & React.RefAttributes<HTMLButtonElement>>
> = React.memo(PaginationItemComponent)

/**
 * @interface PaginationTriggerProps
 * @extends Omit<ChakraPagination.PrevTriggerProps, 'onMouseEnter'>
 * @description Base props for previous and next pagination triggers, adding an optional onMouseEnter.
 *              The event handler's target can be either an HTML button or an HTML anchor element.
 * @property {React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>} [onMouseEnter] - Optional mouse enter handler for prefetching.
 */
interface PaginationTriggerProps extends Omit<ChakraPagination.PrevTriggerProps, "onMouseEnter"> {
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
}

/**
 * @component PaginationPrevTrigger
 * @description The button to navigate to the previous page.
 *              Supports both button and link types, and includes an optional `onMouseEnter` prop for prefetching.
 * @param {PaginationTriggerProps} props - The props for the component.
 * @param {React.Ref<HTMLButtonElement>} ref - Ref to the button element.
 * @returns {React.ReactElement} The rendered previous page button/link.
 */
const PaginationPrevTriggerComponent: ForwardRefExoticComponent<PaginationTriggerProps> = React.forwardRef<
  HTMLButtonElement,
  PaginationTriggerProps
>(function PaginationPrevTrigger(props: PaginationTriggerProps, ref: React.Ref<HTMLButtonElement>): React.ReactElement {
  const { onMouseEnter, ...restProps }: PaginationTriggerProps = props
  const { size, variantMap, getHref }: ButtonVariantContext = useRootProps()
  const { previousPage }: { previousPage: number | null } = usePaginationContext()
  if (getHref) {
    const prevHref: string | undefined = previousPage != null ? getHref(previousPage) : undefined
    return (
      <LinkButton href={prevHref} variant={variantMap.default} size={size} onMouseEnter={onMouseEnter}>
        <HiChevronLeft />
      </LinkButton>
    )
  }
  return (
    <ChakraPagination.PrevTrigger ref={ref} asChild {...restProps}>
      <IconButton variant={variantMap.default} size={size} onMouseEnter={onMouseEnter}>
        <HiChevronLeft />
      </IconButton>
    </ChakraPagination.PrevTrigger>
  )
})

PaginationPrevTriggerComponent.displayName = "PaginationPrevTrigger"

export const PaginationPrevTrigger: React.MemoExoticComponent<
  React.ForwardRefExoticComponent<PaginationTriggerProps & React.RefAttributes<HTMLButtonElement>>
> = React.memo(PaginationPrevTriggerComponent)

/**
 * @component PaginationNextTrigger
 * @description The button to navigate to the next page.
 *              Supports both button and link types, and includes an optional `onMouseEnter` prop for prefetching.
 * @param {PaginationTriggerProps} props - The props for the component.
 * @param {React.Ref<HTMLButtonElement>} ref - Ref to the button element.
 * @returns {React.ReactElement} The rendered next page button/link.
 */
const PaginationNextTriggerComponent: ForwardRefExoticComponent<PaginationTriggerProps> = React.forwardRef<
  HTMLButtonElement,
  PaginationTriggerProps
>(function PaginationNextTrigger(props: PaginationTriggerProps, ref: React.Ref<HTMLButtonElement>): React.ReactElement {
  const { onMouseEnter, ...restProps }: PaginationTriggerProps = props
  const { size, variantMap, getHref }: ButtonVariantContext = useRootProps()
  const { nextPage }: { nextPage: number | null } = usePaginationContext()
  if (getHref) {
    const nextHref: string | undefined = nextPage != null ? getHref(nextPage) : undefined
    return (
      <LinkButton href={nextHref} variant={variantMap.default} size={size} onMouseEnter={onMouseEnter}>
        <HiChevronRight />
      </LinkButton>
    )
  }
  return (
    <ChakraPagination.NextTrigger ref={ref} asChild {...restProps}>
      <IconButton variant={variantMap.default} size={size} onMouseEnter={onMouseEnter}>
        <HiChevronRight />
      </IconButton>
    </ChakraPagination.NextTrigger>
  )
})

PaginationNextTriggerComponent.displayName = "PaginationNextTrigger"

export const PaginationNextTrigger: React.MemoExoticComponent<
  React.ForwardRefExoticComponent<PaginationTriggerProps & React.RefAttributes<HTMLButtonElement>>
> = React.memo(PaginationNextTriggerComponent)

/**
 * @interface PaginationItemsProps
 * @extends React.HTMLAttributes<HTMLElement>
 * @description Props for the PaginationItems component. Currently, extends standard HTML attributes.
 */
interface PaginationItemsProps extends React.HTMLAttributes<HTMLElement> {}

/**
 * @component PaginationItems
 * @description Renders a sequence of pagination item components (page numbers or ellipsis) based on the context.
 * @param {PaginationItemsProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered list of pagination items.
 */
const PaginationItemsComponent: NamedExoticComponent<PaginationItemsProps> = React.memo(function PaginationItems(
  props: PaginationItemsProps,
): React.ReactElement {
  return (
    <ChakraPagination.Context>
      {({
        pages,
      }: {
        pages: Array<{ type: "page"; value: number } | { type: "ellipsis" }>
      }) =>
        pages.map((page: { type: "page"; value: number } | { type: "ellipsis" }, index: number): React.ReactElement => {
          return page.type === "ellipsis" ? (
            <PaginationEllipsis key={index} index={index} {...props} /> // index is passed from map, not page object
          ) : (
            <PaginationItem key={index} type="page" value={page.value} {...props} />
          )
        })
      }
    </ChakraPagination.Context>
  )
})

PaginationItemsComponent.displayName = "PaginationItems"

export const PaginationItems: React.MemoExoticComponent<React.FunctionComponent<PaginationItemsProps>> =
  React.memo(PaginationItemsComponent)

/**
 * @interface PageTextProps
 * @extends TextProps
 * @description Props for the PaginationPageText component.
 * @property {"short" | "compact" | "long"} [format="compact"] - The format for displaying page text.
 *                                                                "short" (e.g., "1 / 10"),
 *                                                                "compact" (e.g., "1 of 10"),
 *                                                                "long" (e.g., "1 - 5 of 20").
 */
interface PageTextProps extends TextProps {
  format?: "short" | "compact" | "long"
}

/**
 * @component PaginationPageText
 * @description Displays the current page information (e.g., "Page 1 of 5").
 * @param {PageTextProps} props - The props for the component.
 * @param {React.Ref<HTMLParagraphElement>} ref - Ref to the paragraph element.
 * @returns {React.ReactElement} The rendered page text.
 */
const PaginationPageTextComponent: ForwardRefExoticComponent<PageTextProps> = React.forwardRef<
  HTMLParagraphElement,
  PageTextProps
>(function PaginationPageText(props: PageTextProps, ref: React.Ref<HTMLParagraphElement>): React.ReactElement {
  const { format = "compact", ...rest }: PageTextProps = props
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
})

PaginationPageTextComponent.displayName = "PaginationPageText"

export const PaginationPageText: React.MemoExoticComponent<
  React.ForwardRefExoticComponent<PageTextProps & React.RefAttributes<HTMLParagraphElement>>
> = React.memo(PaginationPageTextComponent)
