/**
 * @file Defines utilities and the main request function for handling API requests.
 * @description Provides functions to process API request options, headers, and responses, integrating with Axios and cancellable promises.
 * @module Request
 */

import { ApiError } from "@/client"
import type { OpenAPIConfig } from "@/client"
import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse, type AxiosInstance } from "axios"
import type { ApiRequestOptions } from "./ApiRequestOptions"
import type { ApiResult } from "./ApiResult"
import { CancelablePromise, type OnCancel } from "./CancelablePromise"

// region Type Aliases

/**
 * Type for HTTP headers as a key-value object.
 * @type {Headers}
 */
type Headers = Record<string, string>

/**
 * Type for resolver functions that produce a value based on request options.
 * @template T - The type of the resolved value.
 * @type {Resolver}
 */
type Resolver<T> = (options: ApiRequestOptions<T>) => Promise<T>

// endregion

// region Utility Functions

/**
 * Checks if a value is a string.
 * @param value - The value to check.
 * @returns {boolean} True if the value is a string, false otherwise.
 */
export const isString = (value: unknown): value is string => {
  return typeof value === "string"
}

/**
 * Checks if a value is a non-empty string.
 * @param value - The value to check.
 * @returns {boolean} True if the value is a non-empty string, false otherwise.
 */
export const isStringWithValue = (value: unknown): value is string => {
  return isString(value) && value !== ""
}

/**
 * Checks if a value is a Blob.
 * @param value - The value to check.
 * @returns {boolean} True if the value is a Blob, false otherwise.
 */
export const isBlob = (value: unknown): value is Blob => {
  return value instanceof Blob
}

/**
 * Checks if a value is a FormData object.
 * @param value - The value to check.
 * @returns {boolean} True if the value is a FormData, false otherwise.
 */
export const isFormData = (value: unknown): value is FormData => {
  return value instanceof FormData
}

/**
 * Checks if an HTTP status code indicates success (2xx).
 * @param status - The HTTP status code.
 * @returns {boolean} True if the status is in the 2xx range, false otherwise.
 */
export const isSuccess = (status: number): boolean => {
  return status >= 200 && status < 300
}

/**
 * Encodes a string to base64 format.
 * @param str - The string to encode.
 * @returns {string} The base64-encoded string.
 * @throws {Error} If encoding fails.
 */
export const base64 = (str: string): string => {
  try {
    return typeof window !== "undefined" ? window.btoa(str) : Buffer.from(str).toString("base64")
  } catch (err) {
    throw new Error(`Failed to encode string to base64: ${err}`)
  }
}

/**
 * Generates a query string from a parameters object.
 * @param params - The parameters to encode.
 * @returns {string} The encoded query string, or empty string if no parameters.
 */
export const getQueryString = (params: Record<string, unknown>): string => {
  const qs: string[] = []

  const append = (key: string, value: unknown) => {
    qs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }

  const encodePair = (key: string, value: unknown) => {
    if (value === undefined || value === null) {
      return
    }

    if (value instanceof Date) {
      append(key, value.toISOString())
    } else if (Array.isArray(value)) {
      for (const v of value) {
        encodePair(key, v)
      }
    } else if (typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        encodePair(`${key}[${k}]`, v)
      }
    } else {
      append(key, value)
    }
  }

  for (const [key, value] of Object.entries(params)) {
    encodePair(key, value)
  }

  return qs.length ? `?${qs.join("&")}` : ""
}

/**
 * Constructs the request URL from configuration and options.
 * @param config - The OpenAPI configuration.
 * @param options - The API request options.
 * @returns {string} The constructed URL.
 */
const getUrl = (config: OpenAPIConfig, options: ApiRequestOptions): string => {
  const encoder = config.ENCODE_PATH || encodeURI

  const path = options.url
    .replace("{api-version}", config.VERSION)
    .replace(/{(.*?)}/g, (substring: string, group: string) => {
      if (options.path && group in options.path) {
        return encoder(String(options.path[group]))
      }
      return substring
    })

  const url = config.BASE + path
  return options.query ? url + getQueryString(options.query) : url
}

/**
 * Creates a FormData object from request options.
 * @param options - The API request options.
 * @returns {FormData | undefined} The FormData object or undefined if no form data.
 */
