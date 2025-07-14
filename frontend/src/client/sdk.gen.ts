// noinspection JSUnusedGlobalSymbols

/**
 * @file Defines all auto-generated API service functions.
 * @description This file contains the complete SDK for interacting with the API.
 *              Each exported function corresponds to a specific API endpoint,
 *              handling the request and response logic.
 * @module ApiServices
 */

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type {
  ItemsItemsRouterCreateItemData,
  ItemsItemsRouterCreateItemResponse,
  ItemsItemsRouterDeleteItemData,
  ItemsItemsRouterDeleteItemResponse,
  ItemsItemsRouterReadItemData,
  ItemsItemsRouterReadItemResponse,
  ItemsItemsRouterReadItemsData,
  ItemsItemsRouterReadItemsResponse,
  ItemsItemsRouterUpdateItemData,
  ItemsItemsRouterUpdateItemResponse,
  LoginLoginRouterLoginAccessTokenData,
  LoginLoginRouterLoginAccessTokenResponse,
  LoginLoginRouterRecoverPasswordData,
  LoginLoginRouterRecoverPasswordHtmlContentData,
  LoginLoginRouterRecoverPasswordHtmlContentResponse,
  LoginLoginRouterRecoverPasswordResponse,
  LoginLoginRouterResetPasswordData,
  LoginLoginRouterResetPasswordResponse,
  LoginLoginRouterTestTokenResponse,
  PrivatePrivateRouterCreateUserData,
  PrivatePrivateRouterCreateUserResponse,
  UsersUsersRouterCreateUserData,
  UsersUsersRouterCreateUserResponse,
  UsersUsersRouterDeleteUserData,
  UsersUsersRouterDeleteUserMeResponse,
  UsersUsersRouterDeleteUserResponse,
  UsersUsersRouterReadUserByIdData,
  UsersUsersRouterReadUserByIdResponse,
  UsersUsersRouterReadUserMeResponse,
  UsersUsersRouterReadUsersData,
  UsersUsersRouterReadUsersResponse,
  UsersUsersRouterRegisterUserData,
  UsersUsersRouterRegisterUserResponse,
  UsersUsersRouterUpdatePasswordMeData,
  UsersUsersRouterUpdatePasswordMeResponse,
  UsersUsersRouterUpdateUserData,
  UsersUsersRouterUpdateUserMeData,
  UsersUsersRouterUpdateUserMeResponse,
  UsersUsersRouterUpdateUserResponse,
  UtilsUtilsRouterHealthCheckResponse,
  UtilsUtilsRouterTestEmailData,
  UtilsUtilsRouterTestEmailResponse,
} from "./types.gen"

/**
 * Login for Access Token
 * OAuth2 compatible token login, get an access token for future requests.
 * @param data The data for the request.
 * @param data.formData
 * @returns Token Successful Response
 * @throws ApiError
 */
export const loginLoginRouterLoginAccessToken = (
  data: LoginLoginRouterLoginAccessTokenData,
): CancelablePromise<LoginLoginRouterLoginAccessTokenResponse> => {
  const filteredFormData = Object.fromEntries(
    Object.entries(data.formData).filter(
      ([, value]: [string, string | null]): boolean => value !== null && value !== undefined,
    ),
  ) as Record<string, string>

  return __request(OpenAPI, {
    method: "POST",
    url: "/api/v1/login/access-token",
    formData: filteredFormData,
    mediaType: "application/x-www-form-urlencoded",
    errors: { 422: "Validation Error" },
  })
}

/**
 * Test Access Token
 * Test endpoint to validate an access token.
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const loginLoginRouterTestToken = (): CancelablePromise<LoginLoginRouterTestTokenResponse> => {
  return __request(OpenAPI, { method: "POST", url: "/api/v1/login/test-token" })
}

/**
 * Recover Password
 * Send a password recovery email.
 * @param data The data for the request.
 * @param data.email
 * @returns Message Successful Response
 * @throws ApiError
 */
export const loginLoginRouterRecoverPassword = (
  data: LoginLoginRouterRecoverPasswordData,
): CancelablePromise<LoginLoginRouterRecoverPasswordResponse> => {
  return __request(OpenAPI, {
    method: "POST",
    url: "/api/v1/password-recovery/{email}",
    path: { email: data.email },
    errors: { 422: "Validation Error" },
  })
}

/**
 * Reset Password
 * Reset user password using a recovery token.
 * @param data The data for the request.
 * @param data.requestBody
 * @returns Message Successful Response
 * @throws ApiError
 */
export const loginLoginRouterResetPassword = (
  data: LoginLoginRouterResetPasswordData,
): CancelablePromise<LoginLoginRouterResetPasswordResponse> => {
  return __request(OpenAPI, {
    method: "POST",
    url: "/api/v1/reset-password/",
    body: data.requestBody,
    mediaType: "application/json",
    errors: { 422: "Validation Error" },
  })
}

