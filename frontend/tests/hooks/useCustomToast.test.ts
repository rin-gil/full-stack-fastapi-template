/**
 * @file Unit tests for the src/hooks/useCustomToast.ts custom React hook.
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the external dependencies from other modules
import { toaster } from "@/components/ui/toaster"
import useCustomToast from "@/hooks/useCustomToast.ts"
import { extractApiErrorMessage } from "@/utils"

// We tell Vitest to replace the actual modules with our mocks.
vi.mock("@/components/ui/toaster", () => ({
  toaster: {
    // We only care about the `create` method, so we mock it with a spy function.
    create: vi.fn(),
  },
}))

vi.mock("@/utils", () => ({
  // Mock the utility function to isolate the hook's own logic.
  extractApiErrorMessage: vi.fn(),
}))

describe("useCustomToast", (): void => {
  // Before each test, we clear all mock history (e.g., call counts)
  // to ensure tests are independent of each other.
  beforeEach((): void => {
    vi.clearAllMocks()
  })

  it("should call toaster.create with success parameters for showSuccessToast", (): void => {
    // Arrange: Render the hook to get access to its functions.
    const { result } = renderHook(() => useCustomToast())
    const successDescription = "Your profile has been updated."
    // Act: Call the function we want to test. We wrap it in `act` because
    // it could potentially cause a state update in a component.
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

  it("should extract a message and call toaster.create for showApiErrorToast", (): void => {
    // Arrange
    const { result } = renderHook(() => useCustomToast())
    const apiError = new Error("Network Error")
    const extractedMessage = "This is the extracted API error message."
    // We configure our mock to return a specific, predictable value for this test case.
    vi.mocked(extractApiErrorMessage).mockReturnValue(extractedMessage)
    // Act
    act((): void => {
      result.current.showApiErrorToast(apiError)
    })
    // Assert
    // 1. Verify that our hook tried to extract the error message.
    expect(extractApiErrorMessage).toHaveBeenCalledTimes(1)
    expect(extractApiErrorMessage).toHaveBeenCalledWith(apiError)
    // 2. Verify that the toast was created using the message from the (mocked) extractor function.
    expect(toaster.create).toHaveBeenCalledTimes(1)
    expect(toaster.create).toHaveBeenCalledWith({
      title: "Something went wrong!",
      description: extractedMessage,
      type: "error",
    })
  })
})
