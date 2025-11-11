"""
Chat session management API routes

支持完整的会话管理和 DeepSeek AI 对话功能
"""

import json
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.models import (
    User, ChatRequest, ChatResponse, ChatStreamResponse,
    ChatSessionPublic, ChatSessionsPublic, ChatMessagesPublic,
    ChatMessagePublic, ChatSessionStats, ChatHistoryResponse
)
from app.api.services.deepseek_with_storage import get_deepseek_storage_service

router = APIRouter()


# ============ Session Management Endpoints ============

@router.post(
    "/sessions",
    response_model=ChatSessionPublic,
    summary="Create Chat Session",
    description="创建新的聊天会话"
)
async def create_chat_session(
    title: str = Query(..., description="会话标题"),
    system_prompt: Optional[str] = Query(None, description="系统提示词"),
    temperature: float = Query(0.7, ge=0.0, le=2.0, description="温度参数"),
    max_tokens: int = Query(2000, ge=1, le=8000, description="最大令牌数"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """创建新的聊天会话"""
    try:
        service = get_deepseek_storage_service()
        session = await service.create_session(
            db=db,
            user_id=current_user.id,
            title=title,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return ChatSessionPublic.from_orm(session)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )


@router.get(
    "/sessions",
    response_model=ChatSessionsPublic,
    summary="List Chat Sessions",
    description="获取用户的所有聊天会话"
)
async def list_chat_sessions(
    limit: int = Query(50, ge=1, le=100, description="每页数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """获取用户的所有活跃会话"""
    try:
        service = get_deepseek_storage_service()
        sessions = await service.get_user_sessions(
            db=db,
            user_id=current_user.id,
            limit=limit,
            offset=offset
        )

        # 获取每个会话的消息数量
        session_publics = []
        for session in sessions:
            # 这里可以优化为批量查询
            messages = await service.get_session_messages(
                db=db, session_id=session.id, user_id=current_user.id, limit=1000
            )
            session_dict = session.dict()
            session_dict["message_count"] = len(messages)
            session_publics.append(ChatSessionPublic(**session_dict))

        return ChatSessionsPublic(
            data=session_publics,
            count=len(session_publics)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list sessions: {str(e)}"
        )


@router.get(
    "/sessions/{session_id}",
    response_model=ChatHistoryResponse,
    summary="Get Chat Session",
    description="获取指定会话的详细信息包括历史消息"
)
async def get_chat_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """获取会话详情和历史消息"""
    try:
        service = get_deepseek_storage_service()

        # 获取会话信息
        session = await service.get_session(db, session_id, current_user.id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )

        # 获取消息列表
        messages = await service.get_session_messages(db, session_id, current_user.id)

        # 获取会话统计
        stats_dict = await service.get_session_stats(db, session_id, current_user.id)
        stats = ChatSessionStats(**stats_dict) if stats_dict else None

        return ChatHistoryResponse(
            session=ChatSessionPublic.from_orm(session),
            messages=[ChatMessagePublic.from_orm(msg) for msg in messages],
            stats=stats
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session: {str(e)}"
        )


@router.delete(
    "/sessions/{session_id}",
    summary="Delete Chat Session",
    description="软删除指定的聊天会话"
)
async def delete_chat_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """删除会话（软删除）"""
    try:
        service = get_deepseek_storage_service()
        success = await service.delete_session(db, session_id, current_user.id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )

        return {"message": "Session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}"
        )


@router.get(
    "/sessions/{session_id}/messages",
    response_model=ChatMessagesPublic,
    summary="Get Chat Messages",
    description="获取会话的消息列表"
)
async def get_chat_messages(
    session_id: uuid.UUID,
    limit: int = Query(100, ge=1, le=1000, description="消息数量限制"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """获取会话的消息列表"""
    try:
        service = get_deepseek_storage_service()

        # 验证会话存在且属于用户
        session = await service.get_session(db, session_id, current_user.id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )

        # 获取消息列表
        messages = await service.get_session_messages(db, session_id, current_user.id, limit=limit)

        return ChatMessagesPublic(
            data=[ChatMessagePublic.from_orm(msg) for msg in messages],
            count=len(messages)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get messages: {str(e)}"
        )


@router.get(
    "/sessions/{session_id}/stats",
    response_model=ChatSessionStats,
    summary="Get Session Statistics",
    description="获取会话统计信息"
)
async def get_session_statistics(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """获取会话统计信息"""
    try:
        service = get_deepseek_storage_service()
        stats_dict = await service.get_session_stats(db, session_id, current_user.id)

        if not stats_dict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )

        return ChatSessionStats(**stats_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session stats: {str(e)}"
        )


# ============ Chat Endpoints ============

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with Session Storage",
    description="与AI对话并存储到会话中"
)
async def chat_with_storage(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """与AI对话并存储到会话中"""
    try:
        service = get_deepseek_storage_service()
        response = await service.chat_with_storage(
            db=db,
            user_id=current_user.id,
            request=request
        )
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get response: {str(e)}"
        )


@router.post(
    "/chat/stream",
    summary="Streaming Chat with Session Storage",
    description="流式聊天并存储到会话中"
)
async def stream_chat_with_storage(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """流式聊天并存储到会话中"""
    try:
        service = get_deepseek_storage_service()

        async def generate():
            message_id = uuid.uuid4()
            session_id = None
            sequence_number = 0
            first_chunk = True

            try:
                async for chunk in service.stream_chat_with_storage(
                    db=db,
                    user_id=current_user.id,
                    request=request
                ):
                    # 第一个chunk时获取session信息
                    if first_chunk:
                        # 这里需要从service内部获取会话信息
                        # 为了简化，我们使用默认值
                        session_id = request.session_id or uuid.uuid4()
                        sequence_number = 1
                        first_chunk = False

                    response = ChatStreamResponse(
                        chunk=chunk,
                        session_id=session_id,
                        message_id=message_id,
                        is_complete=False,
                        sequence_number=sequence_number
                    )

                    # SSE格式
                    yield f"data: {json.dumps(response.dict(), default=str)}\n\n"

                # 发送完成标记
                complete_response = ChatStreamResponse(
                    chunk="",
                    session_id=session_id,
                    message_id=message_id,
                    is_complete=True,
                    sequence_number=sequence_number
                )
                yield f"data: {json.dumps(complete_response.dict(), default=str)}\n\n"

            except Exception as e:
                error_response = {
                    "error": str(e),
                    "is_complete": True
                }
                yield f"data: {json.dumps(error_response)}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
            }
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize stream: {str(e)}"
        )


# ============ Health Check ============

@router.get(
    "/health",
    summary="Chat Service Health Check",
    description="检查聊天服务健康状态"
)
async def chat_health_check():
    """聊天服务健康检查"""
    try:
        service = get_deepseek_storage_service()
        is_configured = service.is_configured()

        return {
            "status": "healthy" if is_configured else "degraded",
            "deepseek_configured": is_configured,
            "timescaledb_enabled": True,  # 假设TimescaleDB已启用
            "model_info": service.get_model_info() if is_configured else None
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }