/**
 * @file Application-wide utility functions and constants.
 * @description Provides reusable helpers for form validation (e.g., regex patterns)
 * and a standardized function for extracting user-friendly error messages from API responses.
 * @module utils
 */

import type { ApiError } from "./client"

// region Type Aliases

/**
 * @type ValidationRules
 * @description Structure for React Hook Form validation rules.
 */
type ValidationRules = {
  required?: string
  minLength?: { value: number; message: string }
  validate?: (value: string) => boolean | string
}

/**
 * @type Pattern
 * @description Structure for validation pattern with RegExp and error message.
 */
type Pattern = { value: RegExp; message: string }

// endregion

// region Main Code

/**
 * Validation pattern for email addresses.
 * @type {Pattern}
 */
export const emailPattern: Pattern = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "Invalid email address",
}

/**
 * Validation pattern for usernames, supporting Unicode letters.
 *
 * @type {Pattern}
 */
export const namePattern: Pattern = {
  value: /^(?=.{3,30}$)\p{L}(?:[\p{L}\s\-'’]*\p{L})?$/u,
  message:
    "Name must be 1-30 characters, start and end with a letter, and can contain spaces, hyphens, or apostrophes.",
}

/**
 * Generates validation rules for a password field.
 *
 * @param {boolean} [isRequired=true] - Indicates if the password field is required.
 * @returns {ValidationRules} Validation rules for the password field.
 */
// biome-ignore lint/style/noInferrableTypes: Enforcing explicit types for clarity as per project style guide.
export const passwordRules = (isRequired: boolean = true): ValidationRules => {
  const rules: ValidationRules = { minLength: { value: 8, message: "Password must be at least 8 characters" } }
  if (isRequired) {
    rules.required = "Password is required"
  }
  return rules
}

/**
 * Generates validation rules for a password confirmation field.
 *
 * @param {() => Record<string, string>} getValues - React Hook Form's getValues function to access form values.
 * @param {boolean} [isRequired=true] - Indicates if the confirmation field is required.
 * @returns {ValidationRules} Validation rules for the password confirmation field.
 */
export const confirmPasswordRules = (
  getValues: () => Record<string, string>,
  // biome-ignore lint/style/noInferrableTypes: Enforcing explicit types for clarity as per project style guide.
  isRequired: boolean = true,
): ValidationRules => {
  const rules: ValidationRules = {
    validate: (value: string): true | "The passwords do not match" => {
      const password: string = getValues().password || getValues().new_password
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
 * Extracts a user-friendly error message from an API error.
 *
 * @param {unknown} error - The error object, expected to be ApiError, Error, or unknown.
 * @returns {string} A user-friendly error message.
 */
export const extractApiErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "body" in error && "status" in error) {
    const body = (error as ApiError).body as unknown
    if (typeof body === "object" && body !== null && "detail" in body) {
      const detail: unknown = (body as { detail: unknown }).detail
      if (
        Array.isArray(detail) &&
        detail.length > 0 &&
        typeof detail[0] === "object" &&
        detail[0] !== null &&
        "msg" in detail[0]
      ) {
        return String((detail[0] as { msg: unknown }).msg)
      }
      if (typeof detail === "string") {
        return detail
      }
    }
  }
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred."
}

// endregion
