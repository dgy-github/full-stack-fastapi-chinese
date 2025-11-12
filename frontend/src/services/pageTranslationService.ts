/**
 * 页面翻译服务
 * 用于翻译页面上的菜单、按钮等文字元素
 */

import translationService from './translationService';

interface PageElement {
  element: HTMLElement;
  originalText: string;
  translatedText?: string;
  selector: string;
}

interface TranslationCache {
  [key: string]: string;
}

class PageTranslationService {
  private elements: Map<string, PageElement> = new Map();
  private cache: TranslationCache = {};
  private isTranslated = false;
  private targetLanguage = 'zh';

  /**
   * 扫描页面上的可翻译元素
   */
  scanPage(): void {
    // 清空之前的扫描结果
    this.elements.clear();

    // 定义要翻译的元素选择器
    const selectors = [
      'button:not(:has(svg))', // 按钮（不包含SVG图标的）
      '.chakra-menu__menuitem', // Chakra UI 菜单项
      '[role="menuitem"]', // 菜单项
      '.chakra-button', // Chakra UI 按钮
      'a[role="menuitem"]', // 菜单链接
      '.sidebar-item-text', // 侧边栏文字
      'nav a', // 导航链接
      'h1, h2, h3, h4, h5, h6', // 标题
      '.form-label', // 表单标签
      '.input-label', // 输入标签
      '[data-translate]', // 自定义翻译属性
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        const text = this.getElementText(element as HTMLElement);
        if (text && text.trim() && !this.shouldSkipElement(element as HTMLElement)) {
          const uniqueKey = `${selector}-${index}-${text.substring(0, 20)}`;
          this.elements.set(uniqueKey, {
            element: element as HTMLElement,
            originalText: text,
            selector,
          });
        }
      });
    });

    console.log(`扫描到 ${this.elements.size} 个可翻译元素`);
  }

  /**
   * 获取元素的文本内容
   */
  private getElementText(element: HTMLElement): string {
    // 获取直接的文本内容，排除子元素的文本
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 只接受直接子文本节点
          return node.parentNode === element ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let text = '';
    let node;
    while (node = walker.nextNode()) {
      text += node.textContent || '';
    }

    // 如果没有直接文本节点，尝试获取整个元素的文本
    if (!text.trim()) {
      text = element.textContent || '';
    }

    return text.trim();
  }

  /**
   * 判断是否应该跳过翻译
   */
  private shouldSkipElement(element: HTMLElement): boolean {
    // 跳过图标元素
    if (element.tagName === 'svg' || element.querySelector('svg')) {
      return true;
    }

    // 跳过input元素的值
    if (element.tagName === 'input' || element.tagName === 'textarea') {
      return true;
    }

    // 跳过包含特殊字符的文本
    const text = this.getElementText(element);
    if (text.match(/[0-9@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/) && text.length < 10) {
      return true;
    }

    // 跳过已翻译过的元素
    if (element.dataset.translated === 'true') {
      return true;
    }

    return false;
  }

  /**
   * 设置目标语言
   */
  setTargetLanguage(language: string): void {
    this.targetLanguage = language;
  }

  /**
   * 翻译所有扫描到的元素
   */
  async translateAll(): Promise<void> {
    if (this.isTranslated) {
      this.restoreAll();
      return;
    }

    const elementsToTranslate = Array.from(this.elements.values());

    // 显示加载状态
    this.showLoadingState(true);

    try {
      // 批量翻译
      const batchSize = 5; // 每批翻译5个元素
      for (let i = 0; i < elementsToTranslate.length; i += batchSize) {
        const batch = elementsToTranslate.slice(i, i + batchSize);
        await this.translateBatch(batch);
      }

      this.isTranslated = true;
    } catch (error) {
      console.error('页面翻译失败:', error);
    } finally {
      this.showLoadingState(false);
    }
  }

  /**
   * 批量翻译元素
   */
  private async translateBatch(elements: PageElement[]): Promise<void> {
    const translationPromises = elements.map(async (pageElement) => {
      const { originalText } = pageElement;

      // 检查缓存
      const cacheKey = `${originalText}-${this.targetLanguage}`;
      if (this.cache[cacheKey]) {
        pageElement.translatedText = this.cache[cacheKey];
        return;
      }

      try {
        const result = await translationService.translate({
          text: originalText,
          source_language: 'auto',
          target_language: this.targetLanguage,
          context: 'web interface, buttons, menus, navigation',
        });

        pageElement.translatedText = result.translated_text;
        this.cache[cacheKey] = result.translated_text;
      } catch (error) {
        console.warn(`翻译失败: "${originalText}"`, error);
        // 翻译失败时保留原文
        pageElement.translatedText = originalText;
      }
    });

    await Promise.all(translationPromises);

    // 应用翻译
    elements.forEach(pageElement => {
      if (pageElement.translatedText) {
        this.applyTranslation(pageElement);
      }
    });
  }

  /**
   * 应用翻译到元素
   */
  private applyTranslation(pageElement: PageElement): void {
    const { element, translatedText } = pageElement;

    if (translatedText) {
      // 保存原始文本
      if (!element.dataset.originalText) {
        element.dataset.originalText = pageElement.originalText;
      }

      // 应用翻译
      this.setElementText(element, translatedText);
      element.dataset.translated = 'true';
    }
  }

  /**
   * 设置元素文本
   */
  private setElementText(element: HTMLElement, text: string): void {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.parentNode === element ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    if (textNodes.length > 0) {
      // 替换第一个直接文本节点
      textNodes[0].textContent = text;
    } else {
      // 如果没有直接文本节点，替换整个元素的文本
      element.textContent = text;
    }
  }

  /**
   * 恢复所有翻译
   */
  restoreAll(): void {
    this.elements.forEach((pageElement) => {
      const { element } = pageElement;
      const originalText = element.dataset.originalText;

      if (originalText) {
        this.setElementText(element, originalText);
        delete element.dataset.translated;
      }
    });

    this.isTranslated = false;
  }

  /**
   * 显示加载状态
   */
  private showLoadingState(show: boolean): void {
    // 可以添加加载提示
    if (show) {
      console.log('正在翻译页面...');
    } else {
      console.log('翻译完成');
    }
  }

  /**
   * 获取当前翻译状态
   */
  getTranslationStatus(): boolean {
    return this.isTranslated;
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): Record<string, string> {
    return {
      'en': 'English',
      'zh': '中文',
      'ja': '日本語',
      'ko': '한국어',
      'fr': 'Français',
      'de': 'Deutsch',
      'es': 'Español',
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = {};
  }
}

// 单例实例
const pageTranslationService = new PageTranslationService();

export default pageTranslationService;