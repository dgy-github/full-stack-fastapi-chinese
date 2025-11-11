from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils, langchain, chat
from app.core.config import settings

api_router = APIRouter()

# ✅ 给每个路由都添加 tags
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(langchain.router, prefix="/langchain", tags=["langchain"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router, prefix="/private", tags=["private"])
