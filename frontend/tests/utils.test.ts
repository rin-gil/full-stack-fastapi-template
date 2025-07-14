/**
 * @file Tests for src/utils.ts
 * @description Tests validation functions for password, confirm password, name, and email patterns.
 * @module UtilsTests
 */

import { type ValidationRules, confirmPasswordRules, emailPattern, namePattern, passwordRules } from "@/utils"
import { describe, expect, it, vi } from "vitest"
import type { Mock } from "vitest"

// region Type aliases
type ValidationResult = string | boolean | undefined
type StringArray = string[]

// endregion

// region Tests
/**
 * Test suite for utility functions.
 */
describe("Utils Module", (): void => {
  /**
   * Tests for the passwordRules function.
   */
  describe("passwordRules", (): void => {
    it("should return rules with required message by default", (): void => {
      const rules: ValidationRules = passwordRules()
      expect(rules.required).toBe("Password is required")
      expect(rules.minLength?.value).toBe(8)
    })

    it("should return rules without required message when isRequired is false", (): void => {
      const rules: ValidationRules = passwordRules(false)
      expect(rules.required).toBeUndefined()
      expect(rules.minLength?.value).toBe(8)
    })
  })

  /**
   * Tests for the confirmPasswordRules function.
   */
  describe("confirmPasswordRules", (): void => {
    const getValuesMock: Mock = vi.fn()

    it("should return true when passwords match", (): void => {
      getValuesMock.mockReturnValue({ password: "password123" })
      const rules: ValidationRules = confirmPasswordRules(getValuesMock)
      const result: ValidationResult = rules.validate?.("password123")
      expect(result).toBe(true)
    })

    it("should return error message when passwords do not match", (): void => {
      getValuesMock.mockReturnValue({ password: "password123" })
      const rules: ValidationRules = confirmPasswordRules(getValuesMock)
      const result: ValidationResult = rules.validate?.("wrongpassword")
      expect(result).toBe("The passwords do not match")
    })

    it("should use new_password if password field is absent", (): void => {
      getValuesMock.mockReturnValue({ new_password: "newpassword123" })
      const rules: ValidationRules = confirmPasswordRules(getValuesMock)
      const result: ValidationResult = rules.validate?.("newpassword123")
      expect(result).toBe(true)
    })

    it("should return true if base password is not yet entered", (): void => {
      getValuesMock.mockReturnValue({})
      const rules: ValidationRules = confirmPasswordRules(getValuesMock)
      const result: ValidationResult = rules.validate?.("anything")
      expect(result).toBe(true)
    })
  })

  /**
   * Tests for the namePattern constant.
   */
  describe("namePattern", () => {
    it("should match valid names", (): void => {
      const validNames: StringArray = ["John Doe", "John", "John-Doe", "Joe"]
      for (const name of validNames) {
        expect(name).toMatch(namePattern.value)
      }
    })

    it("should not match invalid names", (): void => {
      const invalidNames: StringArray = [" admin", "admin ", "admin2", "Admin-", "Admin'"]
      for (const name of invalidNames) {
        expect(name).not.toMatch(namePattern.value)
      }
    })
  })

  /**
   * Tests for the emailPattern constant.
   */
  describe("emailPattern", (): void => {
    it("should match valid email addresses", (): void => {
      const validEmails: StringArray = ["test@example.com", "test.name@example.co.uk"]
      for (const email of validEmails) {
        expect(email).toMatch(emailPattern.value)
      }
    })

    it("should not match invalid email addresses", (): void => {
      const invalidEmails: StringArray = ["test", "test@", "test@example", "test@.com"]
      for (const email of invalidEmails) {
        expect(email).not.toMatch(emailPattern.value)
      }
    })
  })
})

// endregion
