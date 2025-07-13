// noinspection JSUnusedGlobalSymbols

/**
 * @file Defines the OpenAPI configuration and Interceptors class for API client setup.
 * @description Provides configuration options for API requests and a mechanism to manage middleware for request and response interception.
 * @module OpenAPI
 */

import type { AxiosRequestConfig, AxiosResponse } from "axios"
import type { ApiRequestOptions } from "./ApiRequestOptions"

// region Type Aliases

/**
 * Type for HTTP headers as a key-value object.
 * @type {Headers}
 */
type Headers = Record<string, string>

/**
 * Type for middleware functions that process a value and return it or a promise.
 * @template T - The type of the value to process.
 * @type {Middleware}
 */
type Middleware<T> = (value: T) => T | Promise<T>

/**
 * Type for resolver functions that produce a value based on request options.
 * @template T - The type of the resolved value.
 * @type {Resolver}
 */
type Resolver<T> = (options: ApiRequestOptions<T>) => Promise<T>

// endregion

// region Main Code

/**
 * Class for managing middleware functions for API request or response interception.
 * @template T - The type of the value processed by middleware (e.g., AxiosRequestConfig or AxiosResponse).
 * @class Interceptors
 */
export class Interceptors<T> {
  /** Array of middleware functions. */
  private _fns: Middleware<T>[]

  /**
   * Creates an instance of Interceptors.
   */
  constructor() {
    this._fns = []
  }

  /**
   * Removes a middleware function from the interceptors.
   * @param fn - The middleware function to remove.
   * @returns {void}
   */
  eject(fn: Middleware<T>): void {
    const index = this._fns.indexOf(fn)
    if (index !== -1) {
      this._fns = [...this._fns.slice(0, index), ...this._fns.slice(index + 1)]
    }
  }

  /**
   * Adds a middleware function to the interceptors.
   * @param fn - The middleware function to add.
   * @returns {void}
   */
  use(fn: Middleware<T>): void {
    if (!this._fns.includes(fn)) {
      this._fns = [...this._fns, fn]
    }
  }

  /**
   * Clears all middleware functions from the interceptors.
   * @returns {void}
   */
  clear(): void {
    this._fns = []
  }

  /**
   * Returns the array of middleware functions.
   * @returns {Middleware<T>[]} The middleware functions.
   */
  getMiddleware(): Middleware<T>[] {
    return this._fns
  }
}

/**
 * Interface for API client configuration.
 * @interface OpenAPIConfig
 */
export interface OpenAPIConfig {
  /** Base URL for API requests. */
  BASE: string
  /** Credential inclusion policy for requests. */
  CREDENTIALS: "include" | "omit" | "same-origin"
  /** Optional function to encode the request path. */
  ENCODE_PATH?: (path: string) => string
  /** Optional headers or resolver for headers. */
  HEADERS?: Headers | Resolver<Headers>
  /** Optional password or resolver for password. */
  PASSWORD?: string | Resolver<string>
  /** Optional token or resolver for token. */
  TOKEN?: string | Resolver<string>
  /** Optional username or resolver for username. */
  USERNAME?: string | Resolver<string>
  /** API version. */
  VERSION: string
  /** Indicates whether to include credentials in requests. */
  WITH_CREDENTIALS: boolean
  /** Interceptors for request and response handling. */
  interceptors: {
    request: Interceptors<AxiosRequestConfig>
    response: Interceptors<AxiosResponse>
  }
}

/**
 * Default configuration for the API client.
 * @constant OpenAPI
 * @type {OpenAPIConfig}
 */
export const OpenAPI: OpenAPIConfig = {
  BASE: "",
  CREDENTIALS: "include",
  ENCODE_PATH: undefined,
  HEADERS: undefined,
  PASSWORD: undefined,
  TOKEN: undefined,
  USERNAME: undefined,
  VERSION: "0.1.0",
  WITH_CREDENTIALS: false,
  interceptors: {
    request: new Interceptors<AxiosRequestConfig>(),
    response: new Interceptors<AxiosResponse>(),
  },
}

// endregion
