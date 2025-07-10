/**
 * @file Defines a custom LinkButton component.
 * @description Wraps the TanStack Router Link component with Chakra UI button styles.
 * Provides a styled navigation link that integrates with the application's routing system.
 * @module LinkButton
 */

import type { HTMLChakraProps, RecipeProps } from "@chakra-ui/react"
import { createRecipeContext } from "@chakra-ui/react"
import { Link, type LinkProps } from "@tanstack/react-router"
import type { ForwardedRef } from "react"
import * as React from "react"

// region Type Aliases

/**
 * Supported button variants from buttonRecipe.
 * @type {Variant}
 */
type Variant = "solid" | "ghost" | "outline" | "subtle" | "surface" | "plain"

/**
 * Props for the LinkButton component.
 * @interface LinkButtonProps
 * @extends HTMLChakraProps<"a", RecipeProps<"button">>
 */
interface LinkButtonProps extends HTMLChakraProps<"a", RecipeProps<"button">> {
  /**
   * The destination URL for navigation. Must match a route defined in routeTree.gen.ts.
   * @type {LinkProps["to"]}
   */
  to: LinkProps["to"]
  /**
   * The button style variant (e.g., "solid", "ghost").
   * @type {Variant | undefined}
   */
  variant?: Variant
}

/**
 * Type alias for the LinkButton component.
 * @type {LinkButtonComponent}
 */
type LinkButtonComponent = React.ForwardRefExoticComponent<LinkButtonProps & React.RefAttributes<HTMLAnchorElement>>

// endregion

// region Main Code

const { withContext } = createRecipeContext({ key: "button" })

/**
 * Custom LinkButton component styled as a button with TanStack Router navigation.
 * @param {LinkButtonProps} props - Props for the component, destructured.
 * @param {LinkProps["to"]} props.to - The destination URL for navigation.
 * @param {Variant} [props.variant="solid"] - The button style variant (e.g., "solid", "ghost").
 * @param {HTMLChakraProps<"a">} props.rest - Other Chakra UI props for the link.
 * @param {ForwardedRef<HTMLAnchorElement>} ref - Ref forwarded to the Link component.
 * @returns {React.ReactElement} The rendered LinkButton component.
 */
const LinkButton: LinkButtonComponent = withContext<HTMLAnchorElement, LinkButtonProps>(
  React.forwardRef(function LinkButton(
    { to, variant = "solid", ...rest }: LinkButtonProps,
    ref: ForwardedRef<HTMLAnchorElement>,
  ): React.ReactElement {
    // Filter props to include only those supported by Link
    const linkProps: Pick<LinkProps, "to" | "className" | "style" | "onClick" | "mask"> = {
      to,
      className: rest.className,
      style: rest.style,
      onClick: rest.onClick,
      mask: rest.mask as LinkProps["mask"],
    }
    return <Link {...linkProps} ref={ref} />
  }),
)

// endregion

// region Optional Declarations

LinkButton.displayName = "LinkButton"

// endregion

export { LinkButton, type LinkButtonProps }
