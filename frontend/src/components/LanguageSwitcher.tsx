import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@chakra-ui/react';
import { HStack } from '@chakra-ui/react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  return (
    <HStack gap={2}>
      {languages.map((lang) => (
        <Button
          key={lang.code}
          size="sm"
          variant={i18n.language === lang.code ? 'solid' : 'outline'}
          colorScheme={i18n.language === lang.code ? 'blue' : 'gray'}
          onClick={() => changeLanguage(lang.code)}
        >
          {lang.flag} {lang.name}
        </Button>
      ))}
    </HStack>
  );
};

export default LanguageSwitcher;
