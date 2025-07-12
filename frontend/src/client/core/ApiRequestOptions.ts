/**
 * @file Defines the ApiRequestOptions type for configuring API requests.
 * @description Specifies the structure of HTTP request options, including method, URL, headers, and body, used in API client operations.
 * @module ApiRequestOptions
 */

// region Type Aliases

/**
 * Union type for common MIME types used in API requests.
 * @type {MediaType}
 */
type MediaType = "application/json" | "multipart/form-data" | "application/x-www-form-urlencoded" | "text/plain"

/**
 * Type for HTTP request options used in API calls.
 * @template T - The expected type of the transformed response.
 * @interface ApiRequestOptions
 */
interface ApiRequestOptions<T = unknown> {
  /** The body of the request, typically JSON or array data. */
  readonly body?: Record<string, unknown> | unknown[]
  /** Cookies to include in the request. */
  readonly cookies?: Record<string, unknown>
  /** Custom error messages for specific HTTP status codes. */
  readonly errors?: Record<number | string, string>
  /** Form data for the request, such as file uploads or form fields. */
  readonly formData?: FormData | Record<string, string | Blob | File>
  /** HTTP headers for the request. */
  readonly headers?: Record<string, unknown>
  /** MIME type of the request body. */
  readonly mediaType?: MediaType
  /** HTTP method for the request. */
  readonly method: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT"
  /** Path parameters for the request URL. */
  readonly path?: Record<string, unknown>
  /** Query parameters for the request URL. */
  readonly query?: Record<string, unknown>
  /** Specific response header to extract. */
  readonly responseHeader?: string
  /** Function to transform the response data. */
  readonly responseTransformer?: (data: unknown) => Promise<T>
  /** The URL of the API request. */
  readonly url: string
}

// endregion

export type { ApiRequestOptions }
