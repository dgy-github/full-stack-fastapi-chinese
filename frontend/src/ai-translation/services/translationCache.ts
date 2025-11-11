import { TranslationCache, TranslationRequest, TranslationResponse } from '../types/translation';
import { getAIConfig } from './config';

export class TranslationCacheManager {
  private cache: TranslationCache = {};
  private readonly CACHE_KEY = 'ai-translation-cache';
  private readonly MAX_CACHE_SIZE = 1000; // 最大缓存条目数

  constructor() {
    this.loadCache();
    this.cleanupExpiredEntries();
  }

  // 生成缓存键
  private generateCacheKey(request: TranslationRequest): string {
    const { text, from, to, context } = request;
    return `${from}-${to}-${text.toLowerCase().trim()}-${context || ''}`.replace(/\s+/g, '_');
  }

  // 从localStorage加载缓存
  private loadCache(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to load translation cache:', error);
      this.cache = {};
    }
  }

  // 保存缓存到localStorage
  private saveCache(): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save translation cache:', error);
      // 如果存储空间不足，清理旧缓存
      this.cleanupOldEntries();
      try {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
      } catch (retryError) {
        console.warn('Failed to save translation cache after cleanup:', retryError);
      }
    }
  }

  // 清理过期条目
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (this.cache[key].expiresAt < now) {
        delete this.cache[key];
      }
    });
  }

  // 清理最旧的条目（当缓存过大时）
  private cleanupOldEntries(): void {
    const entries = Object.entries(this.cache);
    if (entries.length > this.MAX_CACHE_SIZE) {
      // 按时间戳排序，删除最旧的条目
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
      const toDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE + 100);
      toDelete.forEach(([key]) => delete this.cache[key]);
    }
  }

  // 获取翻译结果
  get(request: TranslationRequest): TranslationResponse | null {
    const key = this.generateCacheKey(request);
    const cached = this.cache[key];

    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (cached.expiresAt < Date.now()) {
      delete this.cache[key];
      this.saveCache();
      return null;
    }

    return {
      translatedText: cached.translatedText,
      sourceLanguage: request.from,
      targetLanguage: request.to,
    };
  }

  // 设置翻译结果
  set(request: TranslationRequest, response: TranslationResponse): void {
    const config = getAIConfig();
    const key = this.generateCacheKey(request);
    const now = Date.now();

    this.cache[key] = {
      translatedText: response.translatedText,
      timestamp: now,
      expiresAt: now + (config.cacheExpiration || 24 * 60 * 60 * 1000),
    };

    // 定期清理过期条目
    if (Math.random() < 0.1) { // 10%概率执行清理
      this.cleanupExpiredEntries();
    }

    this.saveCache();
  }

  // 清空缓存
  clear(): void {
    this.cache = {};
    this.saveCache();
  }

  // 获取缓存统计信息
  getStats(): { size: number; keys: string[] } {
    return {
      size: Object.keys(this.cache).length,
      keys: Object.keys(this.cache)
    };
  }

  // 删除特定缓存条目
  delete(request: TranslationRequest): boolean {
    const key = this.generateCacheKey(request);
    if (this.cache[key]) {
      delete this.cache[key];
      this.saveCache();
      return true;
    }
    return false;
  }
}

// 单例实例
export const translationCache = new TranslationCacheManager();