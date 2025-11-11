import { extractMenuTexts, filterTextsForTranslation } from './textExtractor';
import { TranslationProgress, SupportedLanguage } from '../types/translation';

export interface MenuTranslationOptions {
  targetLanguage: SupportedLanguage;
  context?: string;
  preserveOriginal?: boolean;
  showProgress?: boolean;
}

export interface TranslatedMenuResult {
  translatedMenu: any;
  progress?: TranslationProgress;
  statistics: {
    total: number;
    translated: number;
    skipped: number;
    errors: number;
  };
}

/**
 * 菜单翻译器类
 */
export class MenuTranslator {
  private currentLanguage: SupportedLanguage;

  constructor(currentLanguage: SupportedLanguage = 'en') {
    this.currentLanguage = currentLanguage;
  }

  /**
   * 翻译菜单数据（简化版本，不依赖useAITranslation hook）
   */
  async translateMenu(
    menuData: any[],
    options: MenuTranslationOptions
  ): Promise<TranslatedMenuResult> {
    const { targetLanguage } = options;

    // 提取需要翻译的文本
    const extractedTexts = extractMenuTexts(menuData);
    const textsToTranslate = filterTextsForTranslation(extractedTexts, this.currentLanguage, targetLanguage);

    const statistics = {
      total: textsToTranslate.length,
      translated: 0,
      skipped: extractedTexts.length - textsToTranslate.length,
      errors: 0,
    };

    return {
      translatedMenu: menuData, // 返回原数据，实际翻译需要在组件中使用AI服务
      statistics,
    };
  }

  /**
   * 更新当前语言
   */
  setCurrentLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }
}

// 默认菜单翻译器实例
export const menuTranslator = new MenuTranslator();

/**
 * React Hook for menu translation (简化版本)
 */
export const useMenuTranslator = () => {
  const translateMenu = async (
    menuData: any[],
    options: MenuTranslationOptions
  ): Promise<TranslatedMenuResult> => {
    return menuTranslator.translateMenu(menuData, options);
  };

  const updateMenuLanguage = (
    _menuData: any[],
    newLanguage: SupportedLanguage
  ): void => {
    menuTranslator.setCurrentLanguage(newLanguage);
  };

  return {
    translateMenu,
    updateMenuLanguage,
    getCurrentLanguage: () => menuTranslator.getCurrentLanguage(),
  };
};