"""
LangChain related API routes
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.config import settings
from app.api.services import get_deepseek_service
from app.api.services.translation_cache_warmer import warmup_translation_cache, get_cache_warm_status
from app.api.services.redis_cache import get_redis_cache
from app.api.services.cache_scheduler import cache_scheduler_service
from app.api.services.scheduler_manager import scheduler_manager

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


class TranslationRequest(BaseModel):
    """Translation request model"""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to translate")
    source_language: str = Field("auto", description="Source language code (e.g., 'en', 'zh', 'auto')")
    target_language: str = Field(..., description="Target language code (e.g., 'en', 'zh')")
    context: str | None = Field(None, max_length=500, description="Optional context for better translation")


class TranslationResponse(BaseModel):
    """Translation response model"""
    translated_text: str = Field(..., description="Translated text")
    source_language: str = Field(..., description="Detected or provided source language")
    target_language: str = Field(..., description="Target language")
    model: str = Field(..., description="Model name used")


class BatchTranslationRequest(BaseModel):
    """Batch translation request model"""
    texts: list[str] = Field(..., min_items=1, max_items=100, description="List of texts to translate")
    source_language: str = Field("auto", description="Source language code (e.g., 'en', 'zh', 'auto')")
    target_language: str = Field(..., description="Target language code (e.g., 'en', 'zh')")
    context: str | None = Field(None, max_length=500, description="Optional context for better translation")


class BatchTranslationResponse(BaseModel):
    """Batch translation response model"""
    translations: list[dict] = Field(..., description="List of translated texts with metadata")
    source_language: str = Field(..., description="Detected or provided source language")
    target_language: str = Field(..., description="Target language")
    model: str = Field(..., description="Model name used")
    total_count: int = Field(..., description="Total number of texts translated")
    success_count: int = Field(..., description="Number of successful translations")


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


@router.post(
    "/translate",
    response_model=TranslationResponse,
    summary="AI Translation",
    description="Translate text using DeepSeek AI with intelligent language detection"
)
async def translate_text(request: TranslationRequest):
    """
    Translate text using DeepSeek AI

    - **text**: Text to translate (required)
    - **source_language**: Source language code (optional, default 'auto' for detection)
    - **target_language**: Target language code (required)
    - **context**: Optional context for better translation (optional)
    """
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DeepSeek API key not configured"
        )

    try:
        # 尝试从Redis缓存获取翻译
        redis_cache = await get_redis_cache()
        cached_translation = await redis_cache.get_translation(request.text, request.target_language)

        if cached_translation:
            print(f"🎯 Redis缓存命中: {request.text} -> {cached_translation}")
            return TranslationResponse(
                translated_text=cached_translation,
                source_language=request.source_language if request.source_language != 'auto' else 'detected',
                target_language=request.target_language,
                model=f"{settings.DEEPSEEK_MODEL_NAME} (cached)"
            )

        print(f"🔄 缓存未命中，调用AI翻译: {request.text}")
        service = get_deepseek_service()

        # 构建翻译提示词
        language_names = {
            'en': 'English',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'fr': 'French',
            'de': 'German',
            'es': 'Spanish',
            'ru': 'Russian',
            'ar': 'Arabic',
            'pt': 'Portuguese',
            'it': 'Italian',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'da': 'Danish',
            'no': 'Norwegian',
            'fi': 'Finnish',
            'pl': 'Polish',
            'tr': 'Turkish',
            'hi': 'Hindi',
            'th': 'Thai',
            'vi': 'Vietnamese'
        }

        target_lang_name = language_names.get(request.target_language, request.target_language)

        if request.source_language == 'auto':
            system_prompt = f"""You are a professional translator. Your task is to:
1. Detect the source language of the text
2. Translate the text accurately to {target_lang_name}
3. Preserve the original meaning, tone, and context
4. Return ONLY the translated text, no explanations

Format your response as: [DETECTED_LANGUAGE_CODE] TRANSLATED_TEXT
For example: [en] Hello, how are you?"""
        else:
            source_lang_name = language_names.get(request.source_language, request.source_language)
            system_prompt = f"""You are a professional translator. Translate the following text from {source_lang_name} to {target_lang_name}.
