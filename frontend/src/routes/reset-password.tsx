import {
  Container,
  Flex,
  Heading,
  Image,
  Text,
  Box,
  VStack,
} from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FiLock } from "react-icons/fi"

import { type ApiError, LoginService, type NewPassword } from "@/client"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "@/utils"
import Logo from "/assets/images/fastapi-logo.svg"

interface NewPasswordForm extends NewPassword {
  confirm_password: string
}

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function ResetPassword() {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  })
  const { showSuccessToast } = useCustomToast()
  const navigate = useNavigate()

  const resetPassword = async (data: NewPassword) => {
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      throw new Error(t("auth.invalidToken"))
    }
    await LoginService.resetPassword({
      requestBody: { new_password: data.new_password, token: token },
    })
  }

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      showSuccessToast(t("auth.resetPasswordSuccess"))
      reset()
      navigate({ to: "/login" })
    },
    onError: (err: ApiError) => {
      handleError(err, t)
    },
  })

  const onSubmit: SubmitHandler<NewPasswordForm> = async (data) => {
    mutation.mutate(data)
  }

  return (
    <Flex
      flexDir={{ base: "column", md: "row" }}
      justify="center"
      align="center"
      minH="100vh"
      bg={{ base: "white", md: "gray.50" }}
    >
      <Container
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        maxW="md"
        p={{ base: 6, md: 8 }}
        bg="white"
        borderRadius={{ base: 0, md: "lg" }}
        boxShadow={{ base: "none", md: "xl" }}
        position="relative"
      >
        {/* 语言切换器 */}
        <Box
          position="absolute"
          top={{ base: 4, md: 6 }}
          right={{ base: 4, md: 6 }}
          zIndex={10}
        >
          <LanguageSwitcher />
        </Box>

        {/* Logo */}
        <Image
          src={Logo}
          alt="FastAPI logo"
          height="auto"
          maxW={{ base: "120px", md: "150px" }}
          mx="auto"
          mb={6}
        />

        {/* 标题和描述 */}
        <VStack gap={3} mb={6}>
          <Heading
            size={{ base: "xl", md: "2xl" }}
            color="ui.main"
            textAlign="center"
          >
            {t("auth.resetPasswordTitle")}
          </Heading>
          <Text
            textAlign="center"
            fontSize={{ base: "sm", md: "md" }}
            color="gray.600"
            px={2}
          >
            {t("auth.resetPasswordDescription")}
          </Text>
        </VStack>

        {/* 新密码输入框 */}
        <Box mb={4}>
          <PasswordInput
            startElement={<FiLock />}
            type="new_password"
            errors={errors}
            {...register("new_password", passwordRules(t, true))}
            placeholder={t("placeholder.newPassword")}
            size={{ base: "md", md: "lg" }}
          />
        </Box>

        {/* 确认密码输入框 */}
        <Box mb={6}>
          <PasswordInput
            startElement={<FiLock />}
            type="confirm_password"
            errors={errors}
            {...register("confirm_password", confirmPasswordRules(getValues, t, true))}
            placeholder={t("placeholder.confirmPassword")}
            size={{ base: "md", md: "lg" }}
          />
        </Box>

        {/* 重置密码按钮 */}
        <Button
          variant="solid"
          type="submit"
          loading={isSubmitting}
          size={{ base: "md", md: "lg" }}
          w="100%"
        >
          {t("auth.resetPasswordButton")}
        </Button>

        {/* 提示信息框 */}
        <Box
          mt={6}
          p={4}
          bg="blue.50"
          borderRadius="md"
          borderLeft="4px solid"
          borderColor="blue.500"
        >
          <Text fontSize="sm" color="blue.700">
            💡 {t("auth.resetPasswordDescription")}
          </Text>
        </Box>
      </Container>
    </Flex>
  )
}

export default ResetPassword
