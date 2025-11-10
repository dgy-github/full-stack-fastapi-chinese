import { Flex, Image, useBreakpointValue } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"

import Logo from "/assets/images/mysiteLogo.svg"
import UserMenu from "./UserMenu"
import LanguageSwitcher from "@/components/LanguageSwitcher"

function Navbar() {
  const display = useBreakpointValue({ base: "none", md: "flex" })

  return (
    <Flex
      display={display}
      justify="space-between"
      position="sticky"
      color="white"
      align="center"
      bg="bg.muted"
      w="100%"
      top={0}
      p={4}
      zIndex={10}
    >
      {/* 左侧 Logo */}
      <Link to="/">
        <Image
          src={Logo}
          alt="Logo"
          h="36px"              // ← 高度
          w="100px"              // ← 宽度（拉伸）
          objectFit="contain"    // ← 保持比例，不变形
          color="gray.800"
          cursor="pointer"
          transition="all 0.2s"
          _hover={{
            opacity: 0.7,
            transform: "scale(1.05)"
          }}
        />
      </Link>

      {/* 右侧：语言切换器 + 用户菜单 */}
      <Flex gap={3} alignItems="center">
        <LanguageSwitcher />
        <UserMenu />
      </Flex>
    </Flex>
  )
}

export default Navbar
