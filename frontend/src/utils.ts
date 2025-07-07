/**
 * @file Defines application-wide utility functions and constants.
 * @description This module provides reusable helpers for form validation (e.g., regex patterns)
 * and a standardized function for extracting user-friendly error messages from API responses.
 */

import type { ApiError } from "./client"

/**
 * Validation pattern object for email addresses.
 * @type {{value: RegExp, message: string}}
 */
export const emailPattern: { value: RegExp; message: string } = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "Invalid email address",
}

/**
 * Validation pattern object for user names. Supports Unicode letters.
 * @type {{value: RegExp, message: string}}
 */
export const namePattern: { value: RegExp; message: string } = {
  value: /^(?=.{3,30}$)\p{L}(?:[\p{L}\s\-'’]*\p{L})?$/u,
  message:
    "Name must be 1-30 characters, start and end with a letter, and can contain spaces, hyphens, or apostrophes.",
}

/**
 * @type ValidationRules
 * @description A helper type defining the structure for React Hook Form validation rules.
 */
export type ValidationRules = {
  required?: string
  minLength?: { value: number; message: string }
  validate?: (value: any) => boolean | string
}

/**
 * Generates validation rules for a password field.
 *
 * @param {boolean} [isRequired=true] - If true, a `required` rule is added.
 * @returns {ValidationRules} An object containing validation rules.
 */
// biome-ignore lint/style/noInferrableTypes: Enforcing explicit types for clarity as per project style guide.
export const passwordRules = (isRequired: boolean = true): ValidationRules => {
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
 *
 * @param {() => Record<string, any>} getValues - The `getValues` function from `react-hook-form`.
 * @param {boolean} [isRequired=true] - If true, a `required` rule is added.
 * @returns {ValidationRules} An object containing validation rules.
 */
export const confirmPasswordRules = (
  getValues: () => Record<string, any>,
  // biome-ignore lint/style/noInferrableTypes: Enforcing explicit types for clarity as per project style guide.
  isRequired: boolean = true,
): ValidationRules => {
  const rules: ValidationRules = {
    /**
     * Validates that a confirmation password matches the original password.
     *
     * @param {any} value - The value of the confirmation password field.
     * @returns {true | string} True if validation passes, or an error message string if it fails.
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
 * Safely extracts a user-friendly error message from an ApiError object or other error types.
 * It intelligently checks for different error structures from the backend.
 *
 * @param {unknown} err - The error object, which could be an ApiError, an Error, or unknown.
 * @returns {string} A user-friendly error message.
 */
export const extractApiErrorMessage = (err: unknown): string => {
  if (typeof err === "object" && err !== null && "body" in err && "status" in err) {
    const body = (err as ApiError).body as unknown
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

  if (err instanceof Error) {
    return err.message
  }

  return "An unexpected error occurred."
}