export const getFormData = (options: ApiRequestOptions): FormData | undefined => {
  if (options.formData) {
    const formData = new FormData()

    const process = (key: string, value: unknown) => {
      if (isString(value) || isBlob(value)) {
        formData.append(key, value)
      } else {
        formData.append(key, JSON.stringify(value))
      }
    }

    for (const [key, value] of Object.entries(options.formData)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          for (const v of value) {
            process(key, v)
          }
        } else {
          process(key, value)
        }
      }
    }

    return formData
  }
  return undefined
}

/**
 * Resolves a value or resolver function for the given options.
 * @template T - The type of the resolved value.
 * @param options - The API request options.
 * @param resolver - The value or resolver function.
 * @returns {Promise<T | undefined>} The resolved value or undefined.
 */
export const resolve = async <T>(options: ApiRequestOptions<T>, resolver?: T | Resolver<T>): Promise<T | undefined> => {
  if (typeof resolver === "function") {
    return (resolver as Resolver<T>)(options)
  }
  return resolver
}

/**
 * Generates headers for the API request.
 * @template T - The type of the response.
 * @param config - The OpenAPI configuration.
 * @param options - The API request options.
 * @returns {Promise<Headers>} The generated headers.
 */
export const getHeaders = async <T>(config: OpenAPIConfig, options: ApiRequestOptions<T>): Promise<Headers> => {
  const [token, username, password, additionalHeaders] = await Promise.all([
    resolve<string>(options as ApiRequestOptions<string>, config.TOKEN),
    resolve<string>(options as ApiRequestOptions<string>, config.USERNAME),
    resolve<string>(options as ApiRequestOptions<string>, config.PASSWORD),
    resolve<Headers>(options as ApiRequestOptions<Headers>, config.HEADERS),
  ])

  const headers = Object.entries({
    Accept: "application/json",
    ...additionalHeaders,
    ...options.headers,
  }).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = String(value)
    }
    return acc
  }, {} as Headers)

  if (isStringWithValue(token)) {
    headers.Authorization = `Bearer ${token}`
  }

  if (isStringWithValue(username) && isStringWithValue(password)) {
    const credentials = base64(`${username}:${password}`)
    headers.Authorization = `Basic ${credentials}`
  }

  if (options.body !== undefined) {
    if (options.mediaType) {
      headers["Content-Type"] = options.mediaType
    } else if (isBlob(options.body)) {
      headers["Content-Type"] = options.body.type || "application/octet-stream"
    } else if (isString(options.body)) {
      headers["Content-Type"] = "text/plain"
    } else if (!isFormData(options.body)) {
      headers["Content-Type"] = "application/json"
    }
  } else if (options.formData !== undefined) {
    if (options.mediaType) {
      headers["Content-Type"] = options.mediaType
    }
  }

  return headers
}

/**
 * Retrieves the request body from options.
 * @param options - The API request options.
 * @returns {unknown} The request body or undefined if none.
 */
export const getRequestBody = (options: ApiRequestOptions): unknown => {
  if (options.body) {
    return options.body
  }
  return undefined
}

/**
 * Sends an API request using Axios.
 * @template T - The type of the response.
 * @param config - The OpenAPI configuration.
 * @param options - The API request options.
 * @param url - The request URL.
 * @param body - The request body.
 * @param formData - The FormData object, if any.
 * @param headers - The request headers.
 * @param onCancel - The cancellation handler.
 * @param axiosClient - The Axios instance.
 * @returns {Promise<AxiosResponse<T>>} The Axios response.
 */
export const sendRequest = async <T>(
  config: OpenAPIConfig,
  options: ApiRequestOptions<T>,
  url: string,
  body: unknown,
  formData: FormData | undefined,
  headers: Record<string, string>,
  onCancel: OnCancel,
  axiosClient: AxiosInstance,
): Promise<AxiosResponse<T>> => {
  const controller = new AbortController()

  let requestConfig: AxiosRequestConfig = {
    data: body ?? formData,
    headers,
    method: options.method,
    signal: controller.signal,
    url,
    withCredentials: config.WITH_CREDENTIALS,
  }

  onCancel(() => controller.abort())

  for (const fn of config.interceptors.request.getMiddleware()) {
    requestConfig = await fn(requestConfig)
  }

  try {
    return await axiosClient.request(requestConfig)
  } catch (error) {
    const axiosError = error as AxiosError<T>
    if (axiosError.response) {
      return axiosError.response
    }
    throw error
  }
}

