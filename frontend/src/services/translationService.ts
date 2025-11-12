/**
 * Translation API service
 * Uses backend DeepSeek API for translation
 */

interface TranslationRequest {
  text: string;
  source_language?: string;
  target_language: string;
  context?: string;
}

interface TranslationResponse {
  translated_text: string;
  source_language: string;
  target_language: string;
  model: string;
}

interface HealthResponse {
  status: string;
  deepseek_configured: boolean;
}

class TranslationService {
  private baseUrl: string;

  constructor() {
    // 使用与OpenAPI相同的基础URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.baseUrl = `${apiUrl}/api/v1/langchain`;
  }

  /**
   * 检查DeepSeek服务配置状态
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText} (${response.status})`);
      }

      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.includes('<!DOCTYPE')) {
          throw new Error('API返回了HTML页面，可能API路径不正确或服务未启动');
        }
        throw new Error(`API返回了非JSON响应: ${contentType}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到翻译服务，请检查后端服务是否正在运行');
      }
      throw error;
    }
  }

  /**
   * 翻译文本
   */
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const response = await fetch(`${this.baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      // 尝试解析JSON错误，如果失败则使用状态文本
      let errorMessage = `Translation failed: ${response.statusText} (${response.status})`;

      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } else {
          // 如果不是JSON，可能是HTML错误页面
          const text = await response.text();
          if (text.includes('<!DOCTYPE')) {
            errorMessage = `API返回了HTML页面而不是JSON，请检查API路径是否正确 (${response.status})`;
          } else {
            errorMessage = text || errorMessage;
          }
        }
      } catch (parseError) {
        // JSON解析失败，使用默认错误信息
        console.warn('Failed to parse error response:', parseError);
      }

      throw new Error(errorMessage);
    }

    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (text.includes('<!DOCTYPE')) {
        throw new Error('API返回了HTML页面而不是JSON，请检查API路径是否正确');
      }
      throw new Error(`API返回了非JSON响应: ${contentType}`);
    }

    return response.json();
  }
}

// 单例实例
const translationService = new TranslationService();

export default translationService;
export type { TranslationRequest, TranslationResponse, HealthResponse };