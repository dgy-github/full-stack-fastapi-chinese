import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next"
import translationService from '@/services/translationService';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isI18n: boolean;
}

/**
 * 原生HTML版本的AI语言切换器
 * 完全避免Chakra UI的导入问题
 */
const NativeAILanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // 支持的语言列表
  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isI18n: true },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', isI18n: true },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', isI18n: false },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', isI18n: false },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', isI18n: false },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isI18n: false },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isI18n: false },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', isI18n: false },
  ];

  useEffect(() => {
    const aiLang = localStorage.getItem('ai_language');
    if (aiLang) {
          } else {
          }

    // 点击外部关闭菜单
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-switcher')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [i18n.language]);

  // 简单的toast通知
  const showToast = (title: string, description: string, type: 'info' | 'success' | 'error' = 'info') => {
    const colors = {
      info: { bg: '#3182ce', border: '#2c5aa0' },
      success: { bg: '#38a169', border: '#2f855a' },
      error: { bg: '#e53e3e', border: '#c53030' },
    };

    const toast = document.createElement('div');
    toast.className = 'ai-toast-notification';
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: ${colors[type].bg};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      border: 2px solid ${colors[type].border};
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      max-width: 450px;
      text-align: center;
      backdrop-filter: blur(8px);
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
      animation: slideInUp 0.3s ease-out;
    `;

    toast.innerHTML = `
      <div style="margin-bottom: 4px; font-size: 16px; font-weight: 600;">${title}</div>
      <div style="font-size: 13px; opacity: 0.9;">${description}</div>
    `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInUp {
        from {
          transform: translate(-50%, 100px);
          opacity: 0;
        }
        to {
          transform: translate(-50%, 0);
          opacity: 1;
        }
      }
      @keyframes slideOutDown {
        from {
          transform: translate(-50%, 0);
          opacity: 1;
        }
        to {
          transform: translate(-50%, 100px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutDown 0.3s ease-in forwards';
      setTimeout(() => {
        // 安全移除节点
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 300);
    }, 3000);
  };

  const getCurrentLangDisplay = () => {
    const aiLang = localStorage.getItem('ai_language');
    if (aiLang) {
      const lang = languages.find(l => l.code === aiLang);
      return lang ? lang : languages[0];
    }
    return languages.find(l => l.code === i18n.language) || languages[0];
  };

  const handleLanguageChange = (languageCode: string) => {
    const language = languages.find(lang => lang.code === languageCode);
    if (!language) return;

    if (language.isI18n) {
      // 使用i18n切换
      i18n.changeLanguage(languageCode);
      localStorage.setItem('language', languageCode);
      localStorage.removeItem('ai_language');
      restoreOriginalText();
          } else {
      // 使用AI翻译
      handleAITranslation(languageCode);
    }
    setShowMenu(false);
  };

  const handleAITranslation = async (targetLanguage: string) => {
    setIsTranslating(true);

    try {
      showToast("开始AI翻译", `正在翻译页面内容...`, 'info');

      // 收集页面可翻译的文本 - 更全面的选择器
      const elements = document.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, ' +
        'button:not(:has(svg)), ' +
        'a:not(:has(svg)), ' +
        'p, span, div, ' +
        '.chakra-menu__menuitem, ' +
        '[role="menuitem"], ' +
        '[role="button"], ' +
        'label, ' +
        '.text, .title, .label, ' +
        'th, td, ' +
        'li:not(:has(svg)), ' +
        '.sidebar-item, .nav-item, .menu-item'
      );

      const translatableElements: HTMLElement[] = [];

      elements.forEach(node => {
        const element = node as HTMLElement;
        const text = element.textContent?.trim();

        // 扩展过滤条件，包含更多有用的文本
        if (text &&
            text.length > 1 &&  // 至少2个字符
            text.length < 200 && // 不超过200个字符
            !element.querySelector('svg, img, input, textarea, select') && // 排除表单元素
            !element.dataset.originalText &&
            !isSkipElement(element) &&
            !containsOnlySymbols(text)) { // 排除纯符号
          translatableElements.push(element);
        }
      });

      // 按优先级排序：导航栏、标题、按钮等更重要
      translatableElements.sort((a, b) => {
        const getPriority = (element: HTMLElement) => {
          const tagName = element.tagName.toLowerCase();
          const className = element.className;

          // 导航栏和菜单优先级最高
          if (className.includes('nav') || className.includes('menu') ||
              element.closest('nav') || element.closest('[role="navigation"]')) return 1;

          // 标题优先级高
          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) return 2;

          // 按钮优先级中等
          if (tagName === 'button' || element.getAttribute('role') === 'button') return 3;

          // 其他文本优先级低
          return 4;
        };

        return getPriority(a) - getPriority(b);
      });

      // 去重并增加数量限制
      const uniqueTexts = new Map();
      const finalElements = translatableElements.filter(element => {
        const text = element.textContent?.trim();
        if (text && !uniqueTexts.has(text.toLowerCase())) {
          uniqueTexts.set(text.toLowerCase(), element);
          return true;
        }
        return false;
      }).slice(0, 25); // 增加到25个元素

      if (finalElements.length === 0) {
        showToast("没有可翻译的内容", "当前页面没有发现适合翻译的文本", 'info');
        return;
      }

      // 翻译元素 - 使用批量处理
      let translatedCount = 0;
      const batchSize = 5;

      for (let i = 0; i < finalElements.length; i += batchSize) {
        const batch = finalElements.slice(i, i + batchSize);

        await Promise.all(batch.map(async (element) => {
          const text = element.textContent?.trim();
          if (!text) return;

          try {
            const result = await translationService.translate({
              text,
              source_language: 'auto',
              target_language: targetLanguage,
              context: getTranslationContext(element),
            });

            // 保存原文
            if (!element.dataset.originalText) {
              element.dataset.originalText = text;
            }

            // 应用翻译
            element.textContent = result.translated_text;
            element.dataset.aiTranslated = 'true';
            translatedCount++;
          } catch (error) {
            console.warn(`翻译失败: ${text}`, error);
          }
        }));
      }

      if (translatedCount > 0) {
        // 保存AI翻译状态
        localStorage.setItem('ai_language', targetLanguage);
        
        // 添加恢复按钮
        addRestoreButton();

        const targetLangName = languages.find(l => l.code === targetLanguage)?.nativeName;
        showToast("AI翻译完成", `已翻译 ${translatedCount} 个文本为 ${targetLangName}`, 'success');
      }
    } catch (error) {
      console.error('AI翻译失败:', error);
      showToast("翻译失败", error instanceof Error ? error.message : "翻译服务异常", 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  // 获取翻译上下文
  const getTranslationContext = (element: HTMLElement): string => {
    const tagName = element.tagName.toLowerCase();
    const className = element.className;

    // 根据元素类型提供上下文
    if (tagName === 'h1' || tagName === 'h2') return 'page heading';
    if (['h3', 'h4', 'h5', 'h6'].includes(tagName)) return 'section heading';
    if (tagName === 'button' || element.getAttribute('role') === 'button') return 'button text';
    if (element.closest('nav')) return 'navigation menu';
    if (className.includes('menu') || element.closest('[role="menu"]')) return 'menu item';
    if (className.includes('sidebar')) return 'sidebar navigation';
    if (tagName === 'a') return 'link text';
    if (className.includes('title')) return 'title or label';

    return 'web interface content';
  };

  // 检查是否只包含符号
  const containsOnlySymbols = (text: string): boolean => {
    // 移除常见的标点符号后检查是否还有字符
    const cleaned = text.replace(/[.,!?;:'"()\[\]{}<>/\\|_-\s\n\r\t]/g, '');
    return cleaned.length === 0;
  };

  const isSkipElement = (element: HTMLElement): boolean => {
    const text = element.textContent || '';

    // 跳过过短的文本
    if (text.length < 2) return true;

    // 跳过纯数字、日期、时间等
    if (/^\d+$/.test(text) || /^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{1,2}:\d{2}$/.test(text)) {
      return true;
    }

    // 跳过包含大量特殊字符的文本
    const specialCharCount = (text.match(/[0-9@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    if (specialCharCount > text.length * 0.3) {
      return true;
    }

    // 跳过常见的代码、ID等技术文本
    if (/^[a-zA-Z0-9_-]+$/.test(text) && text.length < 10) {
      return true;
    }

    // 跳过URL
    if (/^https?:\/\//.test(text)) {
      return true;
    }

    return false;
  };

  const restoreOriginalText = () => {
    const translatedElements = document.querySelectorAll('[data-original-text]');
    let restoredCount = 0;

    translatedElements.forEach(element => {
      const originalText = element.getAttribute('data-original-text');
      if (originalText) {
        element.textContent = originalText;
        element.removeAttribute('data-original-text');
        element.removeAttribute('data-ai-translated');
        restoredCount++;
      }
    });

    // 清除AI翻译状态
    localStorage.removeItem('ai_language');
    
    // 延迟移除恢复按钮，确保DOM更新完成
    setTimeout(() => {
      const restoreButton = document.getElementById('ai-restore-button');
      if (restoreButton) {
        try {
          // 方法1: 尝试使用removeChild
          if (restoreButton.parentNode) {
            restoreButton.parentNode.removeChild(restoreButton);
          } else {
            // 方法2: 尝试使用remove
            restoreButton.remove();
          }
        } catch (error) {
          // 方法3: 如果都失败了，隐藏元素
          console.warn('无法移除恢复按钮:', error);
          restoreButton.style.display = 'none';
        }
      }
    }, 100);

    if (restoredCount > 0) {
      showToast("已恢复原文", `恢复了 ${restoredCount} 个文本`, 'info');
    }
  };

  const addRestoreButton = () => {
    // 安全移除已存在的恢复按钮
    const existingButton = document.getElementById('ai-restore-button');
    if (existingButton) {
      try {
        if (existingButton.parentNode) {
          existingButton.parentNode.removeChild(existingButton);
        } else {
          existingButton.remove();
        }
      } catch (error) {
        console.warn('移除恢复按钮时出错:', error);
        if (existingButton) {
          existingButton.style.display = 'none';
        }
      }
    }

    // 创建恢复按钮
    const restoreButton = document.createElement('button');
    restoreButton.id = 'ai-restore-button';
    restoreButton.innerHTML = '↩️ 恢复原文';
    restoreButton.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #e53e3e;
      color: white;
      border: 2px solid #c53030;
      padding: 12px 18px;
      border-radius: 10px;
      cursor: pointer;
      z-index: 1000;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 6px 12px rgba(229, 62, 62, 0.3);
      transition: all 0.2s;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      backdropFilter: blur(4px);
    `;

    // 使用更安全的事件绑定
    const clickHandler = (event: Event) => {
      event.preventDefault();
      restoreOriginalText();
    };

    restoreButton.addEventListener('click', clickHandler);

    // hover效果
    restoreButton.onmouseover = () => {
      restoreButton.style.background = '#c53030';
      restoreButton.style.borderColor = '#9c2c2c';
      restoreButton.style.transform = 'translateY(-2px)';
      restoreButton.style.boxShadow = '0 8px 16px rgba(229, 62, 62, 0.4)';
    };
    restoreButton.onmouseout = () => {
      restoreButton.style.background = '#e53e3e';
      restoreButton.style.borderColor = '#c53030';
      restoreButton.style.transform = 'translateY(0)';
      restoreButton.style.boxShadow = '0 6px 12px rgba(229, 62, 62, 0.3)';
    };

    // 安全添加到DOM
    document.body.appendChild(restoreButton);

    // 保存按钮引用，以便后续清理
    (window as any).aiRestoreButton = restoreButton;
  };

  const currentLang = getCurrentLangDisplay();

  return (
    <div className="language-switcher" style={{ position: 'relative', display: 'inline-block' }}>
      {/* 主语言切换按钮 */}
      <button
        style={{
          padding: '6px 12px',
          border: '2px solid #3182ce',
          background: '#ffffff',
          color: '#1a202c',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(49, 130, 206, 0.2)',
        }}
        onClick={() => setShowMenu(!showMenu)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ebf8ff';
          e.currentTarget.style.borderColor = '#2c5aa0';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(49, 130, 206, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.borderColor = '#3182ce';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(49, 130, 206, 0.2)';
        }}
        title="切换语言"
      >
        <span>{currentLang.flag}</span>
        <span>
          {currentLang.isI18n ?
            (i18n.language === "zh" ? "EN" : "中文") :
            currentLang.nativeName
          }
        </span>
        <span style={{ fontSize: '12px' }}>▼</span>
      </button>

      {/* 语言选择菜单 */}
      {showMenu && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            right: '20px',
            background: '#ffffff',
            border: '2px solid #3182ce',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            minWidth: '220px',
            padding: '8px',
            zIndex: 1000,
          }}
        >
          {/* i18n 支持的语言 */}
          <div style={{
            padding: '10px 14px',
            fontSize: '13px',
            color: '#1a202c',
            fontWeight: '700',
            borderBottom: '2px solid #ebf8ff',
            marginBottom: '4px',
            background: '#ebf8ff',
            borderRadius: '6px'
          }}>
            🎯 正式支持
          </div>
          {languages.filter(lang => lang.isI18n).map(language => (
            <div
              key={language.code}
              style={{
                padding: '12px 14px',
                cursor: 'pointer',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1a202c',
                transition: 'all 0.2s',
              }}
              onClick={() => handleLanguageChange(language.code)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ebf8ff';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <span style={{ fontSize: '18px' }}>{language.flag}</span>
              <span style={{ flex: 1 }}>{language.nativeName}</span>
              {i18n.language === language.code && !localStorage.getItem('ai_language') && (
                <span style={{
                  color: '#38a169',
                  fontSize: '14px',
                  fontWeight: '700',
                  background: '#f0fff4',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>✓</span>
              )}
            </div>
          ))}

          {/* AI 翻译支持的语言 */}
          <div style={{
            padding: '10px 14px',
            fontSize: '13px',
            color: '#1a202c',
            fontWeight: '700',
            borderBottom: '2px solid #ebf8ff',
            marginBottom: '4px',
            marginTop: '8px',
            background: '#ebf8ff',
            borderRadius: '6px'
          }}>
            🤖 AI翻译
          </div>
          {languages.filter(lang => !lang.isI18n).map(language => (
            <div
              key={language.code}
              style={{
                padding: '12px 14px',
                cursor: 'pointer',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1a202c',
                transition: 'all 0.2s',
              }}
              onClick={() => handleLanguageChange(language.code)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ebf8ff';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <span style={{ fontSize: '18px' }}>{language.flag}</span>
              <span style={{ flex: 1 }}>{language.nativeName}</span>
              {localStorage.getItem('ai_language') === language.code && (
                <span style={{
                  color: '#3182ce',
                  fontSize: '14px',
                  fontWeight: '700',
                  background: '#ebf8ff',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>🤖</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 加载状态覆盖层 */}
      {isTranslating && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
              minWidth: '250px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              AI翻译中...
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              正在翻译页面内容
            </div>
            <div style={{
              width: '50px',
              height: '4px',
              background: '#e2e8f0',
              borderRadius: '2px',
              margin: '20px auto 0',
              overflow: 'hidden',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: '#3182ce',
                borderRadius: '2px',
                animation: 'loading 1.5s ease-in-out infinite',
              }}></div>
            </div>
            <style>{`
              @keyframes loading {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(0); }
                100% { transform: translateX(100%); }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};

export default NativeAILanguageSwitcher;