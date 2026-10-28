"""ASGI application: FastAPI, Socket.IO and worker lifecycle."""

import asyncio
import logging
import threading
from contextlib import asynccontextmanager

import socketio as socketio_library
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import backend.socket_events  # noqa: F401 - register Socket.IO handlers
from backend.api import router
from backend.config import GSI_HOST, GSI_PORT
from backend.domain.game_state import db, db_write_queue
from backend.service.gsi_handler import db_writer_worker
from backend.infrastructure.realtime import set_event_loop, socketio
from backend.startup import auto_abandon_stale_in_progress_matches


@asynccontextmanager
async def lifespan(app: FastAPI):
    set_event_loop(asyncio.get_running_loop())
    auto_abandon_stale_in_progress_matches()
    db_thread = threading.Thread(target=db_writer_worker, daemon=True)
    db_thread.start()
    try:
        yield
    finally:
        db_write_queue.put(None)
        await asyncio.to_thread(db_thread.join)
        set_event_loop(None)
        db.close()


api = FastAPI(lifespan=lifespan)


@api.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    logging.exception('Request failed: %s %s', request.method, request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={'status': 'error', 'message': str(exc)})


api.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers=['*'],
)
api.include_router(router)
app = socketio_library.ASGIApp(socketio, other_asgi_app=api, socketio_path='socket.io')


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host=GSI_HOST, port=GSI_PORT)
