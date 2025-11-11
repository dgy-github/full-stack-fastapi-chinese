import { TranslationRequest, TranslationResponse, AITranslationConfig } from '../types/translation';
import { getAIConfig, TRANSLATION_PROMPTS } from './config';
import { translationCache } from './translationCache';

export class AITranslator {
  private config: AITranslationConfig;

  constructor(config?: Partial<AITranslationConfig>) {
    this.config = { ...getAIConfig(), ...config };
  }

  // 更新配置
  updateConfig(config: Partial<AITranslationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // 主要翻译方法
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    // 检查缓存
    const cached = translationCache.get(request);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.performTranslation(request);

      // 缓存结果
      translationCache.set(request, response);

      return response;
    } catch (error) {
      console.error('AI translation failed:', error);
      throw new Error(`AI translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 执行实际的翻译
  private async performTranslation(request: TranslationRequest): Promise<TranslationResponse> {
    switch (this.config.provider) {
      case 'openai':
        return this.translateWithOpenAI(request);
      case 'claude':
        return this.translateWithClaude(request);
      case 'google':
        return this.translateWithGoogle(request);
      case 'deepl':
        return this.translateWithDeepL(request);
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  // OpenAI翻译
  private async translateWithOpenAI(request: TranslationRequest): Promise<TranslationResponse> {
    const prompt = TRANSLATION_PROMPTS.openai
      .replace('{targetLanguage}', this.getLanguageName(request.to))
      .replace('{sourceLanguage}', this.getLanguageName(request.from))
      .replace('{text}', request.text)
      .replace('{context}', request.context || '');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate accurately while preserving the original tone and context.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error('No translation received from OpenAI');
    }

    return {
      translatedText,
      sourceLanguage: request.from,
      targetLanguage: request.to,
    };
  }

  // Claude翻译
  private async translateWithClaude(request: TranslationRequest): Promise<TranslationResponse> {
    const prompt = TRANSLATION_PROMPTS.claude
      .replace('{targetLanguage}', this.getLanguageName(request.to))
      .replace('{sourceLanguage}', this.getLanguageName(request.from))
      .replace('{text}', request.text)
      .replace('{context}', request.context || '');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.content?.[0]?.text?.trim();

    if (!translatedText) {
      throw new Error('No translation received from Claude');
    }

    return {
      translatedText,
      sourceLanguage: request.from,
      targetLanguage: request.to,
    };
  }

  // Google翻译（使用Google Translate API）
  private async translateWithGoogle(request: TranslationRequest): Promise<TranslationResponse> {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: request.text,
        source: request.from,
        target: request.to,
        format: 'text',
      }),
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    });

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.data?.translations?.[0]?.translatedText;

    if (!translatedText) {
      throw new Error('No translation received from Google Translate');
    }

    return {
      translatedText,
      sourceLanguage: request.from,
      targetLanguage: request.to,
    };
  }

  // DeepL翻译
  private async translateWithDeepL(request: TranslationRequest): Promise<TranslationResponse> {
    const endpoint = this.config.endpoint || 'https://api-free.deepl.com/v2/translate';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [request.text],
        source_lang: request.from.toUpperCase(),
        target_lang: request.to.toUpperCase(),
      }),
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.translations?.[0]?.text;

    if (!translatedText) {
      throw new Error('No translation received from DeepL');
    }

    return {
      translatedText,
      sourceLanguage: request.from,
      targetLanguage: request.to,
    };
  }

  // 获取语言名称
  private getLanguageName(code: string): string {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'zh': 'Chinese',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ru': 'Russian',
      'ar': 'Arabic',
    };
    return languageNames[code] || code;
  }

  // 批量翻译
  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
    const results: TranslationResponse[] = [];

    for (const request of requests) {
      try {
        const result = await this.translate(request);
        results.push(result);
      } catch (error) {
        console.error(`Failed to translate "${request.text}":`, error);
        // 返回原文作为fallback
        results.push({
          translatedText: request.text,
          sourceLanguage: request.from,
          targetLanguage: request.to,
        });
      }
    }

    return results;
  }

  // 检查服务是否可用
  async checkServiceAvailability(): Promise<boolean> {
    try {
      const testRequest: TranslationRequest = {
        text: 'Hello',
        from: 'en',
        to: 'zh',
      };

      await this.performTranslation(testRequest);
      return true;
    } catch (error) {
      console.error('AI translation service unavailable:', error);
      return false;
    }
  }
}

// 默认翻译器实例
export const aiTranslator = new AITranslator();