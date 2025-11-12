/**
 * AI动态翻译生成服务
 * 基于现有英文翻译JSON，通过AI生成其他语言的翻译
 */

interface TranslationRequest {
  sourceLanguage: string;
  targetLanguage: string;
  translations: Record<string, string>;
}

interface TranslationResponse {
  success: boolean;
  translations?: Record<string, string>;
  error?: string;
}

class AITranslationGenerator {
  private baseUrl: string;
  private cache: Map<string, Record<string, string>> = new Map();

  constructor() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.baseUrl = `${apiUrl}/api/v1/langchain`;
  }

  /**
   * 基于英文翻译生成目标语言翻译 (优化版 - 只翻译核心文本)
   */
  async generateTranslations(
    targetLanguage: string
  ): Promise<Record<string, string>> {
    const cacheKey = `core-${targetLanguage}`;

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // 只获取核心翻译文本，避免翻译过多内容
      const coreTranslations = await this.getCoreTranslations();

      console.log(`🚀 开始翻译 ${Object.keys(coreTranslations).length} 个核心文本到 ${targetLanguage}`);

      const startTime = Date.now();

      // 使用批量翻译API处理核心文本
      const entries = Object.entries(coreTranslations);
      const result: Record<string, string> = {};

      // 分批处理，每批最多30个条目 (减少单次处理量)
      for (let i = 0; i < entries.length; i += 30) {
        const batch = entries.slice(i, i + 30);
        console.log(`📦 翻译批次 ${Math.floor(i/30) + 1}/${Math.ceil(entries.length/30)}: ${batch.length} 个文本`);

        const batchTranslations = await this.translateBatchOptimized(
          targetLanguage,
          batch.map(([key, text]) => ({ key, text }))
        );

        // 将结果转换回Record格式
        batchTranslations.forEach(({ key, translated }) => {
          result[key] = translated;
        });
      }

      const endTime = Date.now();
      console.log(`✅ 翻译完成，耗时: ${endTime - startTime}ms`);

      // 缓存结果
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ 翻译失败:', error);
      return {};
    }
  }

  /**
   * 优化的批量翻译 - 使用新的批量API (带超时机制)
   */
  private async translateBatchOptimized(
    targetLanguage: string,
    items: Array<{ key: string, text: string }>
  ): Promise<Array<{ key: string, translated: string }>> {
    try {
      // 过滤掉已经翻译过的文本
      const toTranslate = items.filter(item => !this.isAlreadyTranslated(item.text, targetLanguage));

      if (toTranslate.length === 0) {
        return items.map(item => ({ key: item.key, translated: item.text }));
      }

      console.log(`🔄 批量翻译 ${toTranslate.length} 个文本到 ${targetLanguage}`);

      // 创建带超时的fetch请求
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

      const response = await fetch(`${this.baseUrl}/translate/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: toTranslate.map(item => item.text),
          source_language: 'auto',
          target_language: targetLanguage,
          context: 'web interface UI text translation'
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Batch translation failed: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      console.log(`✅ 批量翻译成功: ${data.success_count}/${data.total_count}`);

      // 创建映射表
      const translationMap = new Map();
      data.translations.forEach((item: any, index: number) => {
        translationMap.set(toTranslate[index].text, item.translated);
      });

      // 返回结果
      return items.map(item => ({
        key: item.key,
        translated: translationMap.get(item.text) || item.text
      }));

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ 批量翻译超时 (30秒)');
      } else {
        console.error('❌ 批量翻译失败:', error);
      }

      // 降级策略：返回核心翻译
      console.log('🔄 使用降级策略，返回核心翻译...');
      return this.getFallbackTranslations(items);
    }
  }

  /**
   * 降级翻译 - 提供基础的核心翻译
   */
  private getFallbackTranslations(items: Array<{ key: string, text: string }>): Array<{ key: string, translated: string }> {
    const fallbackCore: Record<string, string> = {
      'common.welcome': 'Welcome',
      'common.login': 'Log In',
      'common.logout': 'Logout',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'nav.home': 'Home',
      'nav.settings': 'Settings',
      'sidebar.dashboard': 'Dashboard',
      'sidebar.items': 'Items',
      'sidebar.userSettings': 'User Settings',
      'settings.title': 'User Settings',
      'auth.loginTitle': 'Sign in to your account',
      'auth.email': 'Email',
      'auth.password': 'Password',
    };

    return items.map(item => ({
      key: item.key,
      translated: fallbackCore[item.key] || item.text
    }));
  }

  
  /**
   * 检查文本是否已经是目标语言
   */
  private isAlreadyTranslated(text: string, targetLanguage: string): boolean {
    // 简单的语言检测启发式
    const patterns: Record<string, RegExp> = {
      'zh': /[\u4e00-\u9fff]/,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
      'ko': /[\uac00-\ud7af]/,
      'ru': /[\u0400-\u04ff]/,
      'ar': /[\u0600-\u06ff]/,
      'th': /[\u0e00-\u0e7f]/,
    };

    const pattern = patterns[targetLanguage];
    return pattern ? pattern.test(text) : false;
  }

  /**
   * 获取核心文本
   */
  private getCoreTranslations(): Record<string, string> {
    return {
      'common.welcome': 'Welcome',
      'common.login': 'Log In',
      'common.logout': 'Logout',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.cancel': 'Cancel',
      'common.submit': 'Submit',
      'common.search': 'Search',
      'nav.home': 'Home',
      'nav.settings': 'Settings',
      'sidebar.dashboard': 'Dashboard',
      'sidebar.items': 'Items',
      'sidebar.userSettings': 'User Settings',
      'sidebar.admin': 'Admin',
      'settings.title': 'User Settings',
      'auth.loginTitle': 'Sign in to your account',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.fullName': 'Full Name',
      'dashboard.greeting': 'Hi, {{name}}',
      'dashboard.welcomeBack': 'Welcome back, nice to see you again!',
      'items.title': 'Items Management',
      'users.title': 'Users Management',
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): Array<{code: string, name: string, nativeName: string}> {
    return [
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    ];
  }
}

// 单例实例
const aiTranslationGenerator = new AITranslationGenerator();

export default aiTranslationGenerator;
export type { TranslationRequest, TranslationResponse };