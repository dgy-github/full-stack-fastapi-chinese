import React, { useState } from 'react';
import { AITranslator } from '@/ai-translation';
import { SUPPORTED_LANGUAGES } from '@/ai-translation';

export const BasicAITranslationDemo: React.FC = () => {
  const [sourceText, setSourceText] = useState('Hello, welcome to our application!');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('zh');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  // 创建翻译器实例
  const translator = new AITranslator();

  // 配置AI服务
  const handleConfigure = () => {
    if (!apiKey.trim()) {
      alert('Please enter your API key');
      return;
    }

    const config = {
      apiKey: apiKey,
      provider: 'openai' as const,
      model: 'gpt-3.5-turbo',
    };

    translator.updateConfig(config);
    setIsConfigured(true);
    setError(null);
    alert('AI translation service configured successfully!');
  };

  // 翻译文本
  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      alert('Please enter some text to translate');
      return;
    }

    if (!isConfigured) {
      alert('Please configure AI service first');
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result = await translator.translate({
        text: sourceText,
        from: 'en',
        to: targetLanguage,
        context: 'demo',
      });

      setTranslatedText(result.translatedText);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
    } finally {
      setIsTranslating(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
    },
    card: {
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: '#212529',
    },
    subtitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: '#212529',
    },
    textArea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      fontSize: '14px',
      minHeight: '100px',
      marginBottom: '16px',
      resize: 'vertical' as const,
      fontFamily: 'inherit',
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      fontSize: '14px',
      marginBottom: '16px',
      width: '200px',
    },
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      marginRight: '8px',
    },
    primaryButton: {
      backgroundColor: '#007bff',
      color: 'white',
    },
    secondaryButton: {
      backgroundColor: '#6c757d',
      color: 'white',
    },
    successButton: {
      backgroundColor: '#28a745',
      color: 'white',
    },
    disabledButton: {
      backgroundColor: '#6c757d',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
    translationResult: {
      backgroundColor: '#e9ecef',
      padding: '16px',
      borderRadius: '4px',
      border: '1px solid #ced4da',
      marginTop: '16px',
    },
    row: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '16px',
      marginBottom: '16px',
    },
    textGroup: {
      flex: 1,
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: '#495057',
    },
    errorMessage: {
      color: '#dc3545',
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '16px',
    },
    statusIndicator: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.875rem',
      fontWeight: 'bold',
      marginLeft: '8px',
    },
    successStatus: {
      backgroundColor: '#d4edda',
      color: '#155724',
    },
    errorStatus: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
    },
    instruction: {
      backgroundColor: '#d1ecf1',
      border: '1px solid #bee5eb',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '12px',
      color: '#0c5460',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🌐 AI Translation Demo</h1>
        <p>This demo showcases the AI translation functionality. Configure your API key and start translating!</p>
      </div>

      {/* 配置区域 */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>🔧 Configuration</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.label}>OpenAI API Key:</label>
          <input
            style={styles.input}
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            width="300px"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          Configuration Status:
          <span
            style={{
              ...styles.statusIndicator,
              ...(isConfigured ? styles.successStatus : styles.errorStatus),
            }}
          >
            {isConfigured ? '✓ Configured' : '✗ Not Configured'}
          </span>
        </div>

        <button
          onClick={handleConfigure}
          style={styles.primaryButton}
          disabled={!apiKey.trim()}
        >
          Configure Service
        </button>
      </div>

      {/* 翻译功能 */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>🔄 Text Translation</h2>

        <div style={styles.textGroup}>
          <label style={styles.label}>Source Text:</label>
          <textarea
            style={styles.textArea}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter text to translate..."
          />
        </div>

        <div style={styles.row}>
          <div style={styles.textGroup}>
            <label style={styles.label}>Target Language:</label>
            <select
              style={styles.input}
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTranslate}
            disabled={isTranslating || !isConfigured}
            style={{
              ...styles.button,
              ...(isTranslating || !isConfigured
                ? styles.disabledButton
                : styles.successButton),
            }}
          >
            {isTranslating ? '🔄 Translating...' : '🚀 Translate'}
          </button>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {translatedText && (
          <div>
            <label style={styles.label}>Translation Result:</label>
            <div style={styles.translationResult}>
              <strong>📝 Translated Text:</strong>
              <p style={{ marginTop: '8px' }}>{translatedText}</p>
            </div>
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>📖 Usage Instructions</h2>

        <div style={styles.instruction}>
          <strong>Step 1:</strong> Enter your OpenAI API key in the configuration section
        </div>
        <div style={styles.instruction}>
          <strong>Step 2:</strong> Click "Configure Service" to set up the AI translation service
        </div>
        <div style={styles.instruction}>
          <strong>Step 3:</strong> Enter the text you want to translate
        </div>
        <div style={styles.instruction}>
          <strong>Step 4:</strong> Select the target language from the dropdown
        </div>
        <div style={styles.instruction}>
          <strong>Step 5:</strong> Click "Translate" to get the translation
        </div>

        <div style={{ marginTop: '16px', fontSize: '14px', color: '#6c757d' }}>
          <p><strong>Supported Features:</strong></p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Multiple AI providers (OpenAI, Claude, Google Translate, DeepL)</li>
            <li>9 major languages supported</li>
            <li>Intelligent caching for performance</li>
            <li>Context-aware translation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BasicAITranslationDemo;