import { Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === "zh" ? "en" : "zh"
    i18n.changeLanguage(newLang)
  }

  return (
    <Button
      onClick={toggleLanguage}
      size="sm"
      variant="ghost"
      fontWeight="normal"
    >
      {i18n.language === "zh" ? "EN" : "中文"}
    </Button>
  )
}

export default LanguageSwitcher
