/**
 * @file Defines the `useCustomToast` hook.
 * @description Provides a centralized mechanism for displaying toast notifications.
 * It abstracts the underlying toast component implementation and offers standardized
 * functions for displaying messages about success, general errors, and specific
 * API errors, ensuring a consistent user experience when providing feedback.
 * @module useCustomToast
 */

"use client"

import type { ApiError } from "@/client"
import { toaster } from "@/components/ui/toaster"

// region Type Aliases

/**
 * Type representing the object returned by the useCustomToast hook.
 * @interface UseCustomToastReturn
 */
interface UseCustomToastReturn {
  /**
   * Displays a success toast with a custom message.
   * @param {string} description - The message to display.
   * @returns {void}
   */
  showSuccessToast: (description: string) => void
  /**
   * Displays a generic error toast with a custom message.
   * @param {string} description - The error message to display.
   * @returns {void}
   */
  showErrorToast: (description: string) => void
  /**
   * Displays an error toast with a message extracted from an API error.
   * @param {ApiError} error - The error object from a failed API call.
   * @returns {void}
   */
  showApiErrorToast: (error: ApiError) => void
}

// endregion

// region Main Code

/**
 * Provides a centralized mechanism for displaying toast notifications.
 * @returns {UseCustomToastReturn} An object containing functions to show various toasts.
 */
const useCustomToast = (): UseCustomToastReturn => {
  /**
   * Displays a success toast with a custom message.
   * @param {string} description - The message to display in the toast.
   * @returns {void}
   */
  const showSuccessToast = (description: string): void => {
    toaster.create({ title: "Success!", description, type: "success" })
  }

  /**
   * Displays a generic error toast with a custom message.
   * @param {string} description - The error message to display.
   * @returns {void}
   */
  const showErrorToast = (description: string): void => {
    toaster.create({ title: "Something went wrong!", description, type: "error" })
  }

  /**
   * Takes an API error object, extracts a user-friendly message,
   * and displays it in an error toast.
   * @param {ApiError} error - The error object, typically from a failed API call.
   * @returns {void}
   */
  const showApiErrorToast = (error: ApiError): void => {
    /**
     * The extracted user-friendly error message.
     * @type {string}
     */
    const errorMessage: string = error.getUserFriendlyMessage()
    /**
     * The title for the error toast, depending on whether a user-friendly message was extracted.
     * @type {string}
     */
    const title: string = errorMessage === error.message ? "Something went wrong!" : "Error:"
    /**
     * The description for the error toast, omitted if no user-friendly message was extracted.
     * @type {string | undefined}
     */
    const description: string | undefined = errorMessage === error.message ? undefined : errorMessage

    // Log technical details for debugging
    console.error(error.getFormattedMessage())

    toaster.create({ title, description, type: "error" })
  }

  return { showSuccessToast, showErrorToast, showApiErrorToast }
}

// endregion

// region Optional Declarations

export default useCustomToast

// endregion
