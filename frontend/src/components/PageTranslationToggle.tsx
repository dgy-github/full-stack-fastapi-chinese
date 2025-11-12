import React, { useState, useEffect } from 'react';
import pageTranslationService from '@/services/pageTranslationService';

interface PageTranslationToggleProps {
  className?: string;
}

export const PageTranslationToggle: React.FC<PageTranslationToggleProps> = ({ className }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('zh');
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    // 页面加载时扫描可翻译元素
    const timer = setTimeout(() => {
      pageTranslationService.scanPage();
    }, 1000); // 延迟1秒确保页面完全渲染

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 监听路由变化，重新扫描页面
    const handleRouteChange = () => {
      setTimeout(() => {
        pageTranslationService.scanPage();
        setIsTranslated(pageTranslationService.getTranslationStatus());
      }, 500);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const handleTranslate = async () => {
    setIsTranslating(true);
    pageTranslationService.setTargetLanguage(targetLanguage);

    try {
      await pageTranslationService.translateAll();
      setIsTranslated(pageTranslationService.getTranslationStatus());
    } catch (error) {
      console.error('页面翻译失败:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRestore = () => {
    pageTranslationService.restoreAll();
    setIsTranslated(false);
  };

  const handleRescan = () => {
    pageTranslationService.scanPage();
    // 简单的提示
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 14px;
    `;
    toast.textContent = `扫描完成，找到 ${pageTranslationService['elements'].size} 个可翻译元素`;
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const supportedLanguages = pageTranslationService.getSupportedLanguages();

  const styles = {
    container: {
      position: 'fixed' as const,
      top: '80px', // 避免与可能的导航栏冲突
      right: '20px',
      zIndex: 1000,
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '16px',
      minWidth: '250px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxHeight: '80vh',
      overflowY: 'auto' as const,
    },
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      width: '100%',
      marginBottom: '8px',
    },
    primaryButton: {
      backgroundColor: '#3182ce',
      color: 'white',
    },
    secondaryButton: {
      backgroundColor: '#e2e8f0',
      color: '#2d3748',
    },
    successButton: {
      backgroundColor: '#38a169',
      color: 'white',
    },
    select: {
      width: '100%',
      padding: '8px',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      fontSize: '14px',
      marginBottom: '8px',
    },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: '600',
      color: '#4a5568',
      marginBottom: '4px',
    },
    title: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '12px',
      color: '#1a202c',
    },
    toggleButton: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      backgroundColor: '#3182ce',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      zIndex: 999,
    },
  };

  if (!showControls) {
    return (
      <button
        style={styles.toggleButton}
        onClick={() => setShowControls(true)}
        title="页面翻译工具"
      >
        🌐
      </button>
    );
  }

  return (
    <div style={styles.container} className={className}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={styles.title}>页面翻译</h3>
        <button
          onClick={() => setShowControls(false)}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: '#718096',
          }}
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
          {isTranslating ? '翻译中...' : '翻译页面'}
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
        onClick={handleRescan}
        disabled={isTranslating}
      >
        重新扫描
      </button>

      <div style={{ marginTop: '12px', fontSize: '12px', color: '#718096' }}>
        <div>状态: {isTranslated ? '已翻译' : '未翻译'}</div>
        <div>元素数: {pageTranslationService['elements']?.size || 0}</div>
      </div>
    </div>
  );
};

export default PageTranslationToggle;