/**
 * Get Password Recovery HTML Content
 * Get the HTML content of a password recovery email for preview (superusers only).
 * @param data The data for the request.
 * @param data.email
 * @returns string Successful Response
 * @throws ApiError
 */
export const loginLoginRouterRecoverPasswordHtmlContent = (
  data: LoginLoginRouterRecoverPasswordHtmlContentData,
): CancelablePromise<LoginLoginRouterRecoverPasswordHtmlContentResponse> => {
  return __request(OpenAPI, {
    method: "POST",
    url: "/api/v1/password-recovery-html-content/{email}",
    path: { email: data.email },
    errors: { 422: "Validation Error" },
  })
}

/**
 * Read Users
 * Obtaining a list of users (for superusers only).
 * @param data The data for the request.
 * @param data.skip
 * @param data.limit
 * @returns UsersPublic Successful Response
 * @throws ApiError
 */
export const usersUsersRouterReadUsers = (
  data: UsersUsersRouterReadUsersData = {},
): CancelablePromise<UsersUsersRouterReadUsersResponse> => {
  return __request(OpenAPI, {
    method: "GET",
    url: "/api/v1/users/",
    query: { skip: data.skip, limit: data.limit },
    errors: { 422: "Validation Error" },
  })
}

/**
 * Create User
 * Creating a new user (for superusers only).
 * @param data The data for the request.
 * @param data.requestBody
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const usersUsersRouterCreateUser = (
  data: UsersUsersRouterCreateUserData,
): CancelablePromise<UsersUsersRouterCreateUserResponse> => {
  return __request(OpenAPI, {
    method: "POST",
    url: "/api/v1/users/",
    body: data.requestBody,
    mediaType: "application/json",
    errors: { 422: "Validation Error" },
  })
}

/**
 * Read Current User
 * Retrieving current user data.
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const usersUsersRouterReadUserMe = (): CancelablePromise<UsersUsersRouterReadUserMeResponse> => {
  return __request(OpenAPI, { method: "GET", url: "/api/v1/users/me" })
}

/**
 * Delete Current User
 * Delete current user.
 * @returns Message Successful Response
 * @throws ApiError
 */
export const usersUsersRouterDeleteUserMe = (): CancelablePromise<UsersUsersRouterDeleteUserMeResponse> => {
  return __request(OpenAPI, { method: "DELETE", url: "/api/v1/users/me" })
}

/**
 * Update Current User
 * Updating the current user's data.
 * @param data The data for the request.
 * @param data.requestBody
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const usersUsersRouterUpdateUserMe = (
  data: UsersUsersRouterUpdateUserMeData,
): CancelablePromise<UsersUsersRouterUpdateUserMeResponse> => {
  return __request(OpenAPI, {
    method: "PATCH",
    url: "/api/v1/users/me",
    body: data.requestBody,
    mediaType: "application/json",
    errors: { 422: "Validation Error" },
  })
}

/**
 * Update Current User's Password
 * Update the current user's password.
 * @param data The data for the request.
 * @param data.requestBody
 * @returns Message Successful Response
 * @throws ApiError
 */
export const usersUsersRouterUpdatePasswordMe = (
  data: UsersUsersRouterUpdatePasswordMeData,
): CancelablePromise<UsersUsersRouterUpdatePasswordMeResponse> => {
  return __request(OpenAPI, {
    method: "PATCH",
    url: "/api/v1/users/me/password",
    body: data.requestBody,
    mediaType: "application/json",
    errors: { 422: "Validation Error" },
  })
}

/**
 * Register New User.
 * @param data The data for the request.
 * @param data.requestBody
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const usersUsersRouterRegisterUser = (
  data: UsersUsersRouterRegisterUserData,
): CancelablePromise<UsersUsersRouterRegisterUserResponse> => {
  return __request(OpenAPI, {
    method: "POST",
    url: "/api/v1/users/signup",
    body: data.requestBody,
    mediaType: "application/json",
    errors: { 422: "Validation Error" },
  })
}

/**
 * Read User by ID
 * Retrieving user data by ID.
 * @param data The data for the request.
 * @param data.id User ID
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const usersUsersRouterReadUserById = (
  data: UsersUsersRouterReadUserByIdData,
): CancelablePromise<UsersUsersRouterReadUserByIdResponse> => {
  return __request(OpenAPI, {
    method: "GET",
    url: "/api/v1/users/{id}",
    path: { id: data.id },
    errors: { 422: "Validation Error" },
  })
}

/**
 * Update User by ID
 * Update user by ID (for superusers only).
 * @param data The data for the request.
 * @param data.id User ID
 * @param data.requestBody
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const usersUsersRouterUpdateUser = (
  data: UsersUsersRouterUpdateUserData,
): CancelablePromise<UsersUsersRouterUpdateUserResponse> => {
  return __request(OpenAPI, {
    method: "PATCH",
    url: "/api/v1/users/{id}",
    path: { id: data.id },
    body: data.requestBody,
    mediaType: "application/json",
    errors: { 422: "Validation Error" },
  })
}

/**
 * Delete User by ID
 * Delete a user by their ID (superusers only).
 * @param data The data for the request.
 * @param data.id User ID
 * @returns Message Successful Response
 * @throws ApiError
 */
