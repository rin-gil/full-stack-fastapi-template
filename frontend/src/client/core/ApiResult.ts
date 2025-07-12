/**
 * @file Defines the core `ApiResult` type for API responses.
 * @description This module exports a generic `ApiResult` type that standardizes the shape of resolved API call results.
 * It wraps the response data (`body`) along with essential metadata from the HTTP response, such as the status code
 * and URL, providing a consistent and predictable structure for handling API successes throughout the application.
 * @module ApiResult
 */

// region Type Aliases

/**
 * Represents the standardized result of a successful API call.
 * @template TData The type of the response body. Defaults to `unknown` for type safety.
 */
export type ApiResult<TData = unknown> = {
  /** The data returned in the response body. */
  readonly body: TData
  /** A boolean indicating whether the response was successful (status in the range 200-299). */
  readonly ok: boolean
  /** The HTTP status code of the response. */
  readonly status: number
  /** The status message corresponding to the status code. */
  readonly statusText: string
  /** The URL of the request that generated this response. */
  readonly url: string
}

// endregion
