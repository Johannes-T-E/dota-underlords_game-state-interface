"""Windows bench organization endpoint."""

from fastapi import APIRouter, Body

from backend.service.bench_organizer import BenchOrganizerError, organize_bench
from backend.domain.game_state import match_state
from backend.api.responses import error

router = APIRouter(prefix='/api', tags=['bench'])


@router.post('/organize_bench')
def organize_bench_endpoint(data: dict | None = Body(default=None)):
    data = data or {}
    if match_state.match_id is None:
        return error('No active match', 400)

    private_account_id = match_state.private_player_account_id
    if private_account_id is None:
        return error('Private player account is not resolved yet', 400)

    public_state = match_state.latest_processed_public_player_states.get(private_account_id)
    if not public_state:
        return error('Unable to find current player state', 404)

    try:
        result = organize_bench(
            public_state,
            dry_run=bool(data.get('dry_run', False)),
            desired_entindex_order=data.get('desired_entindex_order'),
            timing_scale=data.get('timing_scale', 1.0),
            bench_timings=data.get('bench_timings'),
        )
    except BenchOrganizerError as exc:
        return error(str(exc), 400)

    return {
        'status': 'success',
        'dry_run': bool(data.get('dry_run', False)),
        'moves_executed': result.get('moves_executed', 0),
        'diagnostics': result.get('diagnostics', {}),
    }