export const usersUsersRouterDeleteUser = (
  data: UsersUsersRouterDeleteUserData,
): CancelablePromise<UsersUsersRouterDeleteUserResponse> => {
  return __request(OpenAPI, {
    method: "DELETE",
    url: "/api/v1/users/{id}",
    path: { id: data.id },
    errors: { 422: "Validation Error" },
  })
}

/**
 * Test emails
 * Send a test email.
 * @param data The data for the request.
 * @param data.emailTo
 * @returns Message Successful Response
 * @throws ApiError
 */
export const utilsUtilsRouterTestEmail = (
  data: UtilsUtilsRouterTestEmailData,
): CancelablePromise<UtilsUtilsRouterTestEmailResponse> => {
  return __request(OpenAPI, {
    method: "POST",
    url: "/api/v1/utils/test-email/",
    query: { email_to: data.emailTo },
    errors: { 422: "Validation Error" },
  })
}

/**
 * Health check
 * @returns Message Successful Response
 * @throws ApiError
 */
export const utilsUtilsRouterHealthCheck = (): CancelablePromise<UtilsUtilsRouterHealthCheckResponse> => {
  return __request(OpenAPI, { method: "GET", url: "/api/v1/utils/health-check/" })
}

/**
 * Read Items
 * Getting the list of items. Anonymous users get an empty list.
 * @param data The data for the request.
 * @param data.skip
 * @param data.limit
 * @returns ItemsPublic Successful Response
 * @throws ApiError
 */
export const itemsItemsRouterReadItems = (
  data: ItemsItemsRouterReadItemsData = {},
): CancelablePromise<ItemsItemsRouterReadItemsResponse> => {
  return __request(OpenAPI, {
    method: "GET",
    url: "/api/v1/items/",
    query: { skip: data.skip, limit: data.limit },
    errors: { 422: "Validation Error" },
  })
}

/**
 * Create Item
 * Creating a new Item.
 * @param data The data for the request.
 * @param data.requestBody
 * @returns ItemPublic Successful Response
 * @throws ApiError
 */
export const itemsItemsRouterCreateItem = (
  data: ItemsItemsRouterCreateItemData,
): CancelablePromise<ItemsItemsRouterCreateItemResponse> => {
  return __request(OpenAPI, {
    method: "POST",
    url: "/api/v1/items/",
    body: data.requestBody,
    mediaType: "application/json",
    errors: { 422: "Validation Error" },
  })
}

/**
 * Read Item by ID
 * Getting an item by ID.
 * @param data The data for the request.
 * @param data.id Item ID
 * @returns ItemPublic Successful Response
 * @throws ApiError
 */
export const itemsItemsRouterReadItem = (
  data: ItemsItemsRouterReadItemData,
): CancelablePromise<ItemsItemsRouterReadItemResponse> => {
  return __request(OpenAPI, {
    method: "GET",
    url: "/api/v1/items/{id}",
    path: { id: data.id },
    errors: { 422: "Validation Error" },
  })
}

/**
 * Update Item.
 * @param data The data for the request.
 * @param data.id Item ID
 * @param data.requestBody
 * @returns ItemPublic Successful Response
 * @throws ApiError
 */
export const itemsItemsRouterUpdateItem = (
  data: ItemsItemsRouterUpdateItemData,
): CancelablePromise<ItemsItemsRouterUpdateItemResponse> => {
  return __request(OpenAPI, {
    method: "PUT",
    url: "/api/v1/items/{id}",
    path: { id: data.id },
    body: data.requestBody,
    mediaType: "application/json",
    errors: { 422: "Validation Error" },
  })
}

/**
 * Delete Item
 * Deleting an Item.
 * @param data The data for the request.
 * @param data.id Item ID
 * @returns Message Successful Response
 * @throws ApiError
 */
export const itemsItemsRouterDeleteItem = (
  data: ItemsItemsRouterDeleteItemData,
): CancelablePromise<ItemsItemsRouterDeleteItemResponse> => {
  return __request(OpenAPI, {
    method: "DELETE",
    url: "/api/v1/items/{id}",
    path: { id: data.id },
    errors: { 422: "Validation Error" },
  })
}

/**
 * Create User
 * Create new user and send new account email.
 * @param data The data for the request.
 * @param data.requestBody
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const privatePrivateRouterCreateUser = (
  data: PrivatePrivateRouterCreateUserData,
): CancelablePromise<PrivatePrivateRouterCreateUserResponse> => {
  return __request(OpenAPI, {
    method: "POST",
    url: "/api/v1/private/users/",
    body: data.requestBody,
    mediaType: "application/json",
    errors: { 422: "Validation Error" },
  })
}
