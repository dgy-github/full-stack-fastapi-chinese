import { AITranslationConfig, SupportedLanguage } from '../types/translation';

// AI翻译服务配置
export const DEFAULT_AI_CONFIG: AITranslationConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  maxRetries: 3,
  timeout: 10000,
  cacheExpiration: 24 * 60 * 60 * 1000, // 24小时
};

// 支持的语言映射
export const LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  'en': 'en',
  'en-US': 'en',
  'zh': 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  'es': 'es',
  'es-ES': 'es',
  'fr': 'fr',
  'fr-FR': 'fr',
  'de': 'de',
  'de-DE': 'de',
  'ja': 'ja',
  'ja-JP': 'ja',
  'ko': 'ko',
  'ko-KR': 'ko',
  'ru': 'ru',
  'ru-RU': 'ru',
  'ar': 'ar',
  'ar-SA': 'ar',
};

// AI服务提示词模板
export const TRANSLATION_PROMPTS = {
  openai: `Translate the following text to {targetLanguage}. Maintain the original tone and context. Only return the translated text:

Text: {text}

Context: {context}

Translation:`,

  claude: `Please translate the following text to {targetLanguage}. Keep the original meaning, tone, and context. Return only the translation:

Original Text: {text}
Context: {context}

Translated Text:`,

  google: `Translate from {sourceLanguage} to {targetLanguage}: {text}`,

  deepl: `Translate the following text while preserving its meaning and style: {text}`,
};

// 获取本地存储的AI配置
export const getAIConfig = (): AITranslationConfig => {
  try {
    const storedConfig = localStorage.getItem('ai-translation-config');
    if (storedConfig) {
      return { ...DEFAULT_AI_CONFIG, ...JSON.parse(storedConfig) };
    }
  } catch (error) {
    console.warn('Failed to load AI translation config from localStorage:', error);
  }
  return DEFAULT_AI_CONFIG;
};

// 保存AI配置到本地存储
export const saveAIConfig = (config: Partial<AITranslationConfig>): void => {
  try {
    const currentConfig = getAIConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem('ai-translation-config', JSON.stringify(newConfig));
  } catch (error) {
    console.warn('Failed to save AI translation config to localStorage:', error);
  }
};

// 检查AI配置是否有效
export const isAIConfigValid = (config: AITranslationConfig): boolean => {
  return !!config.apiKey && !!config.provider;
};