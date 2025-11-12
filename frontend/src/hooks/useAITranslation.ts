import { useEffect } from 'react';

/**
 * AI翻译状态管理Hook
 * 处理页面刷新后的AI翻译状态恢复
 */
export const useAITranslation = () => {

  useEffect(() => {
    // 页面加载时检查是否有AI翻译状态
    const aiLanguage = localStorage.getItem('ai_language');

    if (aiLanguage) {
      // 延迟执行，确保页面完全渲染
      setTimeout(() => {
        restoreAITranslationState();
      }, 1000);
    }
  }, []);

  const restoreAITranslationState = () => {
    // 检查页面是否有被翻译的元素
    const translatedElements = document.querySelectorAll('[data-ai-translated="true"]');

    if (translatedElements.length === 0) {
      // 如果没有找到翻译元素，清除AI翻译状态
      localStorage.removeItem('ai_language');
      return;
    }

    // 添加恢复按钮
    addRestoreButton();
  };

  const addRestoreButton = () => {
    // 安全移除已存在的恢复按钮
    const existingButton = document.getElementById('ai-restore-button');
    if (existingButton) {
      // 方法1: 使用 parentNode 安全移除
      if (existingButton.parentNode) {
        try {
          existingButton.parentNode.removeChild(existingButton);
        } catch (error) {
          console.warn('Failed to remove restore button via parentNode:', error);
        }
      }

      // 方法2: 直接从 body 移除
      try {
        if (document.body.contains(existingButton)) {
          document.body.removeChild(existingButton);
        }
      } catch (error) {
        console.warn('Failed to remove restore button via body:', error);
      }

      // 方法3: 隐藏元素作为最后手段
      existingButton.style.display = 'none';
      return;
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
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      z-index: 1000;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    `;

    restoreButton.onclick = () => {
      restoreOriginalText();
    };

    restoreButton.onmouseover = () => {
      restoreButton.style.background = '#c53030';
    };

    restoreButton.onmouseout = () => {
      restoreButton.style.background = '#e53e3e';
    };

    document.body.appendChild(restoreButton);
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

    // 安全移除恢复按钮
    const restoreButton = document.getElementById('ai-restore-button');
    if (restoreButton) {
      // 方法1: 使用 parentNode 安全移除
      if (restoreButton.parentNode) {
        try {
          restoreButton.parentNode.removeChild(restoreButton);
        } catch (error) {
          console.warn('Failed to remove restore button via parentNode:', error);
        }
      }

      // 方法2: 直接从 body 移除
      try {
        if (document.body.contains(restoreButton)) {
          document.body.removeChild(restoreButton);
        }
      } catch (error) {
        console.warn('Failed to remove restore button via body:', error);
      }

      // 方法3: 隐藏元素作为最后手段
      restoreButton.style.display = 'none';
    }

    // 清除AI翻译状态
    localStorage.removeItem('ai_language');

    if (restoredCount > 0) {
      console.log(`已恢复 ${restoredCount} 个文本`);
    }
  };

  return {
    restoreAITranslationState,
    addRestoreButton,
    restoreOriginalText,
  };
};

export default useAITranslation;