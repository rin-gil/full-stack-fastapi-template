/**
 * @file Defines custom Menu components for dropdown menus.
 * @description Provides Chakra UI-based menu components with custom checkbox, radio, and trigger items.
 * @module Menu
 */

"use client"

import {
  AbsoluteCenter,
  Menu as ChakraMenu,
  type MenuArrowProps,
  type MenuCheckboxItemProps,
  type MenuItemGroupProps,
  type MenuRadioItemProps,
  Portal,
} from "@chakra-ui/react"
import * as React from "react"
import type { FC } from "react"
import { LuCheck, LuChevronRight } from "react-icons/lu"

// region Type Aliases

/**
 * Props for the MenuContent component.
 * @interface MenuContentProps
 */
interface MenuContentProps extends ChakraMenu.ContentProps {
  /** Whether to use a portal for rendering. */
  portalled?: boolean
  /** Reference to the portal container. */
  portalRef?: React.RefObject<HTMLElement>
}

/**
 * Props for the MenuTriggerItem component.
 * @interface MenuTriggerItemProps
 */
interface MenuTriggerItemProps extends ChakraMenu.ItemProps {
  /** Icon to display at the start of the item. */
  startIcon?: React.ReactNode
}

/**
 * Type alias for the MenuRoot component.
 * @type {MenuRootComponent}
 */
type MenuRootComponent = FC<ChakraMenu.RootProps>

/**
 * Type alias for the MenuContent component.
 * @type {MenuContentComponent}
 */
type MenuContentComponent = FC<MenuContentProps>

/**
 * Type alias for the MenuArrow component.
 * @type {MenuArrowComponent}
 */
type MenuArrowComponent = FC<ChakraMenu.ArrowProps>

/**
 * Type alias for the MenuCheckboxItem component.
 * @type {MenuCheckboxItemComponent}
 */
type MenuCheckboxItemComponent = FC<ChakraMenu.CheckboxItemProps>

/**
 * Type alias for the MenuRadioItem component.
 * @type {MenuRadioItemComponent}
 */
type MenuRadioItemComponent = FC<ChakraMenu.RadioItemProps>

/**
 * Type alias for the MenuItemGroup component.
 * @type {MenuItemGroupComponent}
 */
type MenuItemGroupComponent = FC<ChakraMenu.ItemGroupProps>

/**
 * Type alias for the MenuTriggerItem component.
 * @type {MenuTriggerItemComponent}
 */
type MenuTriggerItemComponent = FC<MenuTriggerItemProps>

/**
 * Type alias for the MenuRadioItemGroup component.
 * @type {MenuRadioItemGroupComponent}
 */
type MenuRadioItemGroupComponent = FC<ChakraMenu.RadioItemGroupProps>

/**
 * Type alias for the MenuContextTrigger component.
 * @type {MenuContextTriggerComponent}
 */
type MenuContextTriggerComponent = FC<ChakraMenu.ContextTriggerProps>

/**
 * Type alias for the MenuSeparator component.
 * @type {MenuSeparatorComponent}
 */
type MenuSeparatorComponent = FC<ChakraMenu.SeparatorProps>

/**
 * Type alias for the MenuItem component.
 * @type {MenuItemComponent}
 */
type MenuItemComponent = FC<ChakraMenu.ItemProps>

/**
 * Type alias for the MenuItemText component.
 * @type {MenuItemTextComponent}
 */
type MenuItemTextComponent = FC<ChakraMenu.ItemTextProps>

/**
 * Type alias for the MenuItemCommand component.
 * @type {MenuItemCommandComponent}
 */
type MenuItemCommandComponent = FC<ChakraMenu.ItemCommandProps>

/**
 * Type alias for the MenuTrigger component.
 * @type {MenuTriggerComponent}
 */
type MenuTriggerComponent = FC<ChakraMenu.TriggerProps>

// endregion

// region Main Code

/**
 * MenuRoot component for initializing the menu.
 * @type {MenuRootComponent}
 */
export const MenuRoot: MenuRootComponent = ChakraMenu.Root

/**
 * MenuContent component for rendering menu content with portal support.
 * @param {MenuContentProps} props - Props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered MenuContent component.
 */
export const MenuContent: MenuContentComponent = React.memo(
  React.forwardRef<HTMLDivElement, MenuContentProps>(function MenuContent(
    props: MenuContentProps,
    ref: React.Ref<HTMLDivElement>,
  ): React.ReactElement {
    const { portalled = true, portalRef, ...rest } = props
    return (
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraMenu.Positioner>
          <ChakraMenu.Content ref={ref} {...rest} />
        </ChakraMenu.Positioner>
      </Portal>
    )
  }),
)

/**
 * MenuArrow component for rendering the menu arrow.
 * @param {ChakraMenu.ArrowProps} props - Props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered MenuArrow component.
 */
export const MenuArrow: MenuArrowComponent = React.memo(
  React.forwardRef<HTMLDivElement, ChakraMenu.ArrowProps>(function MenuArrow(
    props: MenuArrowProps,
    ref: React.Ref<HTMLDivElement>,
  ): React.ReactElement {
    return (
      <ChakraMenu.Arrow ref={ref} {...props}>
        <ChakraMenu.ArrowTip />
      </ChakraMenu.Arrow>
    )
  }),
)

/**
 * MenuCheckboxItem component for rendering checkbox items in the menu.
 * @param {ChakraMenu.CheckboxItemProps} props - Props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered MenuCheckboxItem component.
 */
