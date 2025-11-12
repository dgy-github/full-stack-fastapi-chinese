"""
翻译缓存预热服务
在启动时预先翻译常用文本并缓存到Redis
"""

import asyncio
import logging
from typing import Dict, List

from app.api.services.redis_cache import get_redis_cache, RedisCacheService
from app.api.services import get_deepseek_service

logger = logging.getLogger(__name__)

class TranslationCacheWarmer:
    """翻译缓存预热器"""

    # 核心UI文本（英文）
    CORE_TEXTS = {
        # 通用操作
        'common.welcome': 'Welcome',
        'common.login': 'Log In',
        'common.logout': 'Logout',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.cancel': 'Cancel',
        'common.submit': 'Submit',
        'common.search': 'Search',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.back': 'Back',
        'common.continue': 'Continue',

        # 导航
        'nav.home': 'Home',
        'nav.settings': 'Settings',
        'nav.menu': 'Menu',

        # 侧边栏
        'sidebar.dashboard': 'Dashboard',
        'sidebar.items': 'Items',
        'sidebar.userSettings': 'User Settings',
        'sidebar.admin': 'Admin',
        'sidebar.menu': 'Menu',
        'sidebar.logout': 'Log Out',
        'sidebar.loggedInAs': 'Logged in as',

        # 设置
        'settings.title': 'User Settings',
        'settings.tabs.myProfile': 'My Profile',
        'settings.tabs.password': 'Password',
        'settings.tabs.appearance': 'Appearance',
        'settings.tabs.dangerZone': 'Danger Zone',
        'settings.profile.title': 'Profile Information',
        'settings.profile.name': 'Full Name',
        'settings.profile.email': 'Email',
        'settings.password.title': 'Change Password',
        'settings.appearance.title': 'Appearance',
        'settings.appearance.theme': 'Theme',
        'settings.appearance.language': 'Language',

        # 认证
        'auth.loginTitle': 'Sign in to your account',
        'auth.signUpTitle': 'Create your account',
        'auth.email': 'Email',
        'auth.username': 'Username',
        'auth.password': 'Password',
        'auth.fullName': 'Full Name',
        'auth.confirmPassword': 'Confirm Password',
        'auth.forgotPassword': 'Forgot Password?',
        'auth.loginButton': 'Log In',
        'auth.signUpButton': 'Sign Up',

        # 仪表板
        'dashboard.greeting': 'Hi, {{name}}',
        'dashboard.welcomeBack': 'Welcome back, nice to see you again!',

        # 项目管理
        'items.title': 'Items Management',
        'items.addItem': 'Add Item',
        'items.editItem': 'Edit Item',
        'items.deleteItem': 'Delete Item',
        'items.table.title': 'Title',
        'items.table.description': 'Description',
        'items.table.actions': 'Actions',

        # 用户管理
        'users.title': 'Users Management',
        'users.addUser': 'Add User',
        'users.editUser': 'Edit User',
        'users.deleteUser': 'Delete User',
        'users.table.fullName': 'Full name',
        'users.table.email': 'Email',
        'users.table.role': 'Role',
        'users.table.actions': 'Actions',
    }

    # 支持的目标语言
    TARGET_LANGUAGES = [
        {'code': 'zh', 'name': 'Chinese'},
        {'code': 'ja', 'name': 'Japanese'},
        {'code': 'ko', 'name': 'Korean'},
        {'code': 'fr', 'name': 'French'},
        {'code': 'de', 'name': 'German'},
        {'code': 'es', 'name': 'Spanish'},
        {'code': 'ru', 'name': 'Russian'},
        {'code': 'it', 'name': 'Italian'},
        {'code': 'pt', 'name': 'Portuguese'},
        {'code': 'ar', 'name': 'Arabic'},
    ]

    def __init__(self):
        self.redis_cache: RedisCacheService = None
        self.deepseek_service = None

    async def initialize(self):
        """初始化服务"""
        try:
            self.redis_cache = await get_redis_cache()
            self.deepseek_service = get_deepseek_service()
            logger.info("🔥 翻译缓存预热器初始化成功")
        except Exception as e:
            logger.error(f"❌ 翻译缓存预热器初始化失败: {e}")

    async def warmup_cache(self, force: bool = False) -> Dict[str, int]:
        """预热缓存

        Args:
            force: 是否强制重新缓存

        Returns:
            预热统计信息
        """
        if not self.redis_cache or not self.deepseek_service:
            logger.error("❌ 缓存预热器未初始化")
            return {}

        logger.info("🚀 开始翻译缓存预热...")
        stats = {
            "total_texts": len(self.CORE_TEXTS),
            "languages_processed": 0,
            "total_translations": 0,
            "errors": 0
        }

        try:
            for language in self.TARGET_LANGUAGES:
                lang_code = language['code']
                lang_name = language['name']

                # 检查是否已有缓存
                if not force:
                    cached = await self.redis_cache.get_batch_translations(lang_code)
                    if cached:
                        logger.info(f"✅ {lang_name} ({lang_code}) 翻译缓存已存在，跳过")
                        stats["total_translations"] += len(cached)
                        stats["languages_processed"] += 1
                        continue

                logger.info(f"🔄 开始预热 {lang_name} ({lang_code}) 翻译...")

                try:
                    # 批量翻译
                    translations = await self._batch_translate(lang_code)

                    if translations:
                        # 缓存翻译结果
                        success = await self.redis_cache.set_batch_translations(
                            lang_code,
                            translations
                        )

                        if success:
                            logger.info(f"✅ {lang_name} 预热完成，共 {len(translations)} 个文本")
                            stats["total_translations"] += len(translations)
                            stats["languages_processed"] += 1
                        else:
                            logger.error(f"❌ {lang_name} 缓存失败")
                            stats["errors"] += 1
                    else:
                        logger.error(f"❌ {lang_name} 翻译失败")
                        stats["errors"] += 1

                except Exception as e:
                    logger.error(f"❌ {lang_name} 预热失败: {e}")
                    stats["errors"] += 1

                # 避免API限制，稍作延迟
                await asyncio.sleep(1)

            logger.info(f"🎉 翻译缓存预热完成! 处理了 {stats['languages_processed']}/{len(self.TARGET_LANGUAGES)} 种语言，共 {stats['total_translations']} 个翻译")
            return stats

        except Exception as e:
            logger.error(f"❌ 缓存预热过程中出错: {e}")
            return stats

    async def _batch_translate(self, target_language: str) -> Dict[str, str]:
        """批量翻译文本"""
        try:
            # 准备文本列表
            texts = list(self.CORE_TEXTS.values())

            # 构建批量翻译请求
            texts_input = "\n".join([f"{i+1}. {text}" for i, text in enumerate(texts)])

            system_prompt = f"""You are a professional translator. Translate the following numbered list of English texts to {target_language}.

Requirements:
1. Translate each text accurately while preserving the original meaning and tone
2. Consider this is for web interface UI - keep it concise and natural
3. Handle placeholders like {{name}} or {{count}} properly - don't translate them
4. Return the results in the same numbered format
5. If a text contains only placeholders or special characters, keep it as is

Example format:
1. [translated text 1]
2. [translated text 2]
3. [translated text 3]

Return ONLY the numbered translations, no explanations."""

            user_message = f"Web UI texts to translate to {target_language}:\n\n{texts_input}"

            # 调用DeepSeek API
            response = await self.deepseek_service.chat(
                message=user_message,
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=2000
            )

            # 解析响应
            return self._parse_batch_response(response, texts)

        except Exception as e:
            logger.error(f"批量翻译失败: {e}")
            return {}

    def _parse_batch_response(self, response: str, original_texts: List[str]) -> Dict[str, str]:
        """解析批量翻译响应"""
        try:
            translations = {}
            lines = response.strip().split('\n')

            # 构建键值对映射
            keys = list(self.CORE_TEXTS.keys())

            for i, (key, original_text) in enumerate(self.CORE_TEXTS.items()):
                if i < len(lines):
                    line = lines[i].strip()
                    # 提取翻译文本
                    if '. ' in line:
                        translated_text = line.split('. ', 1)[1]
                    elif line and not line.replace('.', '').isdigit():
                        translated_text = line
                    else:
                        translated_text = original_text

                    translations[key] = translated_text
                else:
                    translations[key] = original_text

            return translations

        except Exception as e:
            logger.error(f"解析翻译响应失败: {e}")
            return {}

    async def get_cache_status(self) -> Dict:
        """获取缓存状态"""
        if not self.redis_cache:
            return {"error": "Redis未连接"}

        try:
            stats = await self.redis_cache.get_cache_stats()
            return {
                "redis_connected": self.redis_cache.is_connected,
                "cache_stats": stats,
                "core_texts_count": len(self.CORE_TEXTS),
                "target_languages": len(self.TARGET_LANGUAGES)
            }
        except Exception as e:
            return {"error": str(e)}


# 全局缓存预热器实例
cache_warmer = TranslationCacheWarmer()


async def warmup_translation_cache(force: bool = False) -> Dict[str, int]:
    """预热翻译缓存

    Args:
        force: 是否强制重新缓存

    Returns:
        预热统计信息
    """
    await cache_warmer.initialize()
    return await cache_warmer.warmup_cache(force)


async def get_cache_warm_status() -> Dict:
    """获取缓存预热状态"""
    return await cache_warmer.get_cache_status()