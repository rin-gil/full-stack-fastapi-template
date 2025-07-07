/**
 * @file This module defines the `PasswordInput` component, a specialized and reusable
 * input field for password entry.
 *
 * @description It enhances the standard Chakra UI Input by adding a visibility toggle
 * and providing deep, type-safe integration with `react-hook-form`.
 */

"use client"

import type React from "react"
import type { PointerEvent, ReactNode, RefObject } from "react"
import { forwardRef, useRef } from "react"

import type { ButtonProps, GroupProps, InputProps } from "@chakra-ui/react"
import { IconButton, Input, mergeRefs, useControllableState } from "@chakra-ui/react"
import type { FieldError, FieldErrors, FieldValues, Path } from "react-hook-form"
import { FiEye, FiEyeOff } from "react-icons/fi"

import { Field } from "./field"
import { InputGroup } from "./input-group"

/**
 * @interface PasswordVisibilityProps
 * @description Props for controlling the visibility of the password.
 */
export interface PasswordVisibilityProps {
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
   * @param {boolean} visible - The new visibility state.
   */
  onVisibleChange?: (visible: boolean) => void
  /**
   * Custom icons for the visibility toggle.
   * @type {{ on: ReactNode; off: ReactNode }}
   */
  visibilityIcon?: { on: ReactNode; off: ReactNode }
}

// noinspection JSValidateJSDoc
/**
 * @interface PasswordInputProps
 * @description Defines the props for the PasswordInput component.
 * @template TFieldValues - The type of the form values.
 * @extends Omit<InputProps, "name" | "type">
 * @extends PasswordVisibilityProps
 */
export interface PasswordInputProps<TFieldValues extends FieldValues>
  extends Omit<InputProps, "name" | "type">,
    PasswordVisibilityProps {
  /**
   * Props to be passed to the root `InputGroup` component.
   * @type {GroupProps}
   */
  rootProps?: GroupProps
  /**
   * An element to be placed at the start of the input.
   * @type {ReactNode}
   */
  startElement?: ReactNode
  /**
   * The name of the field in `react-hook-form`.
   * @type {Path<TFieldValues>}
   */
  name: Path<TFieldValues>
  /**
   * The errors object from `react-hook-form`.
   * @type {FieldErrors<TFieldValues>}
   */
  errors: FieldErrors<TFieldValues>
}

/**
 * A password input field with a visibility toggle, designed for use with
 * `react-hook-form`. It wraps the standard Input in a Field component to
 * display validation errors.
 *
 * @template TFieldValues - The type of the form values, extending `FieldValues`.
 * @param {PasswordInputProps<TFieldValues>} props - The props for the component, destructured.
 * @param {React.Ref<HTMLInputElement>} ref - The ref forwarded to the underlying input element.
 * @returns {React.ReactNode} The rendered password input component with a visibility toggle.
 */
export const PasswordInput = forwardRef(function PasswordInput<TFieldValues extends FieldValues>(
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
  }: PasswordInputProps<TFieldValues>,
  ref: React.Ref<HTMLInputElement>,
): React.ReactNode {
  const [visible, setVisible]: [boolean, (value: boolean) => void] = useControllableState({
    value: visibleProp,
    defaultValue: defaultVisible || false,
    onChange: onVisibleChange,
  })

  const inputRef: RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null)

  const fieldError: FieldError | undefined = errors[name] as FieldError | undefined

  return (
    <Field invalid={!!fieldError} errorText={fieldError?.message as ReactNode}>
      <InputGroup
        width="100%"
        startElement={startElement}
        endElement={
          <VisibilityTrigger
            disabled={rest.disabled}
            onPointerDown={(e: PointerEvent<HTMLButtonElement>): void => {
              if (rest.disabled) return
              if (e.button !== 0) return
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
 * An internal IconButton used to toggle password visibility.
 * It is not exported and is intended for use only within PasswordInput.
 *
 * @param {ButtonProps} props - The props for the component, destructured.
 * @param {React.Ref<HTMLButtonElement>} ref - The ref forwarded to the underlying button element.
 * @returns {React.ReactNode} The rendered IconButton component.
 */
const VisibilityTrigger = forwardRef<HTMLButtonElement, ButtonProps>(function VisibilityTrigger(
  { children, ...rest }: ButtonProps,
  ref: React.Ref<HTMLButtonElement>,
): React.ReactNode {
  return (
    <IconButton
      tabIndex={-1}
      ref={ref}
      me="-2"
      aspectRatio="square"
      size="sm"
      variant="ghost"
      height="calc(100% - {spacing.2})"
      aria-label="Toggle password visibility"
      color="inherit"
      {...rest}
    >
      {children}
    </IconButton>
  )
})

PasswordInput.displayName = "PasswordInput"
VisibilityTrigger.displayName = "VisibilityTrigger"
