// frontend/src/utils.ts

import type { TFunction } from "i18next"
import type { ApiError } from "./client"
import useCustomToast from "./hooks/useCustomToast"

// ============================================
// 邮箱验证规则
// ============================================
export const emailPattern = (t?: TFunction) => ({
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: t ? t("validation.emailInvalid") : "Invalid email address",
})

// ============================================
// 姓名验证规则
// ============================================
export const namePattern = (t?: TFunction) => ({
  value: /^[A-Za-z\s\u00C0-\u017F\u4e00-\u9fa5]{1,30}$/,
  message: t ? t("validation.nameInvalid") : "Invalid name",
})

// ============================================
// 全名验证规则（新增）
// ============================================
export const fullNameRules = (t?: TFunction, isRequired = true) => {
  const rules: any = {
    minLength: {
      value: 3,
      message: t
        ? t("validation.fullNameTooShort", { min: 3 })
        : "Full Name must be at least 3 characters",
    },
    maxLength: {
      value: 30,
      message: t
        ? t("validation.fullNameTooLong", { max: 30 })
        : "Full Name must be at most 30 characters",
    },
  }

  if (isRequired) {
    rules.required = t
      ? t("validation.fullNameRequired")
      : "Full Name is required"
  }

  return rules
}

// ============================================
// 邮箱验证规则（完整版）
// ============================================
export const emailRules = (t?: TFunction, isRequired = true) => {
  const rules: any = {
    pattern: emailPattern(t),
  }

  if (isRequired) {
    rules.required = t
      ? t("validation.emailRequired")
      : "Email is required"
  }

  return rules
}

// ============================================
// 密码验证规则
// ============================================
export const passwordRules = (t?: TFunction, isRequired = true) => {
  const rules: any = {
    minLength: {
      value: 8,
      message: t
        ? t("validation.passwordTooShort", { min: 8 })
        : "Password must be at least 8 characters",
    },
  }

  if (isRequired) {
    rules.required = t
      ? t("validation.passwordRequired")
      : "Password is required"
  }

  return rules
}

// ============================================
// 确认密码验证规则
// ============================================
export const confirmPasswordRules = (
  getValues: () => any,
  t?: TFunction,
  isRequired = true,
) => {
  const rules: any = {
    validate: (value: string) => {
      const password = getValues().password || getValues().new_password
      const errorMessage = t
        ? t("validation.passwordMismatch")
        : "The passwords do not match"
      return value === password ? true : errorMessage
    },
  }

  if (isRequired) {
    rules.required = t
      ? t("validation.passwordConfirmRequired")
      : "Password confirmation is required"
  }

  return rules
}

// ============================================
// 错误处理
// ============================================
export const handleError = (err: ApiError, t?: TFunction) => {
  const { showErrorToast } = useCustomToast()
  const errDetail = (err.body as any)?.detail

  let errorMessage = t
    ? t("common.somethingWentWrong")
    : "Something went wrong."

  if (errDetail) {
    if (Array.isArray(errDetail) && errDetail.length > 0) {
      errorMessage = errDetail[0].msg
    } else if (typeof errDetail === "string") {
      errorMessage = errDetail
    }
  }

  showErrorToast(errorMessage)
}
