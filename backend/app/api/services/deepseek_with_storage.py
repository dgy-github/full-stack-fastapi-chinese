"""
DeepSeek AI 服务模块（支持会话存储）

提供与 DeepSeek API 的集成功能，并支持会话存储和管理
"""

import uuid
from datetime import datetime
from typing import Optional, List, AsyncGenerator

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_

from app.core import settings
from app.models import (
    ChatSession, ChatMessage, ChatSessionCreate, ChatMessageCreate,
    ChatSessionPublic, ChatMessagePublic, ChatRequest, ChatResponse
)


class DeepSeekWithStorageService:
    """DeepSeek AI 服务封装类（支持会话存储）"""

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

    async def create_session(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        title: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> ChatSession:
        """创建新的聊天会话"""
        session_data = ChatSessionCreate(
            user_id=user_id,
            title=title,
            system_prompt=system_prompt,
            model_name=self.model_name,
            temperature=temperature,
            max_tokens=max_tokens
        )

        db_session = ChatSession.from_orm(session_data)
        db.add(db_session)
        await db.commit()
        await db.refresh(db_session)
        return db_session

    async def get_session(
        self,
        db: AsyncSession,
        session_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Optional[ChatSession]:
        """获取用户的指定会话"""
        statement = select(ChatSession).where(
            and_(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id,
                ChatSession.is_active == True
            )
        )
        result = await db.exec(statement)
        return result.first()

    async def get_user_sessions(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[ChatSession]:
        """获取用户的所有活跃会话"""
        statement = (
            select(ChatSession)
            .where(
                and_(
                    ChatSession.user_id == user_id,
                    ChatSession.is_active == True
                )
            )
            .order_by(ChatSession.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await db.exec(statement)
        return result.all()

    async def get_session_messages(
        self,
        db: AsyncSession,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        limit: int = 100
    ) -> List[ChatMessage]:
        """获取会话的所有消息"""
        # 首先验证会话属于用户
        session = await self.get_session(db, session_id, user_id)
        if not session:
            return []

        statement = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.sequence_number.asc())
            .limit(limit)
        )
        result = await db.exec(statement)
        return result.all()

    async def chat_with_storage(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        request: ChatRequest
    ) -> ChatResponse:
        """
        发送消息到 DeepSeek 并存储会话

        Args:
            db: 数据库会话
            user_id: 用户ID
            request: 聊天请求

        Returns:
            ChatResponse: 聊天响应
        """
        start_time = datetime.utcnow()
        session = None

        try:
            # 获取或创建会话
            if request.session_id:
                session = await self.get_session(db, request.session_id, user_id)
                if not session:
                    raise ValueError("Session not found or access denied")
            else:
                # 创建新会话
                title = request.title or f"对话 - {start_time.strftime('%Y-%m-%d %H:%M')}"
                session = await self.create_session(
                    db=db,
                    user_id=user_id,
                    title=title,
                    system_prompt=request.system_prompt,
                    temperature=request.temperature or 0.7,
                    max_tokens=request.max_tokens or 2000
                )

            # 获取会话历史消息
            messages = []
            if session.system_prompt:
                messages.append(SystemMessage(content=session.system_prompt))

            # 获取历史消息作为上下文
            history_messages = await self.get_session_messages(db, session.id, user_id, limit=20)
            for msg in history_messages:
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    messages.append(AIMessage(content=msg.content))

            # 添加当前用户消息
            messages.append(HumanMessage(content=request.message))

            # 保存用户消息
            user_message = ChatMessage(
                session_id=session.id,
                role="user",
                content=request.message,
                sequence_number=len(history_messages) + 1,
                created_at=start_time
            )
            db.add(user_message)

            # 调用 AI API
            api_start_time = datetime.utcnow()

            # 构建调用参数
            kwargs = {}
            if request.temperature is not None:
                kwargs["temperature"] = request.temperature
            if request.max_tokens is not None:
                kwargs["max_tokens"] = request.max_tokens

            # 调用 API
            if kwargs:
                response = await self.llm.ainvoke(messages, **kwargs)
            else:
                response = await self.llm.ainvoke(messages)

            api_end_time = datetime.utcnow()
            response_time_ms = int((api_end_time - api_start_time).total_seconds() * 1000)

            # 保存 AI 回复消息
            assistant_message = ChatMessage(
                session_id=session.id,
                role="assistant",
                content=response.content,
                sequence_number=len(history_messages) + 2,
                model_used=self.model_name,
                response_time_ms=response_time_ms,
                created_at=api_end_time
            )
            db.add(assistant_message)

            # 更新会话的最后更新时间
            session.updated_at = api_end_time

            await db.commit()
            await db.refresh(assistant_message)

            return ChatResponse(
                message=response.content,
                session_id=session.id,
                message_id=assistant_message.id,
                sequence_number=assistant_message.sequence_number,
                created_at=assistant_message.created_at,
                response_time_ms=response_time_ms
            )

        except Exception as e:
            await db.rollback()
            raise Exception(f"DeepSeek API error: {str(e)}")

    async def stream_chat_with_storage(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        request: ChatRequest
    ) -> AsyncGenerator[str, None]:
        """
        流式聊天（生成器）并存储会话

        Args:
            db: 数据库会话
            user_id: 用户ID
            request: 聊天请求

        Yields:
            AI 回复的文本片段
        """
        start_time = datetime.utcnow()
        session = None
        assistant_message_id = uuid.uuid4()

        try:
            # 获取或创建会话
            if request.session_id:
                session = await self.get_session(db, request.session_id, user_id)
                if not session:
                    raise ValueError("Session not found or access denied")
            else:
                # 创建新会话
                title = request.title or f"对话 - {start_time.strftime('%Y-%m-%d %H:%M')}"
                session = await self.create_session(
                    db=db,
                    user_id=user_id,
                    title=title,
                    system_prompt=request.system_prompt,
                    temperature=request.temperature or 0.7,
                    max_tokens=request.max_tokens or 2000
                )

            # 获取会话历史消息
            messages = []
            if session.system_prompt:
                messages.append(SystemMessage(content=session.system_prompt))

            # 获取历史消息作为上下文
            history_messages = await self.get_session_messages(db, session.id, user_id, limit=20)
            for msg in history_messages:
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    messages.append(AIMessage(content=msg.content))

            # 添加当前用户消息
            messages.append(HumanMessage(content=request.message))

            # 保存用户消息
            user_message = ChatMessage(
                session_id=session.id,
                role="user",
                content=request.message,
                sequence_number=len(history_messages) + 1,
                created_at=start_time
            )
            db.add(user_message)

            api_start_time = datetime.utcnow()
            full_response = ""

            # 流式调用 API
            async for chunk in self.llm.astream(messages):
                if chunk.content:
                    full_response += chunk.content
                    yield chunk.content

            api_end_time = datetime.utcnow()
            response_time_ms = int((api_end_time - api_start_time).total_seconds() * 1000)

            # 保存 AI 回复消息
            assistant_message = ChatMessage(
                id=assistant_message_id,
                session_id=session.id,
                role="assistant",
                content=full_response,
                sequence_number=len(history_messages) + 2,
                model_used=self.model_name,
                response_time_ms=response_time_ms,
                created_at=api_end_time
            )
            db.add(assistant_message)

            # 更新会话的最后更新时间
            session.updated_at = api_end_time

            await db.commit()

        except Exception as e:
            await db.rollback()
            raise Exception(f"DeepSeek API streaming error: {str(e)}")

    async def delete_session(
        self,
        db: AsyncSession,
        session_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """删除会话（软删除）"""
        session = await self.get_session(db, session_id, user_id)
        if not session:
            return False

        session.is_active = False
        session.updated_at = datetime.utcnow()
        await db.commit()
        return True

    async def get_session_stats(
        self,
        db: AsyncSession,
        session_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Optional[dict]:
        """获取会话统计信息"""
        # 验证会话属于用户
        session = await self.get_session(db, session_id, user_id)
        if not session:
            return None

        # 获取消息统计
        messages = await self.get_session_messages(db, session_id, user_id, limit=1000)

        user_messages = [m for m in messages if m.role == "user"]
        assistant_messages = [m for m in messages if m.role == "assistant"]

        total_tokens = sum(m.token_count or 0 for m in messages)
        response_times = [m.response_time_ms for m in assistant_messages if m.response_time_ms]
        avg_response_time = sum(response_times) / len(response_times) if response_times else None

        return {
            "session_id": session_id,
            "total_messages": len(messages),
            "user_messages": len(user_messages),
            "assistant_messages": len(assistant_messages),
            "total_tokens": total_tokens,
            "first_message_at": messages[0].created_at if messages else None,
            "last_message_at": messages[-1].created_at if messages else None,
            "average_response_time_ms": avg_response_time,
        }

    def is_configured(self) -> bool:
        """检查 DeepSeek 服务是否已正确配置"""
        return bool(settings.DEEPSEEK_API_KEY)

    def get_model_info(self) -> dict:
        """获取当前使用的模型信息"""
        return {
            "model": self.model_name,
            "base_url": settings.DEEPSEEK_BASE_URL,
            "configured": self.is_configured(),
        }


# 全局单例实例
_deepseek_storage_service: Optional[DeepSeekWithStorageService] = None


def get_deepseek_storage_service() -> DeepSeekWithStorageService:
    """获取 DeepSeek 存储服务的单例实例"""
    global _deepseek_storage_service

    if _deepseek_storage_service is None:
        _deepseek_storage_service = DeepSeekWithStorageService()

    return _deepseek_storage_service


def reset_deepseek_storage_service() -> None:
    """重置 DeepSeek 存储服务实例"""
    global _deepseek_storage_service
    _deepseek_storage_service = None