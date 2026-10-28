"""Socket.IO server and thread-safe outgoing events from GSI workers."""

import asyncio

import socketio as socketio_library

from backend.config import DEBUG

socketio = socketio_library.AsyncServer(
    async_mode='asgi', cors_allowed_origins='*', logger=DEBUG, engineio_logger=DEBUG,
)
_loop: asyncio.AbstractEventLoop | None = None


def set_event_loop(loop: asyncio.AbstractEventLoop | None) -> None:
    global _loop
    _loop = loop


def emit_event(event: str, data: dict) -> None:
    """Schedule an event on the ASGI loop from a GSI/DB worker thread."""
    if _loop is not None and _loop.is_running():
        asyncio.run_coroutine_threadsafe(socketio.emit(event, data), _loop)
