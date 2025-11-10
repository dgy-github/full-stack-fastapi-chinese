// frontend/src/components/UserSettings/Appearance.tsx

import { Container, Heading, Stack, Box } from "@chakra-ui/react"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"

import { Radio, RadioGroup } from "@/components/ui/radio"

const Appearance = () => {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value)
  }

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        {t('settings.appearance.title')}
      </Heading>

      {/* 主题设置 */}
      <Box mb={6}>
        <Heading size="xs" mb={3}>
          {t('settings.appearance.theme')}
        </Heading>
        <RadioGroup
          onValueChange={(e) => setTheme(e.value ?? "system")}
          value={theme}
          colorPalette="teal"
        >
          <Stack>
            <Radio value="system">{t('settings.appearance.system')}</Radio>
            <Radio value="light">{t('settings.appearance.light')}</Radio>
            <Radio value="dark">{t('settings.appearance.dark')}</Radio>
          </Stack>
        </RadioGroup>
      </Box>

      {/* 语言设置 */}
      <Box>
        <Heading size="xs" mb={3}>
          {t('settings.appearance.language')}
        </Heading>
        <select
          value={i18n.language}
          onChange={handleLanguageChange}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "0.375rem",
            border: "1px solid var(--chakra-colors-border)",
            maxWidth: "20rem",
            fontSize: "0.875rem",
            backgroundColor: "var(--chakra-colors-bg)",
            cursor: "pointer",
          }}
        >
          <option value="en">{t('settings.appearance.english')}</option>
          <option value="zh">{t('settings.appearance.chinese')}</option>
        </select>
      </Box>
    </Container>
  )
}

export default Appearance
