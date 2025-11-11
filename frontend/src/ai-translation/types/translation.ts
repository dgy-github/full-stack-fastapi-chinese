// AI翻译相关类型定义
export interface TranslationRequest {
  text: string;
  from: string;
  to: string;
  context?: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
}

export interface TranslationCache {
  [key: string]: {
    translatedText: string;
    timestamp: number;
    expiresAt: number;
  };
}

export interface AIProvider {
  name: string;
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

export interface AITranslationConfig {
  provider: 'openai' | 'claude' | 'google' | 'deepl';
  apiKey: string;
  model?: string;
  endpoint?: string;
  maxRetries?: number;
  timeout?: number;
  cacheExpiration?: number; // 缓存过期时间（毫秒）
}

export interface MenuTranslationItem {
  key: string;
  originalText: string;
  translatedText?: string;
  context?: string;
}

export interface TranslationProgress {
  total: number;
  completed: number;
  currentlyTranslating?: string;
  isTranslating: boolean;
}

export type SupportedLanguage = 'en' | 'zh' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'ru' | 'ar';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  ko: '한국어',
  ru: 'Русский',
  ar: 'العربية'
};