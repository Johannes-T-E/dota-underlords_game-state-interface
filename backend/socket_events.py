"""Socket.IO client events; outbound game events are emitted by game_state."""

from backend.infrastructure.realtime import socketio
from backend.domain.game_state import connected_clients, emit_realtime_update, match_state


@socketio.event
async def connect(sid, environ, auth):
    connected_clients.add(sid)
    await socketio.emit('connection_response', {'status': 'connected'}, to=sid)
    if match_state.match_id:
        emit_realtime_update()


@socketio.event
async def disconnect(sid):
    connected_clients.discard(sid)


@socketio.event
async def test_connection(sid):
    await socketio.emit('test_response', {'status': 'ok', 'message': 'WebSocket is working'}, to=sid)
