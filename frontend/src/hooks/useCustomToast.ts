/**
 * @file Defines the `useCustomToast` hook.
 * @description Provides a centralized mechanism for displaying toast notifications.
 * It abstracts the underlying toast component implementation and offers standardized
 * functions for displaying messages about success, general errors, and specific
 * API errors, ensuring a consistent user experience when providing feedback.
 */

"use client"

import { toaster } from "@/components/ui/toaster"
import { extractApiErrorMessage } from "@/utils"

/**
 * @interface UseCustomToastReturn
 * @description Defines the object returned by the useCustomToast hook.
 */
interface UseCustomToastReturn {
  /**
   * Displays a success toast with a custom message.
   * @param {string} description - The message to display.
   */
  showSuccessToast: (description: string) => void
  /**
   * Displays a generic error toast with a custom message.
   * @param {string} description - The error message to display.
   */
  showErrorToast: (description: string) => void
  /**
   * Displays an error toast with a message extracted from an API error.
   * @param {unknown} error - The error object from a failed API call.
   */
  showApiErrorToast: (error: unknown) => void
}

/**
 * Provides a centralized mechanism for displaying toast notifications.
 *
 * @returns {UseCustomToastReturn} An object containing functions to show various toasts.
 */
const useCustomToast = (): UseCustomToastReturn => {
  /**
   * Displays a success toast with a custom message.
   *
   * @param {string} description - The message to display in the toast.
   */
  const showSuccessToast = (description: string): void => {
    toaster.create({
      title: "Success!",
      description,
      type: "success",
    })
  }

  /**
   * Displays a generic error toast with a custom message.
   *
   * @param {string} description - The error message to display.
   */
  const showErrorToast = (description: string): void => {
    toaster.create({
      title: "Something went wrong!",
      description,
      type: "error",
    })
  }

  /**
   * Takes an API error object, extracts a user-friendly message,
   * and displays it in an error toast.
   *
   * @param {unknown} error - The error object, typically from a failed API call.
   */
  const showApiErrorToast = (error: unknown): void => {
    const errorMessage: string = extractApiErrorMessage(error)
    showErrorToast(errorMessage)
  }
  return { showSuccessToast, showErrorToast, showApiErrorToast }
}

export default useCustomToast
