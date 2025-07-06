/**
 * @file Unit tests for src/hooks/useCustomToast.ts
 * @description These tests verify that the hook's functions call their dependencies
 * (toaster, utils) with the correct parameters, ensuring proper integration.
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { toaster } from "@/components/ui/toaster"
import useCustomToast from "@/hooks/useCustomToast.ts"
import { extractApiErrorMessage } from "@/utils"

// region MOCKS

// Mock the toaster module to spy on the `create` method.
vi.mock("@/components/ui/toaster", () => ({
  toaster: {
    create: vi.fn(),
  },
}))

// Mock the utils module to isolate the hook from the `extractApiErrorMessage` implementation.
vi.mock("@/utils", () => ({
  extractApiErrorMessage: vi.fn(),
}))

// endregion

// region TESTS

describe("useCustomToast", (): void => {
  /**
   * Before each test, clear all mock history (e.g., call counts)
   * to ensure tests are independent of each other.
   */
  beforeEach((): void => {
    vi.clearAllMocks()
  })

  /**
   * Verifies that `showSuccessToast` calls `toaster.create` with the correct
   * success-themed parameters.
   */
  it("should call toaster.create with success parameters for showSuccessToast", (): void => {
    // Arrange: Render the hook to get access to its functions.
    const { result } = renderHook(() => useCustomToast())
    const successDescription = "Your profile has been updated."
    // Act: Call the function we want to test.
    act((): void => {
      result.current.showSuccessToast(successDescription)
    })
    // Assert: Check if the mock was called correctly.
    expect(toaster.create).toHaveBeenCalledTimes(1)
    expect(toaster.create).toHaveBeenCalledWith({
      title: "Success!",
      description: successDescription,
      type: "success",
    })
  })

  /**
   * Verifies that `showErrorToast` calls `toaster.create` with the correct
   * error-themed parameters.
   */
  it("should call toaster.create with error parameters for showErrorToast", (): void => {
    // Arrange
    const { result } = renderHook(() => useCustomToast())
    const errorDescription = "Invalid input provided."
    // Act
    act((): void => {
      result.current.showErrorToast(errorDescription)
    })
    // Assert
    expect(toaster.create).toHaveBeenCalledTimes(1)
    expect(toaster.create).toHaveBeenCalledWith({
      title: "Something went wrong!",
      description: errorDescription,
      type: "error",
    })
  })

  /**
   * Verifies that `showApiErrorToast` correctly uses the `extractApiErrorMessage`
   * utility and passes its result to the generic error toast.
   */
  it("should extract a message and call toaster.create for showApiErrorToast", (): void => {
    // Arrange
    const { result } = renderHook(() => useCustomToast())
    const apiError = new Error("Network Error")
    const extractedMessage = "This is the extracted API error message."
    vi.mocked(extractApiErrorMessage).mockReturnValue(extractedMessage)
    // Act
    act((): void => {
      result.current.showApiErrorToast(apiError)
    })
    // Assert
    expect(extractApiErrorMessage).toHaveBeenCalledTimes(1)
    expect(extractApiErrorMessage).toHaveBeenCalledWith(apiError)
    expect(toaster.create).toHaveBeenCalledTimes(1)
    expect(toaster.create).toHaveBeenCalledWith({
      title: "Something went wrong!",
      description: extractedMessage,
      type: "error",
    })
  })
})

// endregion
