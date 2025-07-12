/**
 * @file Defines the ApiError class for handling API request errors.
 * @description Extends the Error class to include details about failed API requests, such as URL, status, and response body.
 * @module ApiError
 */

import type { ApiRequestOptions } from "./ApiRequestOptions"
import type { ApiResult } from "./ApiResult"

// region Main Code

/**
 * Custom error class for handling API request errors.
 * @class ApiError
 * @extends Error
 */
export class ApiError extends Error {
  /** The URL of the failed API request. */
  public readonly url: string

  /** The HTTP status code of the response. */
  public readonly status: number

  /** The HTTP status text of the response. */
  public readonly statusText: string

  /** The response body of the failed request. */
  public readonly body: unknown

  /** The request options used for the API call. */
  public readonly request: ApiRequestOptions

  /**
   * Creates an instance of ApiError.
   * @param {ApiRequestOptions} request - The options used for the API request.
   * @param {ApiResult} response - The API response containing error details.
   * @param {string} message - The error message.
   */
  constructor(request: ApiRequestOptions, response: ApiResult, message: string) {
    super(message)

    this.name = "ApiError"
    this.url = response.url
    this.status = response.status
    this.statusText = response.statusText
    this.body = response.body
    this.request = request
  }

  /**
   * Gets a formatted error message including status, status text, and body for debugging.
   * @returns {string} The formatted error message.
   */
  public getFormattedMessage(): string {
    const bodyString: string = this.serializedBody ?? "No body available"
    return `${this.message} (Status: ${this.status} ${this.statusText}, Body: ${bodyString})`
  }

  /**
   * Gets a user-friendly error message extracted from the response body.
   * @returns {string} The user-friendly error message.
   */
  public getUserFriendlyMessage(): string {
    if (typeof this.body === "object" && this.body !== null && "detail" in this.body) {
      const detail: unknown = (this.body as { detail: unknown }).detail
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
    return this.message
  }

  /**
   * Gets the serialized response body as a string, handling serialization errors.
   * @returns {string | null} The serialized body or null if serialization fails.
   */
  public get serializedBody(): string | null {
    try {
      return JSON.stringify(this.body)
    } catch {
      return null
    }
  }
}

// endregion