Preserve the original meaning, tone, and context.
Return ONLY the translated text, no explanations or extra text."""

        # 构建用户消息
        context_text = f"\nContext: {request.context}" if request.context else ""
        user_message = f"Text to translate:{context_text}\n\n{request.text}"

        # 调用DeepSeek API
        response = await service.chat(
            message=user_message,
            system_prompt=system_prompt,
            temperature=0.3,  # 较低的温度确保翻译准确性
            max_tokens=min(4000, len(request.text) * 2)  # 合理的token限制
        )

        # 解析响应
        response = response.strip()

        if request.source_language == 'auto' and '[' in response and ']' in response:
            # 解析语言检测和翻译结果
            try:
                lang_end = response.index(']')
                detected_lang = response[1:lang_end].strip()
                translated_text = response[lang_end + 1:].strip()
                source_lang = detected_lang
            except:
                # 解析失败，使用默认值
                source_lang = 'unknown'
                translated_text = response
        else:
            source_lang = request.source_language if request.source_language != 'auto' else 'detected'
            translated_text = response

        # 缓存翻译结果
        await redis_cache.set_translation(request.text, request.target_language, translated_text)
        print(f"💾 翻译已缓存: {request.text} -> {translated_text}")

        return TranslationResponse(
            translated_text=translated_text,
            source_language=source_lang,
            target_language=request.target_language,
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
            detail=f"Translation failed: {str(e)}"
        )


@router.post(
    "/translate/batch",
    response_model=BatchTranslationResponse,
    summary="Batch AI Translation",
    description="Translate multiple texts at once using DeepSeek AI for better performance"
)
async def translate_batch(request: BatchTranslationRequest):
    """Batch translation endpoint for better performance"""
    try:
        service = get_deepseek_service()

        # Prepare context
        context_text = f"\nContext: {request.context}" if request.context else ""

        # Create batch prompt for all texts
        texts_input = "\n".join([f"{i+1}. {text}" for i, text in enumerate(request.texts)])

        system_prompt = f"""You are a professional translator. Translate the following numbered list of texts from {request.source_language} to {request.target_language}.
{context_text}

Requirements:
1. Translate each text accurately while preserving the original meaning and tone
2. Consider the context provided for better translation quality
3. Maintain UI text style - keep it concise and natural
4. Handle placeholders like {{name}} or {{count}} properly - don't translate them
5. Return the results in the same numbered format
6. If a text contains only placeholders or special characters, keep it as is

Example format:
1. [translated text 1]
2. [translated text 2]
3. [translated text 3]

Return ONLY the numbered translations, no explanations."""

        user_message = f"Texts to translate:{context_text}\n\n{texts_input}"

        # Call AI service
        response = await service.chat(
            message=user_message,
            system_prompt=system_prompt,
            temperature=0.3,
            max_tokens=2000
        )

        # Parse batch response
        translations = []
        lines = response.strip().split('\n')
        detected_language = request.source_language if request.source_language != 'auto' else 'detected'

        for i, text in enumerate(request.texts):
            translated_text = text  # Default to original text

            if i < len(lines):
                line = lines[i].strip()
                # Extract text after numbering (e.g., "1. " -> "")
                if '. ' in line:
                    translated_text = line.split('. ', 1)[1]
                elif line and not line.replace('.', '').isdigit():
                    translated_text = line
            else:
                # Fallback: try to find the text in the response
                if f"{i+1}." in response:
                    parts = response.split(f"{i+1}.")
                    if len(parts) > 1:
                        next_part = parts[1].split('\n')[0] if '\n' in parts[1] else parts[1]
                        translated_text = next_part.strip()

            translations.append({
                "original": text,
                "translated": translated_text,
                "index": i
            })

        return BatchTranslationResponse(
            translations=translations,
            source_language=detected_language,
            target_language=request.target_language,
            model=settings.DEEPSEEK_MODEL_NAME,
            total_count=len(request.texts),
            success_count=len([t for t in translations if t["translated"] != t["original"]])
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Service configuration error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch translation failed: {str(e)}"
        )


# ============ 缓存管理端点 ============

class CacheWarmupRequest(BaseModel):
    """缓存预热请求"""
    force: bool = Field(False, description="是否强制重新缓存")


class CacheWarmupResponse(BaseModel):
    """缓存预热响应"""
    success: bool = Field(..., description="预热是否成功")
    stats: dict = Field(..., description="预热统计信息")
    message: str = Field(..., description="响应消息")


class CacheStatusResponse(BaseModel):
    """缓存状态响应"""
    redis_connected: bool = Field(..., description="Redis连接状态")
    cache_stats: dict = Field(..., description="缓存统计信息")
    core_texts_count: int = Field(..., description="核心文本数量")
    target_languages: int = Field(..., description="目标语言数量")


@router.post(
    "/cache/warmup",
    response_model=CacheWarmupResponse,
    summary="预热翻译缓存",
    description="预热AI翻译缓存到Redis，提升后续翻译性能"
)
async def warmup_cache(request: CacheWarmupRequest):
    """预热翻译缓存"""
    try:
        stats = await warmup_translation_cache(force=request.force)

        success = stats.get("errors", 0) == 0 and stats.get("languages_processed", 0) > 0

        if success:
            message = f"缓存预热成功！处理了 {stats.get('languages_processed', 0)} 种语言，共 {stats.get('total_translations', 0)} 个翻译"
        else:
            message = f"缓存预热部分失败。处理了 {stats.get('languages_processed', 0)} 种语言，{stats.get('errors', 0)} 个错误"

        return CacheWarmupResponse(
            success=success,
            stats=stats,
            message=message
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"缓存预热失败: {str(e)}"
        )


@router.get(
    "/cache/status",
    response_model=CacheStatusResponse,
    summary="获取缓存状态",
    description="获取Redis翻译缓存的状态和统计信息"
)
async def get_cache_status():
    """获取缓存状态"""
    try:
        status = await get_cache_warm_status()
        return CacheStatusResponse(**status)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取缓存状态失败: {str(e)}"
        )


@router.delete(
    "/cache/clear",
    summary="清除缓存",
    description="清除翻译缓存"
)
async def clear_cache():
    """清除翻译缓存"""
    try:
        redis_cache = await get_redis_cache()
        success = await redis_cache.clear_cache("translation:*")

        if success:
            return {"message": "缓存清除成功", "success": True}
        else:
            return {"message": "缓存清除失败", "success": False}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"清除缓存失败: {str(e)}"
        )


# ============ 定时任务管理端点 ============

class TaskCreateRequest(BaseModel):
    """创建定时任务请求"""
    task_id: str = Field(..., description="任务ID")
    name: str = Field(..., description="任务名称")
    interval_hours: int = Field(24, ge=1, le=168, description="执行间隔(小时)")
    task_type: str = Field("cache_refresh", description="任务类型")
    enabled: bool = Field(True, description="是否启用")
    max_retries: int = Field(3, ge=0, le=10, description="最大重试次数")
    timeout_seconds: int = Field(3600, ge=60, le=7200, description="超时时间(秒)")


class TaskResponse(BaseModel):
    """任务响应"""
    id: str = Field(..., description="任务ID")
    name: str = Field(..., description="任务名称")
    enabled: bool = Field(..., description="是否启用")
    interval_hours: int = Field(..., description="执行间隔(小时)")
    status: str = Field(..., description="任务状态")
    last_run: str | None = Field(None, description="上次运行时间")
    next_run: str | None = Field(None, description="下次运行时间")
    error_count: int = Field(..., description="错误次数")
    max_retries: int = Field(..., description="最大重试次数")


class SchedulerStatusResponse(BaseModel):
    """调度器状态响应"""
    scheduler_running: bool = Field(..., description="调度器是否运行")
    total_tasks: int = Field(..., description="总任务数")
    enabled_tasks: int = Field(..., description="启用的任务数")
    tasks: list[TaskResponse] = Field(..., description="任务列表")


@router.get(
    "/scheduler/status",
    response_model=SchedulerStatusResponse,
    summary="获取调度器状态",
    description="获取定时任务调度器的状态和所有任务信息"
)
async def get_scheduler_status():
    """获取调度器状态"""
    try:
        status = cache_scheduler_service.get_scheduler_status()

        tasks = []
        for task_info in status["tasks_info"]:
            tasks.append(TaskResponse(
                id=task_info["id"],
                name=task_info["name"],
                enabled=task_info["enabled"],
                interval_hours=task_info["interval_hours"],
                status=task_info["status"],
                last_run=task_info["last_run"],
                next_run=task_info["next_run"],
                error_count=task_info["error_count"],
                max_retries=task_info["max_retries"]
            ))

        return SchedulerStatusResponse(
            scheduler_running=status["scheduler_running"],
            total_tasks=status["total_tasks"],
            enabled_tasks=status["enabled_tasks"],
            tasks=tasks
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取调度器状态失败: {str(e)}"
        )


@router.post(
    "/scheduler/tasks",
    summary="创建定时任务",
    description="创建新的定时任务"
)
async def create_scheduled_task(request: TaskCreateRequest):
    """创建定时任务"""
    try:
        success = cache_scheduler_service.add_custom_task(
            task_id=request.task_id,
            name=request.name,
            interval_hours=request.interval_hours,
            task_type=request.task_type,
            enabled=request.enabled,
            max_retries=request.max_retries,
            timeout_seconds=request.timeout_seconds
        )

        if success:
            return {"message": f"定时任务 '{request.name}' 创建成功", "success": True}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="创建定时任务失败"
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建定时任务失败: {str(e)}"
        )


@router.delete(
    "/scheduler/tasks/{task_id}",
    summary="删除定时任务",
    description="删除指定的定时任务"
)
async def delete_scheduled_task(task_id: str):
    """删除定时任务"""
    try:
        success = scheduler_manager.remove_task(task_id)

        if success:
            return {"message": f"定时任务 '{task_id}' 删除成功", "success": True}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"定时任务 '{task_id}' 不存在"
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除定时任务失败: {str(e)}"
        )


@router.post(
    "/scheduler/tasks/{task_id}/enable",
    summary="启用定时任务",
    description="启用指定的定时任务"
)
async def enable_scheduled_task(task_id: str):
    """启用定时任务"""
    try:
        success = scheduler_manager.enable_task(task_id)

        if success:
            return {"message": f"定时任务 '{task_id}' 已启用", "success": True}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"定时任务 '{task_id}' 不存在"
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"启用定时任务失败: {str(e)}"
        )


@router.post(
    "/scheduler/tasks/{task_id}/disable",
    summary="禁用定时任务",
    description="禁用指定的定时任务"
)
async def disable_scheduled_task(task_id: str):
    """禁用定时任务"""
    try:
        success = scheduler_manager.disable_task(task_id)

        if success:
            return {"message": f"定时任务 '{task_id}' 已禁用", "success": True}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"定时任务 '{task_id}' 不存在"
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"禁用定时任务失败: {str(e)}"
        )


@router.post(
    "/scheduler/tasks/{task_id}/run",
    summary="立即执行任务",
    description="立即执行指定的定时任务"
)
async def run_task_now(task_id: str):
    """立即执行任务"""
    try:
        success = scheduler_manager.run_task_now(task_id)

        if success:
            return {"message": f"任务 '{task_id}' 已开始执行", "success": True}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"任务 '{task_id}' 不存在或未启用"
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"执行任务失败: {str(e)}"
        )


@router.get(
    "/scheduler/tasks/{task_id}",
    summary="获取任务信息",
    description="获取指定定时任务的详细信息"
)
async def get_task_info(task_id: str):
    """获取任务信息"""
    try:
        task_info = scheduler_manager.get_task_info(task_id)

        if task_info:
            return task_info
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"任务 '{task_id}' 不存在"
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取任务信息失败: {str(e)}"
        )