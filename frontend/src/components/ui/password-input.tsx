/**
 * @file Contains the PasswordInput component, a specialized input field for password entry.
 * @description Enhances the Chakra UI Input with a visibility toggle and type-safe integration with react-hook-form.
 * @module PasswordInput
 */

"use client"

import type { ButtonProps, GroupProps, InputProps } from "@chakra-ui/react"
import { IconButton, Input, mergeRefs, useControllableState } from "@chakra-ui/react"
import type * as React from "react"
import type { ForwardedRef, RefObject } from "react"
import { forwardRef, useRef } from "react"
import type { FieldError, FieldErrors, FieldValues, Path } from "react-hook-form"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { Field } from "./field"
import { InputGroup } from "./input-group"

// region Type Aliases

/**
 * Props for controlling the visibility of the password.
 * @interface PasswordVisibilityProps
 */
interface PasswordVisibilityProps {
  /**
   * The initial visibility state of the password when uncontrolled.
   * @type {boolean}
   */
  defaultVisible?: boolean
  /**
   * The controlled visibility state of the password.
   * @type {boolean}
   */
  visible?: boolean
  /**
   * Callback fired when the visibility state changes.
   * @type {(visible: boolean) => void}
   */
  onVisibleChange?: (visible: boolean) => void
  /**
   * Custom icons for the visibility toggle.
   * @type {{ on: React.ReactElement; off: React.ReactElement }}
   */
  visibilityIcon?: { on: React.ReactElement; off: React.ReactElement }
}

/**
 * Props for the PasswordInput component.
 * @interface PasswordInputProps
 * @extends Omit<InputProps, "name" | "type">
 * @extends PasswordVisibilityProps
 */
interface PasswordInputProps extends Omit<InputProps, "name" | "type">, PasswordVisibilityProps {
  /**
   * Props to be passed to the root InputGroup component.
   * @type {GroupProps}
   */
  rootProps?: GroupProps
  /**
   * An element to be placed at the start of the input.
   * @type {React.ReactElement}
   */
  startElement?: React.ReactElement
  /**
   * The name of the field in react-hook-form.
   * @type {Path<FieldValues>}
   */
  name: Path<FieldValues>
  /**
   * The errors object from react-hook-form.
   * @type {FieldErrors}
   */
  errors: FieldErrors
}

/**
 * Return type for useControllableState hook.
 * @type {UseControllableStateReturn}
 */
type UseControllableStateReturn = [boolean, (value: boolean) => void]

/**
 * Type alias for the PasswordInput component.
 * @type {PasswordInputComponentType}
 */
type PasswordInputComponentType = React.ForwardRefExoticComponent<
  PasswordInputProps & React.RefAttributes<HTMLInputElement>
>

/**
 * Type alias for the VisibilityTrigger component.
 * @type {VisibilityTriggerComponentType}
 */
type VisibilityTriggerComponentType = React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>

// endregion

// region Main Code

/**
 * A password input field with a visibility toggle, designed for use with react-hook-form.
 * Wraps the standard Input in a Field component to display validation errors.
 * @param {PasswordInputProps} props - The props for the component, destructured.
 * @param {GroupProps} [props.rootProps] - Props passed to the InputGroup component.
 * @param {boolean} [props.defaultVisible] - Initial visibility state when uncontrolled.
 * @param {boolean} [props.visible] - Controlled visibility state.
 * @param {(visible: boolean) => void} [props.onVisibleChange] - Callback for visibility changes.
 * @param {{ on: React.ReactElement; off: React.ReactElement }} [props.visibilityIcon] - Custom icons for toggle.
 * @param {React.ReactElement} [props.startElement] - Element at the start of the input.
 * @param {Path<FieldValues>} props.name - Field name for react-hook-form.
 * @param {FieldErrors<FieldValues>} props.errors - Form errors from react-hook-form.
 * @param {Omit<InputProps, "name" | "type">} props.rest - Other Chakra UI Input props.
 * @param {ForwardedRef<HTMLInputElement>} ref - Ref forwarded to the input element.
 * @returns {React.ReactElement} The rendered password input component.
 */
const PasswordInputComponent: PasswordInputComponentType = forwardRef(function PasswordInput(
  {
    rootProps,
    defaultVisible,
    visible: visibleProp,
    onVisibleChange,
    visibilityIcon = { on: <FiEye />, off: <FiEyeOff /> },
    startElement,
    name,
    errors,
    ...rest
  }: PasswordInputProps,
  ref: ForwardedRef<HTMLInputElement>,
): React.ReactElement {
  /**
   * State and setter for controlling password visibility.
   * @type {UseControllableStateReturn}
   */
  const [visible, setVisible]: UseControllableStateReturn = useControllableState({
    value: visibleProp,
    defaultValue: defaultVisible || false,
    onChange: onVisibleChange,
  })

  /**
   * Ref to the input element.
   * @type {RefObject<HTMLInputElement>}
   */
  const inputRef: RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null)

  /**
   * Error for the current field, if any.
   * @type {FieldError | undefined}
   */
  const fieldError: FieldError | undefined = errors[name] as FieldError | undefined

  return (
    <Field invalid={!!fieldError} errorText={typeof fieldError?.message === "string" ? fieldError.message : undefined}>
      <InputGroup
        width="100%"
        startElement={startElement}
        endElement={
          <VisibilityTrigger
            disabled={rest.disabled}
            onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
              if (rest.disabled) return
              e.preventDefault()
              setVisible(!visible)
            }}
          >
            {visible ? visibilityIcon.off : visibilityIcon.on}
          </VisibilityTrigger>
        }
        {...rootProps}
      >
        <Input {...rest} name={name} ref={mergeRefs(ref, inputRef)} type={visible ? "text" : "password"} />
      </InputGroup>
    </Field>
  )
})

/**
 * Internal IconButton to toggle password visibility. Not exported, used only within PasswordInput.
 * @param {ButtonProps} props - The props for the component, destructured.
 * @param {boolean} [props.disabled] - Whether the button is disabled.
 * @param {React.MouseEventHandler<HTMLButtonElement>} [props.onClick] - Click handler for toggling visibility.
 * @param {React.ReactNode} props.children - The icon to display.
 * @param {Omit<ButtonProps, "children" | "onClick" | "disabled">} props.rest - Other Chakra UI Button props.
 * @param {ForwardedRef<HTMLButtonElement>} ref - Ref forwarded to the button element.
 * @returns {React.ReactElement} The rendered IconButton component.
 */
const VisibilityTrigger: VisibilityTriggerComponentType = forwardRef(function VisibilityTrigger(
  { children, disabled, onClick, ...rest }: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  return (
    <IconButton
      tabIndex={-1}
      ref={ref}
      marginEnd="-2"
      aspectRatio="square"
      size="sm"
      variant="ghost"
      height="calc(100% - var(--chakra-space-2))"
      aria-label="Toggle password visibility"
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </IconButton>
  )
})

// endregion

// region Optional Declarations

PasswordInputComponent.displayName = "PasswordInput"
export const PasswordInput: PasswordInputComponentType = PasswordInputComponent

VisibilityTrigger.displayName = "VisibilityTrigger"

// endregion
