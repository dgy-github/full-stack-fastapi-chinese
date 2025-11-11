"""
DeepSeek AI 服务模块

提供与 DeepSeek API 的集成功能

注意：建议使用 deepseek_with_storage.py 来获得完整的会话管理功能
"""

from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# ✅ 从 core 包导入（最优雅）
from app.core import settings



class DeepSeekService:
    """DeepSeek AI 服务封装类"""

    def __init__(self):
        """初始化 DeepSeek 客户端"""
        if not settings.DEEPSEEK_API_KEY:
            raise ValueError("DEEPSEEK_API_KEY not configured in settings")

        self.llm = ChatOpenAI(
            model=settings.DEEPSEEK_MODEL_NAME,
            openai_api_key=settings.DEEPSEEK_API_KEY,
            openai_api_base=settings.DEEPSEEK_BASE_URL,
            temperature=0.7,
            max_tokens=2000,
        )
        self.model_name = settings.DEEPSEEK_MODEL_NAME

    async def chat(
            self,
            message: str,
            system_prompt: Optional[str] = None,
            temperature: Optional[float] = None,
            max_tokens: Optional[int] = None
    ) -> str:
        """
        发送消息到 DeepSeek 并获取回复

        Args:
            message: 用户消息内容
            system_prompt: 可选的系统提示词
            temperature: 可选的温度参数 (0.0-2.0)
            max_tokens: 可选的最大 token 数

        Returns:
            AI 回复内容

        Raises:
            Exception: 当 API 调用失败时
        """
        try:
            messages = []

            # 添加系统提示词（如果提供）
            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))

            # 添加用户消息
            messages.append(HumanMessage(content=message))

            # 构建调用参数
            kwargs = {}
            if temperature is not None:
                kwargs["temperature"] = temperature
            if max_tokens is not None:
                kwargs["max_tokens"] = max_tokens

            # 调用 API
            if kwargs:
                response = await self.llm.ainvoke(messages, **kwargs)
            else:
                response = await self.llm.ainvoke(messages)

            return response.content

        except Exception as e:
            raise Exception(f"DeepSeek API error: {str(e)}")

    def chat_sync(
            self,
            message: str,
            system_prompt: Optional[str] = None
    ) -> str:
        """
        同步版本的聊天方法

        Args:
            message: 用户消息内容
            system_prompt: 可选的系统提示词

        Returns:
            AI 回复内容
        """
        try:
            messages = []

            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))

            messages.append(HumanMessage(content=message))

            response = self.llm.invoke(messages)
            return response.content

        except Exception as e:
            raise Exception(f"DeepSeek API error: {str(e)}")

    async def stream_chat(
            self,
            message: str,
            system_prompt: Optional[str] = None
    ):
        """
        流式聊天（生成器）

        Args:
            message: 用户消息内容
            system_prompt: 可选的系统提示词

        Yields:
            AI 回复的文本片段
        """
        try:
            messages = []

            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))

            messages.append(HumanMessage(content=message))

            async for chunk in self.llm.astream(messages):
                if chunk.content:
                    yield chunk.content

        except Exception as e:
            raise Exception(f"DeepSeek API streaming error: {str(e)}")

    def is_configured(self) -> bool:
        """
        检查 DeepSeek 服务是否已正确配置

        Returns:
            配置状态
        """
        return bool(settings.DEEPSEEK_API_KEY)

    def get_model_info(self) -> dict:
        """
        获取当前使用的模型信息

        Returns:
            模型配置信息
        """
        return {
            "model": self.model_name,
            "base_url": settings.DEEPSEEK_BASE_URL,
            "configured": self.is_configured(),
        }


# 全局单例实例
_deepseek_service: Optional[DeepSeekService] = None


def get_deepseek_service() -> DeepSeekService:
    """
    获取 DeepSeek 服务的单例实例

    Returns:
        DeepSeekService 实例

    Raises:
        ValueError: 当服务未正确配置时
    """
    global _deepseek_service

    if _deepseek_service is None:
        _deepseek_service = DeepSeekService()

    return _deepseek_service


def reset_deepseek_service() -> None:
    """
    重置 DeepSeek 服务实例

    主要用于测试或重新配置场景
    """
    global _deepseek_service
    _deepseek_service = None
