// AI翻译插件主入口文件

// 类型定义
export type {
  TranslationRequest,
  TranslationResponse,
  TranslationCache,
  AIProvider,
  AITranslationConfig,
  TranslationProgress,
  SupportedLanguage,
} from './types/translation';

export { SUPPORTED_LANGUAGES } from './types/translation';

// 服务类
export { AITranslator } from './services/aiTranslator';
export { TranslationCacheManager } from './services/translationCache';

// 配置和工具函数
export {
  DEFAULT_AI_CONFIG,
  getAIConfig,
  saveAIConfig,
  isAIConfigValid,
  LANGUAGE_MAP,
  TRANSLATION_PROMPTS,
} from './services/config';

// 工具函数
export {
  extractTranslatableTexts,
  extractMenuTexts,
  extractI18nTexts,
  filterTextsForTranslation,
  generateTranslationKey,
  normalizeText,
  detectLanguage,
  splitTextForTranslation,
} from './utils/textExtractor';

export {
  MenuTranslator,
  menuTranslator,
} from './utils/menuTranslator';