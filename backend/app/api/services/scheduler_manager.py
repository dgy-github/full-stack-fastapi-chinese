"""
定时任务管理器
负责管理和执行定时任务，如缓存预热刷新
"""
import asyncio
import logging
from datetime import datetime, time
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
from enum import Enum
import threading
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class TaskStatus(Enum):
    """任务状态枚举"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class ScheduledTask:
    """定时任务数据类"""
    id: str
    name: str
    func: Callable
    interval_hours: int = 24  # 默认24小时执行一次
    enabled: bool = True
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    status: TaskStatus = TaskStatus.PENDING
    error_count: int = 0
    max_retries: int = 3
    timeout_seconds: int = 3600  # 1小时超时
    metadata: Dict[str, Any] = field(default_factory=dict)

class SchedulerManager:
    """定时任务管理器"""

    def __init__(self):
        self.tasks: Dict[str, ScheduledTask] = {}
        self.running = False
        self.scheduler_thread: Optional[threading.Thread] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self._shutdown_event = threading.Event()

    def add_task(
        self,
        task_id: str,
        name: str,
        func: Callable,
        interval_hours: int = 24,
        enabled: bool = True,
        max_retries: int = 3,
        timeout_seconds: int = 3600,
        **metadata
    ) -> bool:
        """添加定时任务"""
        try:
            if task_id in self.tasks:
                logger.warning(f"Task {task_id} already exists, updating...")

            task = ScheduledTask(
                id=task_id,
                name=name,
                func=func,
                interval_hours=interval_hours,
                enabled=enabled,
                max_retries=max_retries,
                timeout_seconds=timeout_seconds,
                metadata=metadata,
                next_run=datetime.now()
            )

            self.tasks[task_id] = task
            logger.info(f"Added scheduled task: {name} (ID: {task_id})")
            return True

        except Exception as e:
            logger.error(f"Failed to add task {task_id}: {e}")
            return False

    def remove_task(self, task_id: str) -> bool:
        """移除定时任务"""
        if task_id in self.tasks:
            del self.tasks[task_id]
            logger.info(f"Removed task: {task_id}")
            return True
        return False

    def enable_task(self, task_id: str) -> bool:
        """启用任务"""
        if task_id in self.tasks:
            self.tasks[task_id].enabled = True
            logger.info(f"Enabled task: {task_id}")
            return True
        return False

    def disable_task(self, task_id: str) -> bool:
        """禁用任务"""
        if task_id in self.tasks:
            self.tasks[task_id].enabled = False
            logger.info(f"Disabled task: {task_id}")
            return True
        return False

    def get_task_info(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务信息"""
        if task_id in self.tasks:
            task = self.tasks[task_id]
            return {
                "id": task.id,
                "name": task.name,
                "enabled": task.enabled,
                "interval_hours": task.interval_hours,
                "status": task.status.value,
                "last_run": task.last_run.isoformat() if task.last_run else None,
                "next_run": task.next_run.isoformat() if task.next_run else None,
                "error_count": task.error_count,
                "max_retries": task.max_retries,
                "timeout_seconds": task.timeout_seconds,
                "metadata": task.metadata
            }
        return None

    def get_all_tasks_info(self) -> List[Dict[str, Any]]:
        """获取所有任务信息"""
        return [self.get_task_info(task_id) for task_id in self.tasks.keys()]

    def calculate_next_run(self, task: ScheduledTask) -> datetime:
        """计算下次运行时间"""
        from datetime import timedelta

        if task.last_run:
            base_time = task.last_run.replace(
                minute=0,
                second=0,
                microsecond=0
            )
        else:
            base_time = datetime.now().replace(
                minute=0,
                second=0,
                microsecond=0
            )

        return base_time + timedelta(hours=task.interval_hours)

    async def execute_task(self, task: ScheduledTask) -> bool:
        """执行任务"""
        try:
            logger.info(f"Executing task: {task.name} (ID: {task.id})")
            task.status = TaskStatus.RUNNING
            task.last_run = datetime.now()

            # 设置超时
            try:
                if asyncio.iscoroutinefunction(task.func):
                    await asyncio.wait_for(task.func(), timeout=task.timeout_seconds)
                else:
                    # 在线程池中运行同步函数
                    await asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda: task.func()
                    )

                task.status = TaskStatus.COMPLETED
                task.error_count = 0
                logger.info(f"Task completed successfully: {task.name}")
                return True

            except asyncio.TimeoutError:
                task.status = TaskStatus.FAILED
                task.error_count += 1
                logger.error(f"Task timed out: {task.name}")
                return False

        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error_count += 1
            logger.error(f"Task failed: {task.name}, Error: {e}")
            return False
        finally:
            # 计算下次运行时间
            from datetime import timedelta
            next_run_time = datetime.now().replace(
                minute=0,
                second=0,
                microsecond=0
            ) + timedelta(hours=task.interval_hours)
            task.next_run = next_run_time

    async def _scheduler_loop(self):
        """调度器主循环"""
        logger.info("Scheduler started")

        while self.running and not self._shutdown_event.is_set():
            try:
                current_time = datetime.now()

                for task in self.tasks.values():
                    if (task.enabled and
                        task.status != TaskStatus.RUNNING and
                        task.next_run and
                        current_time >= task.next_run and
                        task.error_count < task.max_retries):

                        # 在后台执行任务，不阻塞调度器
                        asyncio.create_task(self.execute_task(task))

                # 每分钟检查一次
                await asyncio.sleep(60)

            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                await asyncio.sleep(60)

        logger.info("Scheduler stopped")

    def start(self):
        """启动调度器"""
        if self.running:
            logger.warning("Scheduler is already running")
            return

        self.running = True
        self._shutdown_event.clear()

        def run_scheduler():
            """在新线程中运行事件循环和调度器"""
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)

            try:
                self.loop.run_until_complete(self._scheduler_loop())
            except Exception as e:
                logger.error(f"Scheduler thread error: {e}")
            finally:
                self.loop.close()

        self.scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
        self.scheduler_thread.start()
        logger.info("Scheduler thread started")

    def stop(self):
        """停止调度器"""
        if not self.running:
            return

        logger.info("Stopping scheduler...")
        self.running = False
        self._shutdown_event.set()

        if self.scheduler_thread and self.scheduler_thread.is_alive():
            self.scheduler_thread.join(timeout=10)

        if self.loop and not self.loop.is_closed():
            self.loop.call_soon_threadsafe(self.loop.stop)

        logger.info("Scheduler stopped")

    def run_task_now(self, task_id: str) -> bool:
        """立即运行指定任务"""
        if task_id not in self.tasks:
            return False

        task = self.tasks[task_id]
        if not task.enabled:
            return False

        # 在后台任务中执行
        if self.loop and not self.loop.is_closed():
            asyncio.run_coroutine_threadsafe(
                self.execute_task(task),
                self.loop
            )
            return True

        return False

# 全局调度器实例
scheduler_manager = SchedulerManager()

@asynccontextmanager
async def lifespan_manager(app):
    """应用生命周期管理器"""
    # 启动时调用
    scheduler_manager.start()
    yield
    # 关闭时调用
    scheduler_manager.stop()