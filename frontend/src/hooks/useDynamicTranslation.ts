import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import aiTranslationGenerator from '@/services/aiTranslationGenerator';

/**
 * 动态翻译Hook
 * 管理AI生成的翻译内容并动态替换i18n资源
 */
export const useDynamicTranslation = () => {
  const { i18n } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, Record<string, string>>>({});
  const [supportedLanguages] = useState(aiTranslationGenerator.getSupportedLanguages());

  /**
   * 检查是否为AI支持的语言
   */
  const isAILanguage = useCallback((languageCode: string): boolean => {
    return supportedLanguages.some(lang => lang.code === languageCode);
  }, [supportedLanguages]);

  /**
   * 加载或生成AI翻译 (简化版)
   */
  const loadAITranslations = useCallback(async (targetLanguage: string) => {
    if (!isAILanguage(targetLanguage)) {
      return false;
    }

    // 检查是否已经有翻译
    if (dynamicTranslations[targetLanguage]) {
      console.log(`✅ 使用缓存的 ${targetLanguage} 翻译`);
      return true;
    }

    console.log(`🚀 开始加载 ${targetLanguage} 翻译`);
    setIsTranslating(true);

    try {
      // 直接生成核心翻译
      const translations = await aiTranslationGenerator.generateTranslations(targetLanguage);
      if (Object.keys(translations).length > 0) {
        setDynamicTranslations(prev => ({
          ...prev,
          [targetLanguage]: translations
        }));
        console.log(`✅ ${targetLanguage} 翻译加载完成，共 ${Object.keys(translations).length} 个文本`);
        return true;
      }
    } catch (error) {
      console.error('❌ 翻译加载失败:', error);
    } finally {
      setIsTranslating(false);
    }

    return false;
  }, [isAILanguage, dynamicTranslations]);

  /**
   * 切换到AI语言
   */
  const switchToAILanguage = useCallback(async (targetLanguage: string) => {
    if (!isAILanguage(targetLanguage)) {
      console.warn(`${targetLanguage} is not supported for AI translation`);
      return false;
    }

    // 加载翻译
    const loaded = await loadAITranslations(targetLanguage);
    if (!loaded) {
      return false;
    }

    // 动态添加翻译资源到i18next
    const translations = dynamicTranslations[targetLanguage];
    if (translations) {
      i18n.addResourceBundle(targetLanguage, 'translation', translations, true, true);
    }

    // 切换语言
    i18n.changeLanguage(targetLanguage);
    localStorage.setItem('language', targetLanguage);
    localStorage.setItem('ai_language', targetLanguage);

    return true;
  }, [isAILanguage, loadAITranslations, dynamicTranslations, i18n]);

  /**
   * 切换到i18n原生语言
   */
  const switchToNativeLanguage = useCallback((languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    localStorage.removeItem('ai_language');
  }, [i18n]);

  /**
   * 恢复到原文
   */
  const restoreOriginal = useCallback(() => {
    const defaultLanguage = 'en';
    i18n.changeLanguage(defaultLanguage);
    localStorage.setItem('language', defaultLanguage);
    localStorage.removeItem('ai_language');
  }, [i18n]);

  /**
   * 获取当前语言信息
   */
  const getCurrentLanguageInfo = useCallback(() => {
    const currentLang = i18n.language;
    const aiLanguage = localStorage.getItem('ai_language');
    const effectiveLang = aiLanguage || currentLang;

    // 检查是否为原生i18n语言
    if (['en', 'zh'].includes(effectiveLang)) {
      const nativeLangs = {
        'en': { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isAI: false },
        'zh': { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', isAI: false }
      };
      return nativeLangs[effectiveLang as keyof typeof nativeLangs];
    }

    // AI语言
    const aiLang = supportedLanguages.find(lang => lang.code === effectiveLang);
    if (aiLang) {
      const flagMap: Record<string, string> = {
        'ja': '🇯🇵',
        'ko': '🇰🇷',
        'fr': '🇫🇷',
        'de': '🇩🇪',
        'es': '🇪🇸',
        'ru': '🇷🇺',
        'it': '🇮🇹',
        'pt': '🇵🇹',
        'ar': '🇸🇦'
      };
      return {
        code: aiLang.code,
        name: aiLang.name,
        nativeName: aiLang.nativeName,
        flag: flagMap[aiLang.code] || '🌐',
        isAI: true
      };
    }

    // 默认返回英文
    return { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isAI: false };
  }, [i18n.language, supportedLanguages]);

  /**
   * 初始化时恢复AI翻译状态
   */
  useEffect(() => {
    const aiLanguage = localStorage.getItem('ai_language');
    if (aiLanguage && isAILanguage(aiLanguage)) {
      loadAITranslations(aiLanguage).then(loaded => {
        if (loaded && dynamicTranslations[aiLanguage]) {
          i18n.addResourceBundle(aiLanguage, 'translation', dynamicTranslations[aiLanguage], true, true);
          i18n.changeLanguage(aiLanguage);
        }
      });
    }
  }, [isAILanguage, loadAITranslations, dynamicTranslations, i18n]);

  return {
    isTranslating,
    isAILanguage,
    supportedLanguages,
    currentLanguageInfo: getCurrentLanguageInfo(),
    dynamicTranslations,
    switchToAILanguage,
    switchToNativeLanguage,
    restoreOriginal,
    loadAITranslations,
  };
};

export default useDynamicTranslation;