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
import {
  IconButton,
  Input,
  mergeRefs,
  useControllableState,
} from "@chakra-ui/react"
import type {
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form"
import { FiEye, FiEyeOff } from "react-icons/fi"

import { Field } from "./field"
import { InputGroup } from "./input-group"

export interface PasswordVisibilityProps {
  defaultVisible?: boolean
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
  visibilityIcon?: { on: ReactNode; off: ReactNode }
}

export interface PasswordInputProps<TFieldValues extends FieldValues>
  extends Omit<InputProps, "name" | "type">,
    PasswordVisibilityProps {
  rootProps?: GroupProps
  startElement?: ReactNode
  name: Path<TFieldValues>
  errors: FieldErrors<TFieldValues>
}

export const PasswordInput = forwardRef(function PasswordInput<
  TFieldValues extends FieldValues,
>(
  props: PasswordInputProps<TFieldValues>,
  ref: React.Ref<HTMLInputElement>,
): React.ReactNode {
  const {
    rootProps,
    defaultVisible,
    visible: visibleProp,
    onVisibleChange,
    visibilityIcon = { on: <FiEye />, off: <FiEyeOff /> },
    startElement,
    name,
    errors,
    ...rest
  } = props

  const [visible, setVisible]: [boolean, (value: boolean) => void] =
    useControllableState({
      value: visibleProp,
      defaultValue: defaultVisible || false,
      onChange: onVisibleChange,
    })

  const inputRef: RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null)

  const fieldError: FieldError | undefined = errors[name] as
    | FieldError
    | undefined

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
        <Input
          {...rest}
          name={name}
          ref={mergeRefs(ref, inputRef)}
          type={visible ? "text" : "password"}
        />
      </InputGroup>
    </Field>
  )
})

const VisibilityTrigger = forwardRef<HTMLButtonElement, ButtonProps>(
  function VisibilityTrigger(
    props: ButtonProps,
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
        {...props}
      />
    )
  },
)
