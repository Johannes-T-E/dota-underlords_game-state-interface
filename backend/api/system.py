"""Service status and health endpoints."""

from datetime import datetime

from fastapi import APIRouter

from backend.config import GSI_PORT
from backend.domain.game_state import connected_clients, db, db_write_queue, match_state, stats

router = APIRouter(prefix='/api', tags=['system'])


@router.get('/status')
def get_status():
    return {
        'active_match': {
            'match_id': match_state.match_id,
            'started_at': match_state.match_start.isoformat() if match_state.match_start else None,
            'player_count': len(match_state.latest_processed_public_player_states),
        } if match_state.match_id else None,
        'total_updates': stats['total_updates'],
        'match_count': stats['match_count'],
        'last_update': stats['last_update'].isoformat() if stats['last_update'] else None,
    }


@router.get('/health')
def health_check():
    try:
        db.conn.execute('SELECT 1')
        db_status = 'healthy'
    except Exception as exc:
        db_status = f'unhealthy: {exc}'

    return {
        'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
        'timestamp': datetime.now().isoformat(),
        'database': db_status,
        'queue_size': db_write_queue.qsize(),
        'connected_clients': len(connected_clients),
        'active_match': match_state.match_id is not None,
        'gsi_endpoint': f'http://localhost:{GSI_PORT}/upload',
    }
