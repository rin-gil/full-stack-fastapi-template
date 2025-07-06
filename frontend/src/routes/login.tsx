/**
 * @file Login page component.
 * This component handles user login functionality, including form submission,
 * validation, and interaction with the authentication hook.
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

import type {
  LoginLoginRouterLoginAccessTokenData,
  login_access_token,
} from "@/client"
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
   * If the user is already logged in, redirect them to the home page before
   * loading the login page.
   */
  beforeLoad: async (): Promise<void> => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

type LoginFormInputs = LoginLoginRouterLoginAccessTokenData["formData"]

/**
 * This component handles user login functionality, including form submission,
 * validation, and interaction with the authentication hook.
 *
 * The component is a TanStack Router route, and is associated with the route
 * path "/login". It renders a centered login form with input fields for
 * username and password, as well as links for password recovery and
 * registration. The form is validated using React Hook Form, and the
 * authentication hook is used to handle the login mutation.
 *
 * The component also redirects the user to the home page if they are already
 * logged in.
 */
function Login(): JSX.Element {
  const { loginMutation } = useAuth()
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
   * Handles the form submission event for the login form.
   *
   * This function is triggered when the login form is submitted. It receives
   * the form data, which includes the username and password, and uses the
   * `loginMutation` hook to perform the login action.
   *
   * @param data - The form data containing the user's login credentials.
   */
  const onSubmit: SubmitHandler<LoginFormInputs> = (
    data: login_access_token,
  ): void => {
    loginMutation.mutate(data)
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
      <Field invalid={!!errors.username} errorText={errors.username?.message}>
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
