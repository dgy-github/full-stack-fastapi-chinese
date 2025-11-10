"""
基础模型和共享配置
"""
from sqlmodel import SQLModel


# 如果有共享的基础配置，可以在这里定义
class BaseModel(SQLModel):
    """所有模型的基类"""
    pass


# 通用消息模型
class Message(SQLModel):
    """通用消息响应"""
    message: str
