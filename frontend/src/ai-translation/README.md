# AI Translation Plugin

一个强大的AI翻译插件，为React应用提供智能语言切换和实时翻译功能。

## 功能特性

### 🌍 多语言支持
- 支持9种主要语言：英语、中文、西班牙语、法语、德语、日语、韩语、俄语、阿拉伯语
- 智能语言检测
- 自动语言切换

### 🤖 AI翻译服务
- **OpenAI**: GPT-3.5, GPT-4, GPT-4 Turbo
- **Anthropic Claude**: Claude 3 Haiku, Sonnet, Opus
- **Google Translate**: 专业的翻译API
- **DeepL**: 高质量的机器翻译

### 🎯 核心功能
- **实时翻译**: 即时翻译UI文本和菜单
- **智能缓存**: 本地缓存翻译结果，提升性能
- **批量翻译**: 高效处理大量文本
- **菜单翻译**: 专门优化菜单和导航翻译
- **进度显示**: 实时显示翻译进度

### 🛠️ 技术特性
- **TypeScript支持**: 完整的类型定义
- **React Hooks**: 现代化的React API
- **Context管理**: 全局状态管理
- **错误处理**: 完善的错误恢复机制
- **离线缓存**: 智能缓存策略

## 安装和配置

### 1. 基本使用

```tsx
import React from 'react';
import { AITranslationProvider, AILanguageSwitcher } from './ai-translation';

function App() {
  return (
    <AITranslationProvider>
      <YourApp />
      <AILanguageSwitcher />
    </AITranslationProvider>
  );
}
```

### 2. 配置AI服务

```tsx
import { configureAI } from './ai-translation';

const config = {
  provider: 'openai',
  apiKey: 'your-openai-api-key',
  model: 'gpt-3.5-turbo',
};

await configureAI(config);
```

## 组件使用指南

### AILanguageSwitcher

AI语言切换器，提供语言选择和AI配置功能。

```tsx
<AILanguageSwitcher
  size="md"
  variant="outline"
  showTranslationProgress={true}
  onLanguageChange={(lang) => console.log('Language changed to:', lang)}
/>
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' - 按钮大小
- `variant`: 'solid' | 'outline' | 'ghost' - 按钮样式
- `showTranslationProgress`: 是否显示翻译进度
- `onLanguageChange`: 语言切换回调

### TranslationIndicator

翻译状态指示器，显示当前文本的翻译状态。

```tsx
<TranslationIndicator
  originalText="Hello World"
  translatedText="你好世界"
  targetLanguage="zh"
  context="menu"
  onTranslationUpdate={(translated) => console.log(translated)}
  showRetryButton={true}
/>
```

### AITranslationProvider

全局AI翻译Provider，必须在应用根部使用。

```tsx
<AITranslationProvider
  defaultConfig={{
    provider: 'openai',
    apiKey: 'your-api-key',
  }}
  autoConnect={true}
>
  <App />
</AITranslationProvider>
```

## Hooks使用指南

### useAITranslation

核心翻译Hook，提供翻译功能。

```tsx
import { useAITranslation } from './ai-translation';

function MyComponent() {
  const {
    translate,
    translateBatch,
    isTranslating,
    progress,
    error,
    isConfigured,
    configureAI,
    testConnection,
  } = useAITranslation();

  const handleTranslate = async () => {
    const result = await translate('Hello', 'zh');
    console.log(result); // '你好'
  };

  return (
    <button onClick={handleTranslate} disabled={isTranslating}>
      {isTranslating ? 'Translating...' : 'Translate'}
    </button>
  );
}
```

### useMenuTranslator

专门的菜单翻译Hook。

```tsx
import { useMenuTranslator } from './ai-translation';

function MenuComponent() {
  const { translateMenu, isTranslating, progress } = useMenuTranslator();

  const translateMyMenu = async () => {
    const menuData = [
      { title: 'Dashboard', path: '/' },
      { title: 'Settings', path: '/settings' },
    ];

    const translatedMenu = await translateMenu(menuData, 'zh');
    console.log(translatedMenu);
  };

  return <button onClick={translateMyMenu}>Translate Menu</button>;
}
```

### useTranslationCache

缓存管理Hook。

```tsx
import { useTranslationCache } from './ai-translation';

