"""
Models 包 - 统一导出所有模型

使用方式:
    from app.models import User, Item, UserCreate, ItemPublic
    # 或
    from app import models
    user = models.User(...)
"""

# 基础模型
from .base import BaseModel, Message

# 用户模型
from .user import (
    User,
    UserBase,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
    UpdatePassword,
)

# 物品模型
from .item import (
    Item,
    ItemBase,
    ItemCreate,
    ItemPublic,
    ItemsPublic,
    ItemUpdate,
)

# 认证模型
from .auth import (
    NewPassword,
    Token,
    TokenPayload,
)

# 定义 __all__ 以便于 IDE 自动补全和显式导出
__all__ = [
    # 基础
    "BaseModel",
    "Message",

    # 用户
    "User",
    "UserBase",
    "UserCreate",
    "UserPublic",
    "UserRegister",
    "UsersPublic",
    "UserUpdate",
    "UserUpdateMe",
    "UpdatePassword",

    # 物品
    "Item",
    "ItemBase",
    "ItemCreate",
    "ItemPublic",
    "ItemsPublic",
    "ItemUpdate",

    # 认证
    "NewPassword",
    "Token",
    "TokenPayload",
]
