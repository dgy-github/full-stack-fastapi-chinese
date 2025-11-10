import { Container, Flex, Image, Input, Text, Box } from "@chakra-ui/react"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FiLock, FiUser, FiMail } from "react-icons/fi"

import type { UserRegister } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { emailPattern, passwordRules, confirmPasswordRules, handleError } from "@/utils"
import Logo from "/assets/images/fastapi-logo.svg"

export const Route = createFileRoute("/signup")({
  component: SignUp,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

interface UserRegisterForm extends UserRegister {
  confirm_password: string
}

function SignUp() {
  const { t } = useTranslation()
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

  const onSubmit: SubmitHandler<UserRegisterForm> = async (data) => {
    try {
      await signUpMutation.mutateAsync(data)
    } catch (err: any) {
      handleError(err, t)
    }
  }

  return (
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
        position="relative"
      >
        {/* 语言切换器 */}
        <Box position="absolute" top={4} right={4} zIndex={10}>
          <LanguageSwitcher />
        </Box>

        {/* Logo */}
        <Image
          src={Logo}
          alt="FastAPI logo"
          height="auto"
          maxW="2xs"
          alignSelf="center"
          mb={4}
        />

        {/* 标题 */}
        <Text
          fontSize="2xl"
          fontWeight="bold"
          textAlign="center"
          mb={2}
        >
          {t("auth.signUpTitle")}
        </Text>

        {/* Full Name 字段 */}
        <Field
          invalid={!!errors.full_name}
          errorText={errors.full_name?.message}
        >
          <InputGroup w="100%" startElement={<FiUser />}>
            <Input
              {...register("full_name", {
                required: t("validation.fullNameRequired"),
                minLength: {
                  value: 3,
                  message: t("validation.fullNameTooShort", { min: 3 }),
                },
              })}
              placeholder={t("placeholder.fullName")}
              type="text"
            />
          </InputGroup>
        </Field>

        {/* Email 字段 */}
        <Field invalid={!!errors.email} errorText={errors.email?.message}>
          <InputGroup w="100%" startElement={<FiMail />}>
            <Input
              {...register("email", {
                required: t("validation.emailRequired"),
                pattern: emailPattern(t),
              })}
              placeholder={t("placeholder.email")}
              type="email"
            />
          </InputGroup>
        </Field>

        {/* Password 字段 */}
        <PasswordInput
          type="password"
          startElement={<FiLock />}
          {...register("password", passwordRules(t, true))}
          placeholder={t("placeholder.password")}
          errors={errors}
        />

        {/* Confirm Password 字段 */}
        <PasswordInput
          type="confirm_password"
          startElement={<FiLock />}
          {...register("confirm_password", confirmPasswordRules(getValues, t, true))}
          placeholder={t("placeholder.confirmPassword")}
          errors={errors}
        />

        {/* 注册按钮 */}
        <Button variant="solid" type="submit" loading={isSubmitting} size="md">
          {t("auth.signUpButton")}
        </Button>

        {/* 登录链接 */}
        <Text textAlign="center">
          {t("auth.hasAccount")}{" "}
          <RouterLink to="/login" className="main-link">
            {t("auth.signIn")}
          </RouterLink>
        </Text>
      </Container>
    </Flex>
  )
}

export default SignUp
