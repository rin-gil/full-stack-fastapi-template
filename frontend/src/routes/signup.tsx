/**
 * @file Defines the 'SignUp' page component.
 * @description This file contains the React component for user registration (sign up).
 * It handles form submission, client-side validation using react-hook-form,
 * and interacts with the authentication hook to register a new user.
 * It also includes route protection to redirect authenticated users away from the sign-up page.
 */

import { Container, Flex, Image, Input, Text } from "@chakra-ui/react"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import type { JSX } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { FiLock, FiUser } from "react-icons/fi"

import type { UserRegister } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import {
  confirmPasswordRules,
  emailPattern,
  namePattern,
  passwordRules,
} from "@/utils"
import Logo from "/assets/images/fastapi-logo.svg"

/**
 * @interface UserRegisterForm
 * @description Extends the UserRegister type with an additional field for confirming password on the client-side.
 * This interface is used for the form data handling in `react-hook-form`.
 * @property {string} confirm_password - The field to confirm the user's chosen password.
 */
interface UserRegisterForm extends UserRegister {
  confirm_password: string
}

/**
 * @function SignUp
 * @description A React functional component that renders the user registration form.
 * It manages form state and validation, handles user input for email, full name,
 * password, and password confirmation, and submits the registration data.
 * It also displays links for existing users to log in.
 * @returns {JSX.Element} The rendered sign-up form.
 */
export function SignUp(): JSX.Element {
  const { signUpMutation } = useAuth()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
    },
  })

  /**
   * @function onSubmit
   * @description Handles the form submission for user registration.
   * It extracts the necessary user data, excluding the `confirm_password` field,
   * and triggers the `signUpMutation` to register the user via the API.
   * @param {UserRegisterForm} data - The form data submitted by the user, including `confirm_password`.
   * @returns {void}
   */
  const onSubmit: SubmitHandler<UserRegisterForm> = async (
    data: UserRegisterForm,
  ): Promise<void> => {
    if (isSubmitting) {
      // Prevents repeated calls if the form is already in the process of being sent.
      return
    }
    // Destructure to exclude confirm_password, as it's only for client-side validation.
    const { confirm_password, ...userData } = data
    await signUpMutation.mutateAsync(userData)
  }

  return (
    <>
      <Flex flexDir={{ base: "column", md: "row" }} justify="center" h="100vh">
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
            invalid={!!errors.full_name}
            errorText={errors.full_name?.message}
          >
            <InputGroup w="100%" startElement={<FiUser />}>
              <Input
                id="full_name"
                {...register("full_name", {
                  required: "Full Name is required",
                  pattern: namePattern,
                })}
                placeholder="Full Name"
                type="text"
              />
            </InputGroup>
          </Field>

          <Field invalid={!!errors.email} errorText={errors.email?.message}>
            <InputGroup w="100%" startElement={<FiUser />}>
              <Input
                id="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                placeholder="Email"
                type="email"
              />
            </InputGroup>
          </Field>
          <PasswordInput
            startElement={<FiLock />}
            {...register("password", passwordRules())}
            placeholder="Password"
            errors={errors}
          />
          <PasswordInput
            startElement={<FiLock />}
            {...register("confirm_password", confirmPasswordRules(getValues))}
            placeholder="Confirm Password"
            errors={errors}
          />
          <Button variant="solid" type="submit" loading={isSubmitting}>
            Sign Up
          </Button>
          <Text>
            Already have an account?{" "}
            <RouterLink to="/login" className="main-link">
              Log In
            </RouterLink>
          </Text>
        </Container>
      </Flex>
    </>
  )
}

/**
 * @constant Route
 * @description Defines the route configuration for the '/signup' path.
 * It specifies the component to render and implements a `beforeLoad` guard
 * to redirect authenticated users to the home page, preventing them from accessing
 * the sign-up form while logged in.
 */
export const Route = createFileRoute("/signup")({
  component: SignUp,
  /**
   * @function beforeLoad
   * @description An asynchronous function that runs before the route loads.
   * It checks if the user is logged in using {@link isLoggedIn} and, if so,
   * throws a redirect to the home page, preventing access to the sign-up form while logged in.
   * @returns {Promise<void>} A promise that resolves if the user is not logged in,
   *   or rejects with a redirect if the user is authenticated.
   * @throws {Error} A redirect error if the user is authenticated, redirecting them to "/".
   */
  beforeLoad: async (): Promise<void> => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

SignUp.displayName = "SignUp"
