// frontend/src/components/UserSettings/UserInformation.tsx

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  type ApiError,
  type UserPublic,
  UsersService,
  type UserUpdateMe,
} from "@/client"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { emailRules, fullNameRules, handleError } from "@/utils"
import { Field } from "../ui/field"

const UserInformation = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [editMode, setEditMode] = useState(false)
  const { user: currentUser } = useAuth()

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<UserPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: currentUser?.full_name,
      email: currentUser?.email,
    },
  })

  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast(t('settings.profile.updateSuccess'))
      toggleEditMode()
    },
    onError: (err: ApiError) => {
      handleError(err, t)
    },
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const onSubmit: SubmitHandler<UserUpdateMe> = async (data) => {
    mutation.mutate(data)
  }

  const onCancel = () => {
    reset()
    toggleEditMode()
  }

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        {t('settings.profile.title')}
      </Heading>
      <Box
        w={{ sm: "full", md: "sm" }}
        as="form"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* 全名字段 */}
        <Field
          label={t('auth.fullName')}
          invalid={!!errors.full_name}
          errorText={errors.full_name?.message}
        >
          {editMode ? (
            <Input
              {...register("full_name", fullNameRules(t, false))}
              type="text"
              size="md"
              placeholder={t('placeholder.fullName')}
            />
          ) : (
            <Text
              fontSize="md"
              py={2}
              color={!currentUser?.full_name ? "gray" : "inherit"}
              truncate
              maxW="sm"
            >
              {currentUser?.full_name || "N/A"}
            </Text>
          )}
        </Field>

        {/* 邮箱字段 */}
        <Field
          mt={4}
          label={t('auth.email')}
          invalid={!!errors.email}
          errorText={errors.email?.message}
        >
          {editMode ? (
            <Input
              {...register("email", emailRules(t, true))}
              type="email"
              size="md"
              placeholder={t('placeholder.email')}
            />
          ) : (
            <Text fontSize="md" py={2} truncate maxW="sm">
              {currentUser?.email}
            </Text>
          )}
          {!editMode && (
            <Text color="ui.dim" fontSize="sm" mt={1}>
              {t('settings.profile.emailNote')}
            </Text>
          )}
        </Field>

        {/* 按钮组 */}
        <Flex mt={4} gap={3}>
          <Button
            variant="solid"
            onClick={editMode ? undefined : toggleEditMode}
            type={editMode ? "submit" : "button"}
            loading={editMode ? isSubmitting : false}
            disabled={editMode ? !isDirty || !getValues("email") : false}
          >
            {editMode ? t('common.save') : t('common.edit')}
          </Button>
          {editMode && (
            <Button
              variant="subtle"
              colorPalette="gray"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
          )}
        </Flex>
      </Box>
    </Container>
  )
}

export default UserInformation
