"""
用户相关的所有模型
"""
import uuid
from typing import TYPE_CHECKING

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .item import Item


# ============================================
# 共享属性
# ============================================
class UserBase(SQLModel):
    """用户基础属性"""
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# ============================================
# API 请求模型
# ============================================
class UserCreate(UserBase):
    """创建用户时接收的属性"""
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    """用户注册时接收的属性"""
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserUpdate(UserBase):
    """更新用户时接收的属性（所有字段可选）"""
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    """用户自己更新个人信息时接收的属性"""
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    """更新密码时接收的属性"""
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# ============================================
# 数据库模型
# ============================================
class User(UserBase, table=True):
    """用户数据库模型"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# ============================================
# API 响应模型
# ============================================
class UserPublic(UserBase):
    """返回给客户端的用户信息"""
    id: uuid.UUID


class UsersPublic(SQLModel):
    """返回用户列表"""
    data: list[UserPublic]
    count: int
