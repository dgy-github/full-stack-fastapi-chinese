import {
  Container,
  Flex,
  Heading,
  Image,
  Input,
  Text,
  Box,
  VStack,
} from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import {
  createFileRoute,
  redirect,
  Link as RouterLink,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FiMail, FiArrowLeft } from "react-icons/fi"

import { type ApiError, LoginService } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern, handleError } from "@/utils"
import Logo from "/assets/images/fastapi-logo.svg"

interface FormData {
  email: string
}

export const Route = createFileRoute("/recover-password")({
  component: RecoverPassword,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function RecoverPassword() {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
    },
  })
  const { showSuccessToast } = useCustomToast()

  const recoverPassword = async (data: FormData) => {
    await LoginService.recoverPassword({
      email: data.email,
    })
  }

  const mutation = useMutation({
    mutationFn: recoverPassword,
    onSuccess: () => {
      showSuccessToast(t("auth.recoverPasswordSuccess"))
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err, t)
    },
  })

  const onSubmit: SubmitHandler<FormData> = async (data) => {
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
            {t("auth.recoverPasswordTitle")}
          </Heading>
          <Text
            textAlign="center"
            fontSize={{ base: "sm", md: "md" }}
            color="gray.600"
            px={2}
          >
            {t("auth.recoverPasswordDescription")}
          </Text>
        </VStack>

        {/* Email 输入框 */}
        <Field invalid={!!errors.email} errorText={errors.email?.message}>
          <InputGroup w="100%" startElement={<FiMail />}>
            <Input
              {...register("email", {
                required: t("validation.emailRequired"),
                pattern: emailPattern(t),
              })}
              placeholder={t("placeholder.email")}
              type="email"
              size={{ base: "md", md: "lg" }}
            />
          </InputGroup>
        </Field>

        {/* 提交按钮 */}
        <Button
          variant="solid"
          type="submit"
          loading={isSubmitting}
          size={{ base: "md", md: "lg" }}
          w="100%"
          mt={6}
        >
          {t("common.continue")}
        </Button>

        {/* 返回登录链接 */}
        <Flex justify="center" align="center" mt={6}>
          <RouterLink to="/login" className="main-link">
            <Flex align="center" gap={2}>
              <FiArrowLeft />
              <Text fontSize={{ base: "sm", md: "md" }}>
                {t("auth.backToLogin")}
              </Text>
            </Flex>
          </RouterLink>
        </Flex>

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
            💡 {t("auth.checkYourEmail")}
          </Text>
        </Box>
      </Container>
    </Flex>
  )
}

export default RecoverPassword
