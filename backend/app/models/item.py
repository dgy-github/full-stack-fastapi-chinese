"""
物品相关的所有模型
"""
import uuid
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User


# ============================================
# 共享属性
# ============================================
class ItemBase(SQLModel):
    """物品基础属性"""
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# ============================================
# API 请求模型
# ============================================
class ItemCreate(ItemBase):
    """创建物品时接收的属性"""
    pass


class ItemUpdate(ItemBase):
    """更新物品时接收的属性（所有字段可选）"""
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# ============================================
# 数据库模型
# ============================================
class Item(ItemBase, table=True):
    """物品数据库模型"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: Optional["User"] = Relationship(back_populates="items")


# ============================================
# API 响应模型
# ============================================
class ItemPublic(ItemBase):
    """返回给客户端的物品信息"""
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    """返回物品列表"""
    data: list[ItemPublic]
    count: int
