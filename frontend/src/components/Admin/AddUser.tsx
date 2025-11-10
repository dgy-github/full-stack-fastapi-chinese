import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FaPlus } from "react-icons/fa"
import { type UserCreate, UsersService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { emailRules, passwordRules, confirmPasswordRules, handleError } from "@/utils"
import { Checkbox } from "../ui/checkbox"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface UserCreateForm extends UserCreate {
  confirm_password: string
}

const AddUser = () => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<UserCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
      is_superuser: false,
      is_active: false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UserCreate) =>
      UsersService.createUser({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast(t("users.addUserDialog.success"))
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err, t)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const onSubmit: SubmitHandler<UserCreateForm> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-user" my={4}>
          <FaPlus fontSize="16px" />
          {t("users.addUser")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{t("users.addUserDialog.title")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              {t("users.addUserDialog.description")}
            </Text>
            <VStack gap={4}>
              {/* 邮箱字段 - 使用 emailRules */}
              <Field
                required
                invalid={!!errors.email}
                errorText={errors.email?.message}
                label={t("users.addUserDialog.email")}
              >
                <Input
                  {...register("email", emailRules(t))}
                  placeholder={t("users.addUserDialog.emailPlaceholder")}
                  type="email"
                />
              </Field>

              {/* 全名字段 */}
              <Field
                invalid={!!errors.full_name}
                errorText={errors.full_name?.message}
                label={t("users.addUserDialog.fullName")}
              >
                <Input
                  {...register("full_name")}
                  placeholder={t("users.addUserDialog.fullNamePlaceholder")}
                  type="text"
                />
              </Field>

              {/* 密码字段 - 使用 passwordRules */}
              <Field
                required
                invalid={!!errors.password}
                errorText={errors.password?.message}
                label={t("users.addUserDialog.password")}
              >
                <Input
                  {...register("password", passwordRules(t))}
                  placeholder={t("users.addUserDialog.passwordPlaceholder")}
                  type="password"
                />
              </Field>

              {/* 确认密码字段 - 使用 confirmPasswordRules */}
              <Field
                required
                invalid={!!errors.confirm_password}
                errorText={errors.confirm_password?.message}
                label={t("users.addUserDialog.confirmPassword")}
              >
                <Input
                  {...register("confirm_password", confirmPasswordRules(getValues, t))}
                  placeholder={t("placeholder.confirmPassword")}
                  type="password"
                />
              </Field>
            </VStack>

            <Flex mt={4} direction="column" gap={4}>
              <Controller
                control={control}
                name="is_superuser"
                render={({ field }) => (
                  <Field disabled={field.disabled} colorPalette="teal">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      {t("users.addUserDialog.isSuperuser")}
                    </Checkbox>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <Field disabled={field.disabled} colorPalette="teal">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      {t("users.addUserDialog.isActive")}
                    </Checkbox>
                  </Field>
                )}
              />
            </Flex>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                {t("users.addUserDialog.cancel")}
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              {t("users.addUserDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddUser
