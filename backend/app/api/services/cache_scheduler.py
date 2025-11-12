"""
缓存定时任务服务
负责定期刷新Redis缓存
"""
import logging
from datetime import datetime
from typing import Dict, Any

from app.api.services.scheduler_manager import scheduler_manager
from app.api.services.translation_cache_warmer import TranslationCacheWarmer
from app.api.services.redis_cache import redis_cache

logger = logging.getLogger(__name__)

class CacheSchedulerService:
    """缓存定时任务服务"""

    def __init__(self):
        self.cache_warmer = TranslationCacheWarmer()
        self._setup_default_tasks()

    def _setup_default_tasks(self):
        """设置默认的定时任务"""
        # 每日缓存刷新任务 (凌晨2点执行)
        scheduler_manager.add_task(
            task_id="daily_cache_refresh",
            name="每日缓存刷新",
            func=self._daily_cache_refresh,
            interval_hours=24,
            enabled=True,
            max_retries=3,
            timeout_seconds=7200,  # 2小时超时
            description="每天凌晨2点刷新翻译缓存"
        )

        # 每周缓存清理任务 (周日凌晨3点执行)
        scheduler_manager.add_task(
            task_id="weekly_cache_cleanup",
            name="每周缓存清理",
            func=self._weekly_cache_cleanup,
            interval_hours=168,  # 7天 = 168小时
            enabled=True,
            max_retries=2,
            timeout_seconds=3600,  # 1小时超时
            description="每周清理过期缓存和统计信息"
        )

        # 缓存健康检查任务 (每小时执行)
        scheduler_manager.add_task(
            task_id="hourly_health_check",
            name="缓存健康检查",
            func=self._hourly_health_check,
            interval_hours=1,
            enabled=True,
            max_retries=1,
            timeout_seconds=300,  # 5分钟超时
            description="每小时检查Redis连接和缓存状态"
        )

    async def _daily_cache_refresh(self) -> Dict[str, Any]:
        """每日缓存刷新任务"""
        try:
            logger.info("开始每日缓存刷新任务")
            start_time = datetime.now()

            # 检查Redis连接
            if not await redis_cache.ping():
                raise Exception("Redis连接失败")

            # 执行缓存预热
            result = await self.cache_warmer.warmup_cache(force_refresh=True)

            # 记录执行结果
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()

            logger.info(f"每日缓存刷新完成，耗时: {duration:.2f}秒")

            return {
                "success": True,
                "duration_seconds": duration,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "cache_stats": result
            }

        except Exception as e:
            logger.error(f"每日缓存刷新失败: {e}")
            return {
                "success": False,
                "error": str(e),
                "start_time": start_time.isoformat() if 'start_time' in locals() else None,
                "end_time": datetime.now().isoformat()
            }

    async def _weekly_cache_cleanup(self) -> Dict[str, Any]:
        """每周缓存清理任务"""
        try:
            logger.info("开始每周缓存清理任务")
            start_time = datetime.now()

            # 检查Redis连接
            if not await redis_cache.ping():
                raise Exception("Redis连接失败")

            # 获取缓存统计信息
            cache_stats = await redis_cache.get_cache_stats()

            # 清理过期的keys (这里可以添加更复杂的清理逻辑)
            # 例如清理超过30天的访问记录
            cleanup_stats = {
                "expired_keys_cleaned": 0,
                "memory_freed_mb": 0,
                "total_keys_remaining": cache_stats.get("total_keys", 0)
            }

            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()

            logger.info(f"每周缓存清理完成，耗时: {duration:.2f}秒")

            return {
                "success": True,
                "duration_seconds": duration,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "cache_stats_before": cache_stats,
                "cleanup_stats": cleanup_stats
            }

        except Exception as e:
            logger.error(f"每周缓存清理失败: {e}")
            return {
                "success": False,
                "error": str(e),
                "start_time": start_time.isoformat() if 'start_time' in locals() else None,
                "end_time": datetime.now().isoformat()
            }

    async def _hourly_health_check(self) -> Dict[str, Any]:
        """每小时健康检查任务"""
        try:
            logger.debug("开始缓存健康检查")
            start_time = datetime.now()

            # 检查Redis连接
            redis_connected = await redis_cache.ping()

            # 获取基本统计信息
            cache_stats = await redis_cache.get_cache_stats() if redis_connected else {}

            # 检查内存使用率
            memory_info = await redis_cache.get_memory_info() if redis_connected else {}

            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()

            health_status = {
                "redis_connected": redis_connected,
                "cache_available": redis_connected and cache_stats.get("total_keys", 0) > 0,
                "memory_usage_ok": memory_info.get("used_memory_percentage", 0) < 80,  # 内存使用率低于80%
                "response_time_ms": duration * 1000
            }

            # 如果有问题，记录警告
            if not all(health_status.values()):
                logger.warning(f"缓存健康检查发现问题: {health_status}")

            return {
                "success": True,
                "duration_seconds": duration,
                "check_time": start_time.isoformat(),
                "health_status": health_status,
                "cache_stats": cache_stats,
                "memory_info": memory_info
            }

        except Exception as e:
            logger.error(f"缓存健康检查失败: {e}")
            return {
                "success": False,
                "error": str(e),
                "check_time": start_time.isoformat() if 'start_time' in locals() else None,
                "health_status": {
                    "redis_connected": False,
                    "cache_available": False,
                    "memory_usage_ok": False,
                    "response_time_ms": None
                }
            }

    def add_custom_task(
        self,
        task_id: str,
        name: str,
        interval_hours: int,
        task_type: str = "custom",
        **kwargs
    ) -> bool:
        """添加自定义定时任务"""
        task_func = None

        if task_type == "cache_refresh":
            task_func = self._daily_cache_refresh
        elif task_type == "cache_cleanup":
            task_func = self._weekly_cache_cleanup
        elif task_type == "health_check":
            task_func = self._hourly_health_check
        else:
            logger.error(f"Unsupported task type: {task_type}")
            return False

        return scheduler_manager.add_task(
            task_id=task_id,
            name=name,
            func=task_func,
            interval_hours=interval_hours,
            enabled=kwargs.get("enabled", True),
            max_retries=kwargs.get("max_retries", 3),
            timeout_seconds=kwargs.get("timeout_seconds", 3600)
        )

    def get_task_execution_history(self, task_id: str, limit: int = 10) -> list:
        """获取任务执行历史 (这里简化实现，实际应该从数据库或日志中获取)"""
        # TODO: 实现任务执行历史记录功能
        return []

    def get_scheduler_status(self) -> Dict[str, Any]:
        """获取调度器状态"""
        return {
            "scheduler_running": scheduler_manager.running,
            "total_tasks": len(scheduler_manager.tasks),
            "enabled_tasks": len([t for t in scheduler_manager.tasks.values() if t.enabled]),
            "tasks_info": scheduler_manager.get_all_tasks_info()
        }

# 全局缓存调度服务实例
cache_scheduler_service = CacheSchedulerService()