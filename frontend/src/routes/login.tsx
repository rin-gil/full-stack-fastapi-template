/**
 * @file Defines the Login page component.
 * @description This component provides the user interface and logic for user login.
 * It includes a form with validation, handles submission, and interacts with the
 * `useAuth` hook to perform the authentication. It also handles redirection for
 * already authenticated users.
 */

import { Container, Image, Input, Text } from "@chakra-ui/react"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import type { JSX } from "react"
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

export const Route = createFileRoute("/login")({
  component: Login,
  /**
   * Loader function that runs before the component mounts.
   * If the user is already logged in, it redirects them to the home page.
   * @throws {Error} A redirect error if the user is authenticated.
   */
  beforeLoad: async (): Promise<void> => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

/**
 * The main component for the Login page.
 * It renders a form for user authentication and handles all related logic.
 *
 * @returns {JSX.Element} The rendered Login page component.
 */
export function Login(): JSX.Element {
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

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    if (isSubmitting) return
    resetError()
    try {
      await loginMutation.mutateAsync({ formData: data })
    } catch {
      // Error is handled by the `onError` callback in the `useAuth` hook.
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
      <Image
        src={Logo}
        alt="FastAPI logo"
        height="auto"
        maxW="2xs"
        alignSelf="center"
        mb={4}
      />
      <Field
        invalid={!!errors.username || !!error}
        errorText={errors.username?.message || error}
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

Login.displayName = "Login"