export const MenuCheckboxItem: MenuCheckboxItemComponent = React.memo(
  React.forwardRef<HTMLDivElement, ChakraMenu.CheckboxItemProps>(function MenuCheckboxItem(
    props: MenuCheckboxItemProps,
    ref: React.Ref<HTMLDivElement>,
  ): React.ReactElement {
    return (
      <ChakraMenu.CheckboxItem ps="8" ref={ref} {...props}>
        <AbsoluteCenter axis="horizontal" insetStart="4" asChild>
          <ChakraMenu.ItemIndicator>
            <LuCheck />
          </ChakraMenu.ItemIndicator>
        </AbsoluteCenter>
        {props.children}
      </ChakraMenu.CheckboxItem>
    )
  }),
)

/**
 * MenuRadioItem component for rendering radio items in the menu.
 * @param {ChakraMenu.RadioItemProps} props - Props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered MenuRadioItem component.
 */
export const MenuRadioItem: MenuRadioItemComponent = React.memo(
  React.forwardRef<HTMLDivElement, ChakraMenu.RadioItemProps>(function MenuRadioItem(
    props: MenuRadioItemProps,
    ref: React.Ref<HTMLDivElement>,
  ): React.ReactElement {
    const { children, ...rest } = props
    return (
      <ChakraMenu.RadioItem ps="8" ref={ref} {...rest}>
        <AbsoluteCenter axis="horizontal" insetStart="4" asChild>
          <ChakraMenu.ItemIndicator>
            <LuCheck />
          </ChakraMenu.ItemIndicator>
        </AbsoluteCenter>
        <ChakraMenu.ItemText>{children}</ChakraMenu.ItemText>
      </ChakraMenu.RadioItem>
    )
  }),
)

/**
 * MenuItemGroup component for rendering grouped menu items.
 * @param {ChakraMenu.ItemGroupProps} props - Props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered MenuItemGroup component.
 */
export const MenuItemGroup: MenuItemGroupComponent = React.memo(
  React.forwardRef<HTMLDivElement, ChakraMenu.ItemGroupProps>(function MenuItemGroup(
    props: MenuItemGroupProps,
    ref: React.Ref<HTMLDivElement>,
  ): React.ReactElement {
    const { title, children, ...rest } = props
    const label: React.ReactElement | null = title ? (
      <ChakraMenu.ItemGroupLabel userSelect="none">{title}</ChakraMenu.ItemGroupLabel>
    ) : null
    return (
      <ChakraMenu.ItemGroup ref={ref} {...rest}>
        {label}
        {children}
      </ChakraMenu.ItemGroup>
    )
  }),
)

/**
 * MenuTriggerItem component for rendering items that trigger submenus.
 * @param {MenuTriggerItemProps} props - Props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered MenuTriggerItem component.
 */
export const MenuTriggerItem: MenuTriggerItemComponent = React.memo(
  React.forwardRef<HTMLDivElement, MenuTriggerItemProps>(function MenuTriggerItem(
    props: MenuTriggerItemProps,
    ref: React.Ref<HTMLDivElement>,
  ): React.ReactElement {
    const { startIcon, children, ...rest } = props
    return (
      <ChakraMenu.TriggerItem ref={ref} {...rest}>
        {startIcon && startIcon}
        {children}
        <LuChevronRight />
      </ChakraMenu.TriggerItem>
    )
  }),
)

/**
 * MenuRadioItemGroup component for grouping radio items.
 * @type {MenuRadioItemGroupComponent}
 */
export const MenuRadioItemGroup: MenuRadioItemGroupComponent = ChakraMenu.RadioItemGroup

/**
 * MenuContextTrigger component for context menu triggers.
 * @type {MenuContextTriggerComponent}
 */
export const MenuContextTrigger: MenuContextTriggerComponent = ChakraMenu.ContextTrigger

/**
 * MenuSeparator component for separating menu items.
 * @type {MenuSeparatorComponent}
 */
export const MenuSeparator: MenuSeparatorComponent = ChakraMenu.Separator

/**
 * MenuItem component for rendering standard menu items.
 * @type {MenuItemComponent}
 */
export const MenuItem: MenuItemComponent = ChakraMenu.Item

/**
 * MenuItemText component for rendering text in menu items.
 * @type {MenuItemTextComponent}
 */
export const MenuItemText: MenuItemTextComponent = ChakraMenu.ItemText

/**
 * MenuItemCommand component for rendering commands in menu items.
 * @type {MenuItemCommandComponent}
 */
export const MenuItemCommand: MenuItemCommandComponent = ChakraMenu.ItemCommand

/**
 * MenuTrigger component for triggering the menu.
 * @type {MenuTriggerComponent}
 */
export const MenuTrigger: MenuTriggerComponent = ChakraMenu.Trigger

// endregion

// region Optional Declarations

MenuRoot.displayName = "MenuRoot"
MenuContent.displayName = "MenuContent"
MenuArrow.displayName = "MenuArrow"
MenuCheckboxItem.displayName = "MenuCheckboxItem"
MenuRadioItem.displayName = "MenuRadioItem"
MenuItemGroup.displayName = "MenuItemGroup"
MenuTriggerItem.displayName = "MenuTriggerItem"
MenuRadioItemGroup.displayName = "MenuRadioItemGroup"
MenuContextTrigger.displayName = "MenuContextTrigger"
MenuSeparator.displayName = "MenuSeparator"
MenuItem.displayName = "MenuItem"
MenuItemText.displayName = "MenuItemText"
MenuItemCommand.displayName = "MenuItemCommand"
MenuTrigger.displayName = "MenuTrigger"

// endregion