/**
 * Retrieves a specific response header.
 * @param response - The Axios response.
 * @param responseHeader - The header to retrieve.
 * @returns {string | undefined} The header value or undefined if not found.
 */
export const getResponseHeader = (response: AxiosResponse<unknown>, responseHeader?: string): string | undefined => {
  if (responseHeader) {
    const content = response.headers[responseHeader]
    if (isString(content)) {
      return content
    }
  }
  return undefined
}

/**
 * Retrieves the response body.
 * @param response - The Axios response.
 * @returns {unknown} The response body.
 */
export const getResponseBody = (response: AxiosResponse<unknown>): unknown => {
  return response.data
}

/**
 * Throws an ApiError based on status codes and custom error messages.
 * @param options - The API request options.
 * @param result - The API result.
 * @returns {void}
 * @throws {ApiError} If an error condition is met.
 */
export const catchErrorCodes = (options: ApiRequestOptions, result: ApiResult): void => {
  const errors: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Payload Too Large",
    414: "URI Too Long",
    415: "Unsupported Media Type",
    416: "Range Not Satisfiable",
    417: "Expectation Failed",
    418: "Im a teapot",
    421: "Misdirected Request",
    422: "Unprocessable Content",
    423: "Locked",
    424: "Failed Dependency",
    425: "Too Early",
    426: "Upgrade Required",
    428: "Precondition Required",
    429: "Too Many Requests",
    431: "Request Header Fields Too Large",
    451: "Unavailable For Legal Reasons",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported",
    506: "Variant Also Negotiates",
    507: "Insufficient Storage",
    508: "Loop Detected",
    510: "Not Extended",
    511: "Network Authentication Required",
    ...options.errors,
  }

  const error = errors[result.status]
  if (error) {
    throw new ApiError(options, result, error)
  }

  if (!result.ok) {
    const errorStatus = result.status ?? "unknown"
    const errorStatusText = result.statusText ?? "unknown"
    const errorBody = (() => {
      try {
        return JSON.stringify(result.body, null, 2)
      } catch (e) {
        return undefined
      }
    })()

    const errorMessage = [
      "Generic Error",
      `status: ${errorStatus}`,
      `status text: ${errorStatusText}`,
      `body: ${errorBody}`,
    ]
      .filter(Boolean)
      .join("; ")
    throw new ApiError(options, result, errorMessage)
  }
}

/**
 * Performs an API request with cancellation support.
 * @template T - The type of the response.
 * @param config - The OpenAPI configuration object.
 * @param options - The request options from the service.
 * @param axiosClient - The Axios client instance to use (defaults to axios).
 * @returns {CancelablePromise<T>} A cancellable promise resolving to the response body.
 * @throws {ApiError} If the request fails or returns an error status.
 */
export const request = <T>(
  config: OpenAPIConfig,
  options: ApiRequestOptions<T>,
  axiosClient: AxiosInstance = axios,
): CancelablePromise<T> => {
  return new CancelablePromise(async (resolve, reject, onCancel) => {
    try {
      if (onCancel.isCancelled) {
        reject(
          new ApiError(options, { url: "", ok: false, status: 0, statusText: "", body: null }, "Request cancelled"),
        )
        return
      }

      const url = getUrl(config, options)
      const formData = getFormData(options)
      const body = getRequestBody(options)
      const headers = await getHeaders(config, options)

      let response = await sendRequest<T>(config, options, url, body, formData, headers, onCancel, axiosClient)

      for (const fn of config.interceptors.response.getMiddleware()) {
        response = await fn(response)
      }

      const responseBody = getResponseBody(response)
      const responseHeader = getResponseHeader(response, options.responseHeader)

      let transformedBody = responseBody
      if (options.responseTransformer && isSuccess(response.status)) {
        transformedBody = await options.responseTransformer(responseBody)
      }

      const result: ApiResult = {
        url,
        ok: isSuccess(response.status),
        status: response.status,
        statusText: response.statusText,
        body: responseHeader ?? transformedBody,
      }

      catchErrorCodes(options, result)

      resolve(result.body as T)
    } catch (error) {
      reject(error)
    }
  })
}

// endregion
