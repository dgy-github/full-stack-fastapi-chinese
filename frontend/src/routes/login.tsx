import {Container, Image, Input, Text, Box, Flex} from "@chakra-ui/react"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FiLock, FiMail } from "react-icons/fi"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/fastapi-logo.svg"
import { emailPattern, passwordRules, handleError } from "../utils"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function Login() {
  const { t } = useTranslation()
  const { loginMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await loginMutation.mutateAsync(data)
    } catch (err: any) {
      handleError(err, t)
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
      {/* 语言切换器 */}
      <Box position="absolute" top={4} right={4}>
        <LanguageSwitcher />
      </Box>

      <Image
        src={Logo}
        alt="FastAPI logo"
        height="auto"
        maxW="2xs"
        alignSelf="center"
        mb={4}
      />

      {/* Email 字段 */}
      <Field
        invalid={!!errors.username}
        errorText={errors.username?.message || !!error}
      >
        <InputGroup w="100%" startElement={<FiMail />}>
          <Input
            {...register("username", {
              required: t("validation.usernameRequired"),
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
        size={{ base: "md", md: "lg" }}
      />

      {/* 忘记密码链接 */}
      <Flex justify="flex-end" mt={-2} mb={2}>
        <RouterLink to="/recover-password" className="main-link">
          <Text
            fontSize="sm"
            color="blue.600"
            _hover={{ color: "blue.700", textDecoration: "underline" }}
          >
            {t("auth.forgotPassword")}
          </Text>
        </RouterLink>
      </Flex>

      {/* 登录按钮 */}
      <Button
        variant="solid"
        type="submit"
        loading={isSubmitting}
        size={{ base: "md", md: "lg" }}
        w="100%"
      >
        {t("auth.loginButton")}
      </Button>

      {/* 注册链接 */}
      <Text>
        {t("auth.noAccount")}{" "}
        <RouterLink to="/signup" className="main-link">
          {t("auth.signUp")}
        </RouterLink>
      </Text>
    </Container>
  )
}
