// 从React组件中提取可翻译文本的工具函数

export interface ExtractedText {
  key: string;
  text: string;
  context?: string;
  type: 'menu' | 'button' | 'label' | 'placeholder' | 'title' | 'content';
}

// 从React组件中提取可翻译文本的工具函数

/**
 * 从对象中提取所有可翻译的文本
 */
export const extractTranslatableTexts = (
  obj: any,
  prefix = '',
  context?: string
): ExtractedText[] => {
  const texts: ExtractedText[] = [];

  if (!obj || typeof obj !== 'object') {
    return texts;
  }

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string' && value.trim()) {
      // 判断文本类型
      let type: ExtractedText['type'] = 'content';

      if (key.includes('title') || key.includes('heading')) {
        type = 'title';
      } else if (key.includes('label') || key.includes('name')) {
        type = 'label';
      } else if (key.includes('button') || key.includes('btn')) {
        type = 'button';
      } else if (key.includes('placeholder')) {
        type = 'placeholder';
      } else if (key.includes('menu') || key.includes('nav')) {
        type = 'menu';
      }

      texts.push({
        key: fullKey,
        text: value,
        context: context || fullKey,
        type,
      });
    } else if (typeof value === 'object' && value !== null) {
      // 递归处理嵌套对象
      const nestedTexts = extractTranslatableTexts(value, fullKey, context);
      texts.push(...nestedTexts);
    }
  }

  return texts;
};

/**
 * 从菜单配置中提取文本
 */
export const extractMenuTexts = (menuConfig: any[]): ExtractedText[] => {
  const texts: ExtractedText[] = [];

  const extractFromMenuItem = (item: any, path = ''): void => {
    if (!item) return;

    // 提取菜单项标题
    if (item.title && typeof item.title === 'string') {
      texts.push({
        key: path ? `${path}.title` : 'title',
        text: item.title,
        context: 'menu',
        type: 'menu',
      });
    }

    // 提取描述文本
    if (item.description && typeof item.description === 'string') {
      texts.push({
        key: path ? `${path}.description` : 'description',
        text: item.description,
        context: 'menu_description',
        type: 'content',
      });
    }

    // 递归处理子菜单
    if (item.items && Array.isArray(item.items)) {
      item.items.forEach((subItem: any, index: number) => {
        extractFromMenuItem(subItem, path ? `${path}.items[${index}]` : `items[${index}]`);
      });
    }
  };

  if (Array.isArray(menuConfig)) {
    menuConfig.forEach((item, index) => {
      extractFromMenuItem(item, `menu[${index}]`);
    });
  }

  return texts;
};

/**
 * 从翻译键值对中提取文本
 */
export const extractI18nTexts = (i18nData: Record<string, any>): ExtractedText[] => {
  return extractTranslatableTexts(i18nData, '', 'i18n');
};

/**
 * 过滤需要翻译的文本
 */
export const filterTextsForTranslation = (
  texts: ExtractedText[],
  _currentLanguage: string,
  _targetLanguage: string
): ExtractedText[] => {
  // 过滤掉已经是目标语言的文本
  // 过滤掉太短或太长的文本
  // 过滤掉纯数字、URL、邮箱等
  return texts.filter(item => {
    const text = item.text.trim();

    // 长度检查
    if (text.length < 2 || text.length > 200) {
      return false;
    }

    // 跳过数字和特殊格式
    if (/^\d+$/.test(text) || // 纯数字
        /^https?:\/\//.test(text) || // URL
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) || // 邮箱
        /^[{}()[\]<>"`']+$/.test(text)) { // 纯特殊字符
      return false;
    }

    // 跳过看起来已经是目标语言的文本（简单启发式）
    // 这里可以根据具体语言实现更复杂的检测

    return true;
  });
};

/**
 * 生成翻译缓存键
 */
export const generateTranslationKey = (text: string, from: string, to: string): string => {
  return `${from}-${to}-${text.toLowerCase().replace(/\s+/g, '_').substring(0, 50)}`;
};

/**
 * 清理和标准化文本
 */
export const normalizeText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\t+/g, ' ');
};

/**
 * 检测文本语言（简单启发式）
 */
export const detectLanguage = (text: string): string => {
  // 简单的语言检测逻辑
  // 实际项目中可以使用更复杂的库或API

  // 检测中文
  if (/[\u4e00-\u9fff]/.test(text)) {
    return 'zh';
  }

  // 检测日文
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
    return 'ja';
  }

  // 检测韩文
  if (/[\uac00-\ud7af]/.test(text)) {
    return 'ko';
  }

  // 检测阿拉伯文
  if (/[\u0600-\u06ff]/.test(text)) {
    return 'ar';
  }

  // 检测俄文
  if (/[\u0400-\u04ff]/.test(text)) {
    return 'ru';
  }

  // 默认假设为英文
  return 'en';
};

/**
 * 分割长文本为适合翻译的块
 */
export const splitTextForTranslation = (text: string, maxLength = 500): string[] => {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/[.!?。！？]+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (currentChunk.length + trimmedSentence.length + 1 <= maxLength) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};