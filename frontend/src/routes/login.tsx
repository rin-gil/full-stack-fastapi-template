/**
 * @file Defines the Login page component.
 * @description Provides the UI and logic for user login with a validated form,
 * interacting with the `useAuth` hook for authentication and handling redirection
 * for already authenticated users.
 * @module Login
 */

import { Container, Image, Input, Text } from "@chakra-ui/react"
import { Link as RouterLink, createFileRoute, redirect } from "@tanstack/react-router"
import type { FC, ReactElement } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiMail } from "react-icons/fi"

import type { login_access_token as LoginFormInputs } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/fastapi-logo.svg"
import { emailPattern, passwordRules } from "../utils"

// region Type Aliases

/**
 * Type alias for the Login component.
 * @type {LoginComponent}
 */
type LoginComponent = FC

// endregion

// region Main Code

/**
 * Main component for the Login page.
 * @description Renders a form for user authentication and handles submission logic.
 * @returns {ReactElement} The rendered Login page component.
 */
const Login: LoginComponent = (): ReactElement => {
  const { loginMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  /**
   * Handles form submission for login.
   * @param {LoginFormInputs} data - The form data containing username and password.
   * @returns {Promise<void>} Resolves when submission is complete.
   */
  const onSubmit: SubmitHandler<LoginFormInputs> = async (data: LoginFormInputs): Promise<void> => {
    if (isSubmitting) return
    resetError()
    try {
      await loginMutation.mutateAsync({ formData: data })
    } catch {
      // Error is handled by the 'onError' callback in the 'useAuth' hook.
    }
  }

  return (
    <Container
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      h="100vh"
      maxW="sm"
      alignItems="stretch"
      justifyContent="center"
      gap={4}
      centerContent
    >
      <Image src={Logo} alt="FastAPI logo" height="auto" maxW="2xs" alignSelf="center" mb={4} />
      <Field
        invalid={!!errors.username || !!error}
        errorText={errors.username?.message || (typeof error === "string" ? error : undefined)}
      >
        <InputGroup w="100%" startElement={<FiMail />}>
          <Input
            id="username"
            placeholder="Email"
            type="email"
            {...register("username", {
              required: "Username is required",
              pattern: emailPattern,
            })}
            autoComplete="on"
          />
        </InputGroup>
      </Field>
      <PasswordInput
        startElement={<FiLock />}
        placeholder="Password"
        errors={errors}
        {...register("password", passwordRules())}
      />
      <RouterLink to="/recover-password" className="main-link">
        Forgot Password?
      </RouterLink>
      <Button variant="solid" type="submit" loading={isSubmitting} size="md">
        Log In
      </Button>
      <Text>
        Don't have an account?{" "}
        <RouterLink to="/signup" className="main-link">
          Sign Up
        </RouterLink>
      </Text>
    </Container>
  )
}

/**
 * Route definition for the login page.
 * @description Checks if the user is authenticated before loading. Redirects to home if authenticated.
 * @returns {void} Nothing, throws redirect if authenticated.
 * @throws {redirect} Throws a redirect to "/" with current path if user is logged in.
 */
export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: (): void => {
    if (isLoggedIn()) {
      throw redirect({ to: "/", search: { from: window.location.pathname } })
    }
  },
})

// endregion

// region Optional Declarations

Login.displayName = "Login"

// endregion
