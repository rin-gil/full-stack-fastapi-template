/**
 * @file Utility functions and constants for form validation and error handling.
 * @description This module provides reusable, framework-agnostic helpers.
 */

import type { ApiError } from "./client"

/**
 * Validation pattern for email addresses.
 * Intended for use with form validation libraries like React Hook Form.
 */
export const emailPattern = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "Invalid email address",
}

export const namePattern = {
  value: /^(?=.{1,30}$)\p{L}(?:[\p{L}\s\-'’]*\p{L})?$/u,
  message:
    "Name must be 1-30 characters, start and end with a letter, and can contain spaces, hyphens, or apostrophes.",
}

// A helper type for React Hook Form rules
export type ValidationRules = {
  required?: string
  minLength?: { value: number; message: string }
  validate?: (value: any) => boolean | string
}

/**
 * Generates validation rules for a password field.
 *
 * @param isRequired - Whether the password is required. Defaults to true.
 * @returns An object with validation rules for React Hook Form.
 */
export const passwordRules = (isRequired = true): ValidationRules => {
  const rules: ValidationRules = {
    minLength: { value: 8, message: "Password must be at least 8 characters" },
  }
  if (isRequired) {
    rules.required = "Password is required"
  }
  return rules
}

/**
 * Generates validation rules for a password confirmation field.
 * Checks if the value matches another password field.
 *
 * @param getValues - A function from React Hook Form's `useForm` that returns current form values.
 * @param isRequired - Whether the confirmation is required. Defaults to true.
 * @returns An object with validation rules for React Hook Form.
 */
export const confirmPasswordRules = (
  getValues: () => Record<string, any>,
  isRequired = true,
): ValidationRules => {
  const rules: ValidationRules = {
    /**
     * Validates that a confirmation password matches the original password.
     *
     * @param value - The confirmation password to validate.
     * @returns True if the confirmation password matches; otherwise, an error message.
     */
    validate: (value: any): true | "The passwords do not match" => {
      const password: any = getValues().password || getValues().new_password
      if (!password) {
        return true
      }
      return value === password ? true : "The passwords do not match"
    },
  }
  if (isRequired) {
    rules.required = "Password confirmation is required"
  }
  return rules
}

/**
 * Safely extracts a user-friendly error message from an ApiError object.
 * It checks for different structures of the error body from the backend.
 *
 * @param err The ApiError object or other error thrown by the client.
 * @returns A string containing the error message.
 */
export const extractApiErrorMessage = (err: unknown): string => {
  // Ensure we are dealing with an ApiError-like object
  if (
    typeof err === "object" &&
    err !== null &&
    "body" in err &&
    "status" in err
  ) {
    const body = (err as ApiError).body as unknown
    // Check if body is an object and has a 'detail' property
    if (typeof body === "object" && body !== null && "detail" in body) {
      const detail: unknown = (body as { detail: unknown }).detail
      // Case 1: Detail is an array of objects (FastAPI validation error)
      if (
        Array.isArray(detail) &&
        detail.length > 0 &&
        typeof detail[0] === "object" &&
        detail[0] !== null &&
        "msg" in detail[0]
      ) {
        // We can be reasonably sure it's a validation error message
        return String((detail[0] as { msg: unknown }).msg)
      }
      // Case 2: Detail is a simple string
      if (typeof detail === "string") {
        return detail
      }
    }
  }
  // Also handle cases where the error might be a simple Error object
  if (err instanceof Error) {
    return err.message
  }
  // Fallback for unknown error structures
  return "An unexpected error occurred."
}
