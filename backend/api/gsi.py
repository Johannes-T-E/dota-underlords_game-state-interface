"""Game State Integration upload endpoint."""

import threading

from fastapi import APIRouter, Request

from backend.domain.game_state import data_lock, match_state
from backend.service.gsi_handler import process_gsi_data
from backend.api.responses import error

router = APIRouter(tags=['gsi'])


@router.post('/upload')
async def receive_gsi_data(request: Request):
    payload = await request.json()
    if not payload:
        return {'status': 'ok'}

    replay_header = request.headers.get('X-GSI-Replay', '').strip().lower()
    persist_to_db = replay_header not in ('1', 'true', 'yes')
    if not persist_to_db:
        with data_lock:
            # An emulated match sets match_id after the first packet; allow subsequent replay packets.
            if match_state.match_id is not None and not match_state.gsi_emulated:
                return error(
                    'Cannot start GSI replay while a live match is active in memory. Abandon the match first.',
                    409,
                )

    # GSI processing uses blocking SQLite; do not hold up the HTTP response or event loop.
    threading.Thread(target=process_gsi_data, args=(payload, persist_to_db), daemon=True).start()
    return {'status': 'ok'}
