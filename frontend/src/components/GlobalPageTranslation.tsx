import React, { useState, useEffect } from 'react';
import pageTranslationService from '@/services/pageTranslationService';

/**
 * 全局页面翻译组件
 * 在每个页面都显示翻译工具
 */
export const GlobalPageTranslation: React.FC = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [showTranslationPanel, setShowTranslationPanel] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('zh');

  useEffect(() => {
    // 页面加载和路由变化时扫描元素
    const scanAndSetup = () => {
      setTimeout(() => {
        pageTranslationService.scanPage();
        setIsTranslated(pageTranslationService.getTranslationStatus());
      }, 1000);
    };

    // 初始扫描
    scanAndSetup();

    // 监听路由变化
    const handleRouteChange = () => {
      scanAndSetup();
    };

    window.addEventListener('popstate', handleRouteChange);

    // 监听pushstate/replacestate (SPA路由变化)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleRouteChange, 100);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleRouteChange, 100);
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  const handleTranslate = async () => {
    setIsTranslating(true);
    pageTranslationService.setTargetLanguage(targetLanguage);

    try {
      await pageTranslationService.translateAll();
      setIsTranslated(pageTranslationService.getTranslationStatus());
      showNotification('页面翻译完成', 'success');
    } catch (error) {
      console.error('页面翻译失败:', error);
      showNotification('翻译失败，请重试', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRestore = () => {
    pageTranslationService.restoreAll();
    setIsTranslated(false);
    showNotification('已恢复原文', 'info');
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const colors = {
      success: '#38a169',
      error: '#e53e3e',
      info: '#3182ce',
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${colors[type]};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 2000);
  };

  const styles = {
    floatingButton: {
      position: 'fixed' as const,
      bottom: '20px',
      right: '20px',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: isTranslated ? '#38a169' : '#3182ce',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 999,
      transition: 'all 0.3s ease',
    },
    panel: {
      position: 'fixed' as const,
      bottom: '90px',
      right: '20px',
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      padding: '16px',
      minWidth: '280px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      zIndex: 1000,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    title: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1a202c',
      margin: 0,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#718096',
      padding: '0',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    select: {
      width: '100%',
      padding: '10px',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      fontSize: '14px',
      marginBottom: '12px',
      backgroundColor: '#f7fafc',
    },
    button: {
      width: '100%',
      padding: '10px 16px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      marginBottom: '8px',
    },
    primaryButton: {
      backgroundColor: '#3182ce',
      color: 'white',
    },
    successButton: {
      backgroundColor: '#38a169',
      color: 'white',
    },
    secondaryButton: {
      backgroundColor: '#e2e8f0',
      color: '#2d3748',
    },
    status: {
      fontSize: '12px',
      color: '#718096',
      marginTop: '12px',
      paddingTop: '12px',
      borderTop: '1px solid #e2e8f0',
    },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: '600',
      color: '#4a5568',
      marginBottom: '4px',
    },
  };

  const supportedLanguages = {
    'en': 'English',
    'zh': '中文',
    'ja': '日本語',
    'ko': '한국어',
    'fr': 'Français',
    'de': 'Deutsch',
    'es': 'Español',
  };

  return (
    <>
      {/* 浮动按钮 */}
      <button
        style={styles.floatingButton}
        onClick={() => setShowTranslationPanel(!showTranslationPanel)}
        title={isTranslated ? '点击恢复原文' : '点击翻译页面'}
      >
        {isTranslated ? '🔄' : '🌐'}
      </button>

      {/* 翻译面板 */}
      {showTranslationPanel && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <h3 style={styles.title}>页面翻译</h3>
            <button
              style={styles.closeButton}
              onClick={() => setShowTranslationPanel(false)}
            >
              ×
            </button>
          </div>

          <div>
            <label style={styles.label}>目标语言:</label>
            <select
              style={styles.select}
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={isTranslating}
            >
              {Object.entries(supportedLanguages).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {!isTranslated ? (
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handleTranslate}
              disabled={isTranslating}
            >
              {isTranslating ? '翻译中...' : '翻译当前页面'}
            </button>
          ) : (
            <button
              style={{ ...styles.button, ...styles.successButton }}
              onClick={handleRestore}
              disabled={isTranslating}
            >
              恢复原文
            </button>
          )}

          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={() => {
              pageTranslationService.scanPage();
              showNotification('页面元素已重新扫描', 'info');
            }}
            disabled={isTranslating}
          >
            重新扫描页面
          </button>

          <div style={styles.status}>
            <div>状态: {isTranslated ? '✅ 已翻译' : '⏸️ 未翻译'}</div>
            <div>可翻译元素: {pageTranslationService['elements']?.size || 0} 个</div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalPageTranslation;