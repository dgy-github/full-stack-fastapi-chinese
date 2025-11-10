"""
LangChain related API routes
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.config import settings
from app.api.services import get_deepseek_service

router = APIRouter()


# ============ Request/Response Models ============

class ChatRequest(BaseModel):
    """Chat request model"""
    message: str = Field(..., min_length=1, max_length=4000, description="User message content")
    system_prompt: str | None = Field(None, max_length=2000, description="Optional system prompt")
    temperature: float | None = Field(None, ge=0.0, le=2.0, description="Temperature parameter (0.0-2.0)")
    max_tokens: int | None = Field(None, ge=1, le=4000, description="Maximum tokens")
    stream: bool = Field(False, description="Use streaming response")


class ChatResponse(BaseModel):
    """Chat response model"""
    response: str = Field(..., description="AI response content")
    model: str = Field(..., description="Model name used")


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str = Field(..., description="Service status")
    deepseek_configured: bool = Field(..., description="DeepSeek configuration status")


class ModelInfoResponse(BaseModel):
    """Model information response"""
    model: str
    base_url: str
    configured: bool


# ============ API Endpoints ============

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Check LangChain and DeepSeek service status"
)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        deepseek_configured=bool(settings.DEEPSEEK_API_KEY)
    )


@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    summary="Get Model Info",
    description="Get current DeepSeek model configuration"
)
async def get_model_info():
    """Get model configuration information"""
    try:
        service = get_deepseek_service()
        info = service.get_model_info()
        return ModelInfoResponse(**info)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Service not configured: {str(e)}"
        )


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="AI Chat",
    description="Chat with DeepSeek AI, supports streaming and non-streaming responses"
)
async def chat(request: ChatRequest):
    """
    Chat with DeepSeek AI

    - **message**: User message content (required)
    - **system_prompt**: System prompt (optional)
    - **temperature**: Temperature parameter, controls randomness (optional, 0.0-2.0)
    - **max_tokens**: Maximum tokens (optional)
    - **stream**: Use streaming response (optional, default false)
    """
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DeepSeek API key not configured"
        )

    try:
        service = get_deepseek_service()

        # Streaming response
        if request.stream:
            async def generate():
                try:
                    async for chunk in service.stream_chat(
                            message=request.message,
                            system_prompt=request.system_prompt
                    ):
                        yield chunk
                except Exception as e:
                    yield f"\n\n[Error: {str(e)}]"

            return StreamingResponse(
                generate(),
                media_type="text/event-stream"
            )

        # Non-streaming response
        response = await service.chat(
            message=request.message,
            system_prompt=request.system_prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        return ChatResponse(
            response=response,
            model=settings.DEEPSEEK_MODEL_NAME
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Service configuration error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get response from DeepSeek: {str(e)}"
        )


@router.post(
    "/chat/stream",
    summary="Streaming AI Chat",
    description="Stream chat with DeepSeek AI, returns generated content in real-time"
)
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint

    Returns Server-Sent Events (SSE) format streaming response
    """
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DeepSeek API key not configured"
        )

    try:
        service = get_deepseek_service()

        async def generate():
            try:
                async for chunk in service.stream_chat(
                        message=request.message,
                        system_prompt=request.system_prompt
                ):
                    # SSE format
                    yield f"data: {chunk}\n\n"

                # Send completion marker
                yield "data: [DONE]\n\n"

            except Exception as e:
                yield f"data: [ERROR: {str(e)}]\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Service configuration error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize stream: {str(e)}"
        )