"""
DeepSeek AI 会话相关的所有模型

使用 TimescaleDB 存储时序对话数据，支持会话管理和历史记录
"""
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User


# ============================================
# 共享属性
# ============================================
class ChatSessionBase(SQLModel):
    """会话基础属性"""
    title: str = Field(max_length=255, description="会话标题")
    system_prompt: Optional[str] = Field(default=None, description="系统提示词")
    model_name: str = Field(max_length=100, description="使用的模型名称")
    temperature: float = Field(default=0.7, description="温度参数")
    max_tokens: int = Field(default=2000, description="最大令牌数")
    is_active: bool = Field(default=True, description="会话是否活跃")


class ChatMessageBase(SQLModel):
    """消息基础属性"""
    role: str = Field(description="消息角色: user/assistant/system")
    content: str = Field(description="消息内容")
    token_count: Optional[int] = Field(default=None, description="消息令牌数")
    finish_reason: Optional[str] = Field(default=None, description="完成原因")


# ============================================
# API 请求模型
# ============================================
class ChatSessionCreate(ChatSessionBase):
    """创建会话时接收的属性"""
    user_id: uuid.UUID = Field(foreign_key="user.id", description="用户ID")


class ChatMessageCreate(ChatMessageBase):
    """创建消息时接收的属性"""
    session_id: uuid.UUID = Field(foreign_key="chatsession.id", description="会话ID")


class ChatSessionUpdate(SQLModel):
    """更新会话时接收的属性（所有字段可选）"""
    title: Optional[str] = Field(default=None, max_length=255)
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    is_active: Optional[bool] = None


# ============================================
# 数据库模型
# ============================================
class ChatSession(ChatSessionBase, table=True):
    """会话数据库模型 - TimescaleDB 超表"""
    __tablename__ = "chatsession"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, description="会话ID")
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True, description="用户ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")

    # 关系
    user: Optional["User"] = Relationship(back_populates="chat_sessions")
    messages: list["ChatMessage"] = Relationship(back_populates="session", cascade_delete=True)

    def model_dump(self, **kwargs):
        """兼容性方法 - 替代 dict()"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "title": self.title,
            "system_prompt": self.system_prompt,
            "model_name": self.model_name,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }


class ChatMessage(ChatMessageBase, table=True):
    """消息数据库模型 - TimescaleDB 超表"""
    __tablename__ = "chatmessage"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, description="消息ID")
    session_id: uuid.UUID = Field(foreign_key="chatsession.id", index=True, description="会话ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    sequence_number: int = Field(description="消息在会话中的序号")

    # 元数据
    model_used: Optional[str] = Field(default=None, max_length=100, description="使用的模型")
    response_time_ms: Optional[int] = Field(default=None, description="响应时间(毫秒)")

    # 关系
    session: Optional[ChatSession] = Relationship(back_populates="messages")

    def model_dump(self, **kwargs):
        """兼容性方法 - 替代 dict()"""
        return {
            "id": str(self.id),
            "session_id": str(self.session_id),
            "role": self.role,
            "content": self.content,
            "token_count": self.token_count,
            "finish_reason": self.finish_reason,
            "created_at": self.created_at,
            "sequence_number": self.sequence_number,
            "model_used": self.model_used,
            "response_time_ms": self.response_time_ms
        }


# ============================================
# API 响应模型
# ============================================
class ChatSessionPublic(ChatSessionBase):
    """返回给客户端的会话信息"""
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = Field(default=0, description="消息数量")


class ChatMessagePublic(ChatMessageBase):
    """返回给客户端的消息信息"""
    id: uuid.UUID
    session_id: uuid.UUID
    created_at: datetime
    sequence_number: int
    model_used: Optional[str] = None
    response_time_ms: Optional[int] = None


class ChatSessionsPublic(SQLModel):
    """返回会话列表"""
    data: list[ChatSessionPublic]
    count: int


class ChatMessagesPublic(SQLModel):
    """返回消息列表"""
    data: list[ChatMessagePublic]
    count: int


# ============================================
# 聊天请求响应模型
# ============================================
class ChatRequest(SQLModel):
    """聊天请求模型"""
    message: str = Field(min_length=1, max_length=10000, description="用户消息")
    session_id: Optional[uuid.UUID] = Field(default=None, description="会话ID（为空则创建新会话）")
    title: Optional[str] = Field(default=None, max_length=255, description="新会话标题")
    system_prompt: Optional[str] = Field(default=None, description="系统提示词")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0, description="温度参数")
    max_tokens: Optional[int] = Field(default=2000, ge=1, le=8000, description="最大令牌数")


class ChatResponse(SQLModel):
    """聊天响应模型"""
    message: str = Field(description="AI回复内容")
    session_id: uuid.UUID = Field(description="会话ID")
    message_id: uuid.UUID = Field(description="消息ID")
    sequence_number: int = Field(description="消息序号")
    created_at: datetime = Field(description="创建时间")
    response_time_ms: Optional[int] = Field(default=None, description="响应时间(毫秒)")


class ChatStreamResponse(SQLModel):
    """流式聊天响应模型"""
    chunk: str = Field(description="文本片段")
    session_id: uuid.UUID = Field(description="会话ID")
    message_id: uuid.UUID = Field(description="消息ID")
    is_complete: bool = Field(default=False, description="是否完成")
    sequence_number: int = Field(description="消息序号")


# ============================================
# 会话统计模型
# ============================================
class ChatSessionStats(SQLModel):
    """会话统计信息"""
    session_id: uuid.UUID
    total_messages: int
    user_messages: int
    assistant_messages: int
    total_tokens: Optional[int] = None
    first_message_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None
    average_response_time_ms: Optional[float] = None


class ChatHistoryResponse(SQLModel):
    """聊天历史响应"""
    session: ChatSessionPublic
    messages: list[ChatMessagePublic]
    stats: ChatSessionStats