function CacheManager() {
  const {
    getCachedTranslation,
    cacheTranslation,
    clearCache,
    getCacheStats,
  } = useTranslationCache();

  const handleClearCache = () => {
    clearCache();
    console.log('Cache cleared');
  };

  return <button onClick={handleClearCache}>Clear Cache</button>;
}
```

## 服务类使用

### AITranslator

底层翻译服务类。

```tsx
import { AITranslator } from './ai-translation';

const translator = new AITranslator({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-3.5-turbo',
});

const result = await translator.translate({
  text: 'Hello World',
  from: 'en',
  to: 'zh',
});
```

### TranslationCacheManager

翻译缓存管理器。

```tsx
import { TranslationCacheManager } from './ai-translation';

const cache = new TranslationCacheManager();

// 缓存翻译
cache.set(
  { text: 'Hello', from: 'en', to: 'zh' },
  { translatedText: '你好', sourceLanguage: 'en', targetLanguage: 'zh' }
);

// 获取缓存
const cached = cache.get({ text: 'Hello', from: 'en', to: 'zh' });
```

## 配置选项

### AITranslationConfig

```typescript
interface AITranslationConfig {
  provider: 'openai' | 'claude' | 'google' | 'deepl';
  apiKey: string;
  model?: string;
  endpoint?: string;
  maxRetries?: number;
  timeout?: number;
  cacheExpiration?: number; // 毫秒
}
```

### 环境变量

```env
# OpenAI
VITE_OPENAI_API_KEY=your-openai-key

# Anthropic Claude
VITE_CLAUDE_API_KEY=your-claude-key

# Google Translate
VITE_GOOGLE_TRANSLATE_KEY=your-google-key

# DeepL
VITE_DEEPL_API_KEY=your-deepl-key
```

## 最佳实践

### 1. 错误处理

```tsx
const { translate, error } = useAITranslation();

const handleTranslate = async (text: string) => {
  try {
    const result = await translate(text, 'zh');
    return result;
  } catch (err) {
    console.error('Translation failed:', err);
    return text; // 返回原文作为fallback
  }
};
```

### 2. 批量翻译优化

```tsx
const { translateBatch } = useAITranslation();

// 批量翻译大量文本，提高效率
const texts = ['Hello', 'World', 'Welcome'];
const translations = await translateBatch(texts, 'zh');
```

### 3. 缓存策略

```tsx
// 启用缓存以提高性能
const { translate } = useAITranslation({
  enableCache: true,
});

// 定期清理过期缓存
useEffect(() => {
  const interval = setInterval(() => {
    // 清理逻辑
  }, 24 * 60 * 60 * 1000); // 每天

  return () => clearInterval(interval);
}, []);
```

### 4. 用户体验优化

```tsx
// 显示翻译进度
const { isTranslating, progress } = useAITranslation();

return (
  <div>
    {isTranslating && (
      <Progress value={progress.completed / progress.total * 100} />
    )}
    {/* 内容 */}
  </div>
);
```

## 故障排除

### 常见问题

1. **API密钥错误**
   - 检查API密钥是否正确
   - 确认API密钥有足够的权限

2. **网络连接问题**
   - 检查网络连接
   - 确认API端点可访问

3. **翻译质量问题**
   - 尝试不同的AI模型
   - 提供更具体的上下文信息

4. **性能问题**
   - 启用缓存
   - 使用批量翻译
   - 合理设置超时时间

### 调试模式

```tsx
<AITranslationProvider>
  <AITranslationSettings />
  <App />
</AITranslationProvider>
```

使用 `AITranslationSettings` 组件可以查看详细的配置和统计信息。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持OpenAI、Claude、Google Translate、DeepL
- 完整的React组件和Hooks
- TypeScript支持
- 缓存机制
- 批量翻译功能

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License