import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { FiBriefcase, FiHome, FiSettings, FiUsers } from "react-icons/fi"
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

interface SidebarItemsProps {
  onClose?: () => void
}

interface Item {
  icon: IconType
  titleKey: string  // 改为翻译键
  path: string
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  const items: Item[] = [
    { icon: FiHome, titleKey: "sidebar.dashboard", path: "/" },
    { icon: FiBriefcase, titleKey: "sidebar.items", path: "/items" },
    { icon: FiSettings, titleKey: "sidebar.userSettings", path: "/settings" },
    { icon: FiBriefcase, titleKey: "sidebar.aiTranslation", path: "/ai-translation-demo" },
  ]

  const finalItems: Item[] = currentUser?.is_superuser
    ? [...items, { icon: FiUsers, titleKey: "sidebar.admin", path: "/admin" }]
    : items

  const listItems = finalItems.map(({ icon, titleKey, path }) => (
    <RouterLink key={titleKey} to={path} onClick={onClose}>
      <Flex
        gap={4}
        px={4}
        py={2}
        _hover={{
          background: "gray.subtle",
        }}
        alignItems="center"
        fontSize="sm"
      >
        <Icon as={icon} alignSelf="center" />
        <Text ml={2}>{t(titleKey)}</Text>
      </Flex>
    </RouterLink>
  ))

  return (
    <>
      <Text fontSize="xs" px={4} py={2} fontWeight="bold">
        {t('sidebar.menu')}
      </Text>
      <Box>{listItems}</Box>
    </>
  )
}

export default SidebarItems
