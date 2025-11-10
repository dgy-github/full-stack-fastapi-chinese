// frontend/src/components/UserSettings/ChangePassword.tsx

import { Box, Button, Container, Heading, VStack } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FiLock } from "react-icons/fi"

import { type ApiError, type UpdatePassword, UsersService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "@/utils"
import { PasswordInput } from "../ui/password-input"

interface UpdatePasswordForm extends UpdatePassword {
  confirm_password: string
}

const ChangePassword = () => {
  const { t } = useTranslation()
  const { showSuccessToast } = useCustomToast()

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
  })

  const mutation = useMutation({
    mutationFn: (data: UpdatePassword) =>
      UsersService.updatePasswordMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast(t('settings.password.updateSuccess'))
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err, t)
    },
  })

  const onSubmit: SubmitHandler<UpdatePasswordForm> = async (data) => {
    mutation.mutate(data)
  }

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        {t('settings.password.title')}
      </Heading>
      <Box as="form" onSubmit={handleSubmit(onSubmit)}>
        <VStack gap={4} w={{ base: "100%", md: "sm" }}>
          {/* 当前密码 */}
          <PasswordInput
            type="current_password"
            startElement={<FiLock />}
            {...register("current_password", passwordRules(t, true))}
            placeholder={t('placeholder.currentPassword')}
            errors={errors}
          />

          {/* 新密码 */}
          <PasswordInput
            type="new_password"
            startElement={<FiLock />}
            {...register("new_password", passwordRules(t, true))}
            placeholder={t('placeholder.newPassword')}
            errors={errors}
          />

          {/* 确认新密码 */}
          <PasswordInput
            type="confirm_password"
            startElement={<FiLock />}
            {...register("confirm_password", confirmPasswordRules(getValues, t, true))}
            placeholder={t('placeholder.confirmPassword')}
            errors={errors}
          />
        </VStack>

        <Button
          variant="solid"
          mt={4}
          type="submit"
          loading={isSubmitting}
        >
          {t('common.save')}
        </Button>
      </Box>
    </Container>
  )
}

export default ChangePassword
