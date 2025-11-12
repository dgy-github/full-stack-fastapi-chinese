"""
Redis 缓存服务
用于缓存AI翻译结果，提供启动时预热功能
"""

import json
import asyncio
import logging
from typing import Dict, Optional, List
from datetime import timedelta

import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisCacheService:
    """Redis 缓存服务"""

    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.is_connected = False

    async def connect(self) -> bool:
        """连接Redis服务器"""
        try:
            self.redis_client = redis.Redis(
                host='115.190.213.0',  # 你提供的Redis服务器IP
                port=6379,
                password=None,  # 如果有密码可以在这里设置
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )

            # 测试连接
            await self.redis_client.ping()
            self.is_connected = True
            logger.info("✅ Redis连接成功: 115.190.213.0:6379")
            return True

        except Exception as e:
            logger.error(f"❌ Redis连接失败: {e}")
            self.is_connected = False
            return False

    async def disconnect(self):
        """断开Redis连接"""
        if self.redis_client:
            await self.redis_client.close()
            self.is_connected = False
            logger.info("Redis连接已断开")

    async def get_translation(self, text: str, target_language: str) -> Optional[str]:
        """获取缓存的翻译"""
        if not self.is_connected:
            return None

        try:
            key = f"translation:{target_language}:{hash(text)}"
            result = await self.redis_client.get(key)
            return result
        except Exception as e:
            logger.warning(f"获取翻译缓存失败: {e}")
            return None

    async def set_translation(self, text: str, target_language: str, translated_text: str, ttl_hours: int = 24):
        """设置翻译缓存"""
        if not self.is_connected:
            return False

        try:
            key = f"translation:{target_language}:{hash(text)}"
            await self.redis_client.setex(
                key,
                timedelta(hours=ttl_hours),
                translated_text
            )
            return True
        except Exception as e:
            logger.warning(f"设置翻译缓存失败: {e}")
            return False

    async def get_batch_translations(self, target_language: str) -> Optional[Dict[str, str]]:
        """获取批量翻译缓存"""
        if not self.is_connected:
            return None

        try:
            key = f"batch_translation:{target_language}"
            result = await self.redis_client.get(key)
            if result:
                return json.loads(result)
            return None
        except Exception as e:
            logger.warning(f"获取批量翻译缓存失败: {e}")
            return None

    async def set_batch_translations(self, target_language: str, translations: Dict[str, str], ttl_hours: int = 24):
        """设置批量翻译缓存"""
        if not self.is_connected:
            return False

        try:
            key = f"batch_translation:{target_language}"
            await self.redis_client.setex(
                key,
                timedelta(hours=ttl_hours),
                json.dumps(translations, ensure_ascii=False)
            )
            return True
        except Exception as e:
            logger.warning(f"设置批量翻译缓存失败: {e}")
            return False

    async def get_cache_stats(self) -> Dict[str, int]:
        """获取缓存统计信息"""
        if not self.is_connected:
            return {}

        try:
            # 获取翻译缓存键的数量
            translation_keys = await self.redis_client.keys("translation:*")
            batch_keys = await self.redis_client.keys("batch_translation:*")
            total_keys = await self.get_total_keys()

            return {
                "individual_translations": len(translation_keys),
                "batch_translations": len(batch_keys),
                "total_cached": len(translation_keys) + len(batch_keys),
                "total_keys": total_keys
            }
        except Exception as e:
            logger.warning(f"获取缓存统计失败: {e}")
            return {}

    async def clear_cache(self, pattern: str = "translation:*"):
        """清除缓存"""
        if not self.is_connected:
            return False

        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                await self.redis_client.delete(*keys)
                logger.info(f"清除了 {len(keys)} 个缓存项")
            return True
        except Exception as e:
            logger.warning(f"清除缓存失败: {e}")
            return False

    async def ping(self) -> bool:
        """检查Redis连接"""
        if not self.is_connected:
            return False

        try:
            await self.redis_client.ping()
            return True
        except Exception as e:
            logger.warning(f"Redis ping失败: {e}")
            self.is_connected = False
            return False

    async def get_memory_info(self) -> Dict[str, int]:
        """获取Redis内存信息"""
        if not self.is_connected:
            return {}

        try:
            info = await self.redis_client.info("memory")
            used_memory = info.get("used_memory", 0)
            max_memory = info.get("maxmemory", 0)

            used_memory_percentage = 0
            if max_memory > 0:
                used_memory_percentage = (used_memory / max_memory) * 100

            return {
                "used_memory": used_memory,
                "used_memory_human": info.get("used_memory_human", "0B"),
                "max_memory": max_memory,
                "max_memory_human": info.get("maxmemory_human", "0B") if max_memory > 0 else "unlimited",
                "used_memory_percentage": round(used_memory_percentage, 2),
                "memory_fragmentation_ratio": info.get("mem_fragmentation_ratio", 0)
            }
        except Exception as e:
            logger.warning(f"获取Redis内存信息失败: {e}")
            return {}

    async def get_total_keys(self) -> int:
        """获取Redis中总键数"""
        if not self.is_connected:
            return 0

        try:
            return await self.redis_client.dbsize()
        except Exception as e:
            logger.warning(f"获取Redis键总数失败: {e}")
            return 0


# 全局Redis缓存实例
redis_cache = RedisCacheService()


async def get_redis_cache() -> RedisCacheService:
    """获取Redis缓存实例"""
    if not redis_cache.is_connected:
        await redis_cache.connect()
    return redis_cache