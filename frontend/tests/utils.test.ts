/**
 * @file Unit tests for the src/utils.ts module.
 */

import type { ValidationRules } from "@/utils"
import {
  confirmPasswordRules,
  emailPattern,
  extractApiErrorMessage,
  namePattern,
  passwordRules,
} from "@/utils"
import { type Mock, describe, expect, it, vi } from "vitest"

// Test suite for the entire utils.ts file
describe("utils.ts", (): void => {
  // Tests for the passwordRules function
  describe("passwordRules", (): void => {
    it("should return rules with a required message by default", (): void => {
      const rules: ValidationRules = passwordRules()
      expect(rules.required).toBe("Password is required")
      expect(rules.minLength?.value).toBe(8)
    })

    it("should return rules without a required message when isRequired is false", (): void => {
      const rules: ValidationRules = passwordRules(false)
      expect(rules.required).toBeUndefined()
      expect(rules.minLength?.value).toBe(8)
    })
  })

  // Tests for the confirmPasswordRules function
  describe("confirmPasswordRules", (): void => {
    const getValuesMock: Mock = vi.fn()

    it("should return true when passwords match", (): void => {
      getValuesMock.mockReturnValue({ password: "password123" })
      const rules: ValidationRules = confirmPasswordRules(getValuesMock)
      const result: string | boolean | undefined =
        rules.validate?.("password123")
      expect(result).toBe(true)
    })

    it("should return an error message when passwords do not match", (): void => {
      getValuesMock.mockReturnValue({ password: "password123" })
      const rules: ValidationRules = confirmPasswordRules(getValuesMock)
      const result: string | boolean | undefined =
        rules.validate?.("wrongpassword")
      expect(result).toBe("The passwords do not match")
    })

    it("should correctly use new_password if password field is not present", (): void => {
      getValuesMock.mockReturnValue({ new_password: "newpassword123" })
      const rules: ValidationRules = confirmPasswordRules(getValuesMock)
      const result: string | boolean | undefined =
        rules.validate?.("newpassword123")
      expect(result).toBe(true)
    })

    it("should return true if the base password is not yet entered", (): void => {
      getValuesMock.mockReturnValue({}) // The form is empty
      const rules: ValidationRules = confirmPasswordRules(getValuesMock)
      const result: string | boolean | undefined = rules.validate?.("anything")
      expect(result).toBe(true)
    })
  })

  // Tests for the extractApiErrorMessage function
  describe("extractApiErrorMessage", (): void => {
    it("should extract message from a FastAPI validation error", (): void => {
      const mockError = {
        body: { detail: [{ msg: "This is the detailed error message" }] },
        status: 422,
        statusText: "Unprocessable Content",
        url: "",
        ok: false,
      }
      const message: string = extractApiErrorMessage(mockError)
      expect(message).toBe("This is the detailed error message")
    })

    it("should extract message from a simple string detail", (): void => {
      const mockError = {
        body: { detail: "A simple error string." },
        status: 400,
        statusText: "Bad Request",
        url: "",
        ok: false,
      }
      const message: string = extractApiErrorMessage(mockError)
      expect(message).toBe("A simple error string.")
    })

    it("should handle a standard JavaScript Error object", (): void => {
      const mockError = new Error("A standard error occurred")
      const message: string = extractApiErrorMessage(mockError)
      expect(message).toBe("A standard error occurred")
    })

    it("should return a generic message for unknown or malformed errors", (): void => {
      const unknownErrors = [null, undefined, {}, { body: {} }, "just a string"]
      for (const err of unknownErrors) {
        const message = extractApiErrorMessage(err)
        expect(message).toBe("An unexpected error occurred.")
      }
    })
  })

  // Tests for namePattern
  describe("namePattern", (): void => {
    it("should match valid names", (): void => {
      const validNames: string[] = ["John Doe", "John", "John-Doe", "Joe"]
      for (const name of validNames) {
        expect(name).toMatch(namePattern.value)
      }
    })

    it("should not match invalid names", (): void => {
      const invalidNames: string[] = [
        " admin",
        "admin ",
        "admin2",
        "Admin-",
        "Admin'",
      ]
      for (const name of invalidNames) {
        expect(name).not.toMatch(namePattern.value)
      }
    })
  })

  // Tests for emailPattern
  describe("emailPattern", (): void => {
    it("should match valid email addresses", (): void => {
      const validEmails: string[] = [
        "test@example.com",
        "test.name@example.co.uk",
      ]
      for (const email of validEmails) {
        expect(email).toMatch(emailPattern.value)
      }
    })

    it("should not match invalid email addresses", (): void => {
      const invalidEmails: string[] = [
        "test",
        "test@",
        "test@example",
        "test@.com",
      ]
      for (const email of invalidEmails) {
        expect(email).not.toMatch(emailPattern.value)
      }
    })
  })
})
