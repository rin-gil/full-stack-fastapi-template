/**
 * @file This module defines the useCustomToast hook, providing a centralized mechanism
 * for displaying toast notifications in the application. It abstracts the basic implementation
 * of the notification component and offers standardized functions for displaying messages
 * about success, general errors, and specific API errors, ensuring a consistent
 * user experience when providing feedback.
 */

"use client"

import { toaster } from "@/components/ui/toaster"
import { extractApiErrorMessage } from "@/utils"

/**
 * Provides a centralized mechanism for displaying toast notifications in the application.
 *
 * @returns An object containing `showSuccessToast`, `showErrorToast`, and `showApiErrorToast`
 * functions.
 */
const useCustomToast = () => {
  /**
   * Displays a success toast with a custom message.
   *
   * @param description - The message to display in the toast.
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
   * @param description - The error message to display.
   */
  const showErrorToast = (description: string): void => {
    toaster.create({
      title: "Something went wrong!",
      description,
      type: "error",
    })
  }

  /**
   * Takes an API error object, extracts a user-friendly message, and displays it in an error toast.
   *
   * @param error - The error object, typically from a failed API call.
   */
  const showApiErrorToast = (error: unknown): void => {
    const errorMessage = extractApiErrorMessage(error)
    showErrorToast(errorMessage)
  }

  return { showSuccessToast, showErrorToast, showApiErrorToast }
}

export default useCustomToast
