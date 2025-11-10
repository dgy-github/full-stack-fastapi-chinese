"""
服务层模块
"""

from app.api.services.deepseek import DeepSeekService

# 单例实例
_deepseek_service: DeepSeekService | None = None


def get_deepseek_service() -> DeepSeekService:
    """
    获取 DeepSeek 服务单例实例

    Returns:
        DeepSeekService: DeepSeek 服务实例

    Raises:
        ValueError: 如果 DeepSeek 未配置
    """
    global _deepseek_service

    if _deepseek_service is None:
        _deepseek_service = DeepSeekService()

    return _deepseek_service


__all__ = ["DeepSeekService", "get_deepseek_service"]
