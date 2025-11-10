"""
认证相关的所有模型
"""
from sqlmodel import Field, SQLModel


# ============================================
# Token 相关模型
# ============================================
class Token(SQLModel):
    """JWT token 响应"""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    """JWT token 内容"""
    sub: str | None = None


class NewPassword(SQLModel):
    """重置密码"""
    token: str
    new_password: str = Field(min_length=8, max_length=128)
