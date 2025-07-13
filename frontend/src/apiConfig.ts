/**
 * @file Configures the OpenAPI client for API requests.
 * @description Sets up the base URL and token retrieval for API requests.
 * @module ApiConfig
 */

import { OpenAPI } from "./client"

/**
 * Configures the OpenAPI client with base URL and token retrieval.
 * @returns {void}
 */
export const configureApi = (): void => {
  OpenAPI.BASE = import.meta.env.VITE_API_URL

  OpenAPI.TOKEN = async (): Promise<string> => {
    try {
      return localStorage.getItem("access_token") || ""
    } catch {
      return ""
    }
  }
}
configureApi()
