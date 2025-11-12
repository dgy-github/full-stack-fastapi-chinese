import { useState } from 'react';
import { Box, Text, Button } from '@chakra-ui/react';
import useDynamicTranslation from '@/hooks/useDynamicTranslation';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isAI?: boolean;
  isNative?: boolean;
}

/**
 * 动态AI语言切换器
 * 基于i18n + AI翻译的语言切换组件
 */
const DynamicLanguageSwitcher = () => {
  const [showMenu, setShowMenu] = useState(false);
  const {
    isTranslating,
    supportedLanguages,
    currentLanguageInfo,
    switchToAILanguage,
    switchToNativeLanguage,
    restoreOriginal,
  } = useDynamicTranslation();

  // 原生i18n支持的语言
  const nativeLanguages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isNative: true },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', isNative: true },
  ];

  // AI支持的语言
  const aiLanguages: Language[] = supportedLanguages.map(lang => ({
    code: lang.code,
    name: lang.name,
    nativeName: lang.nativeName,
    flag: getFlag(lang.code),
    isAI: true,
  }));

  function getFlag(languageCode: string): string {
    const flagMap: Record<string, string> = {
      'zh': '🇨🇳',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'es': '🇪🇸',
      'ru': '🇷🇺',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'ar': '🇸🇦',
    };
    return flagMap[languageCode] || '🌐';
  }

  const handleLanguageChange = async (languageCode: string, isAI: boolean = false) => {
    setShowMenu(false);

    if (isAI) {
      // AI翻译语言
      const success = await switchToAILanguage(languageCode);
      if (!success) {
        console.error(`Failed to switch to AI language: ${languageCode}`);
      }
    } else {
      // 原生i18n语言
      switchToNativeLanguage(languageCode);
    }
  };

  const handleRestoreOriginal = () => {
    setShowMenu(false);
    restoreOriginal();
  };

  const displayText = () => {
    if (isTranslating) {
      return `🤖 ${currentLanguageInfo.flag} 翻译中...`;
    }

    if (currentLanguageInfo.isAI) {
      return `${currentLanguageInfo.flag} ${currentLanguageInfo.nativeName}`;
    }

    return currentLanguageInfo.code === 'zh' ? '🇺🇸 EN' : '🇨🇳 中文';
  };

  return (
    <Box position="relative" zIndex={1000}>
      {/* 主按钮 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowMenu(!showMenu)}
        loading={isTranslating}
        title="切换语言"
      >
        {displayText()}
      </Button>

      {/* 下拉菜单 */}
      {showMenu && (
        <>
          {/* 背景遮罩 */}
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={999}
            onClick={() => setShowMenu(false)}
          />

          {/* 菜单内容 */}
          <Box
            position="absolute"
            top="100%"
            right={0}
            mt={2}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            boxShadow="lg"
            minWidth="200px"
            py={2}
            zIndex={1001}
          >
            {/* 原生i18n语言 */}
            <Box px={3} py={1}>
              <Text fontSize="xs" color="gray.500" fontWeight="bold">
                🎯 原生支持
              </Text>
            </Box>
            {nativeLanguages.map(language => (
              <Button
                key={language.code}
                variant="ghost"
                size="sm"
                width="100%"
                justifyContent="flex-start"
                onClick={() => handleLanguageChange(language.code, false)}
                bg={!currentLanguageInfo.isAI && currentLanguageInfo.code === language.code ? "gray.100" : "transparent"}
              >
                <span style={{ marginRight: '8px' }}>{language.flag}</span>
                <Text flex={1} textAlign="left">
                  {language.nativeName}
                </Text>
                {!currentLanguageInfo.isAI && currentLanguageInfo.code === language.code && (
                  <Text color="green.500" fontSize="xs">✓</Text>
                )}
              </Button>
            ))}

            {/* AI翻译语言 */}
            <Box px={3} py={1} mt={2}>
              <Text fontSize="xs" color="gray.500" fontWeight="bold">
                🤖 AI翻译
              </Text>
            </Box>
            {aiLanguages.map(language => (
              <Button
                key={language.code}
                variant="ghost"
                size="sm"
                width="100%"
                justifyContent="flex-start"
                onClick={() => handleLanguageChange(language.code, true)}
                bg={currentLanguageInfo.isAI && currentLanguageInfo.code === language.code ? "blue.50" : "transparent"}
                loading={isTranslating}
              >
                <span style={{ marginRight: '8px' }}>{language.flag}</span>
                <Text flex={1} textAlign="left">
                  {language.nativeName}
                </Text>
                {currentLanguageInfo.isAI && currentLanguageInfo.code === language.code && (
                  <Text color="blue.500" fontSize="xs">🤖</Text>
                )}
              </Button>
            ))}

            {/* 恢复原文按钮 */}
            {currentLanguageInfo.isAI && (
              <>
                <Box
                  height="1px"
                  bg="gray.200"
                  my={2}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  width="100%"
                  justifyContent="flex-start"
                  onClick={handleRestoreOriginal}
                  color="red.500"
                >
                  <span style={{ marginRight: '8px' }}>↩️</span>
                  恢复原文
                </Button>
              </>
            )}
          </Box>
        </>
      )}

      {/* 全局翻译加载状态 */}
      {isTranslating && (
        <Box
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="white"
          p={6}
          borderRadius="md"
          boxShadow="lg"
          zIndex={2000}
          textAlign="center"
        >
          <Text mb={4}>🤖 AI翻译中...</Text>
          <Box
            w="40px"
            h="40px"
            border="3px solid"
            borderColor="gray.200"
            borderTopColor="blue.500"
            borderRadius="50%"
            animation="spin 1s linear infinite"
            mx="auto"
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </Box>
      )}
    </Box>
  );
};

export default DynamicLanguageSwitcher;