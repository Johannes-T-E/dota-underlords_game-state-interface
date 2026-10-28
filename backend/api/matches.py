"""Match history, live combat and change tracking endpoints."""

from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Query

from backend.domain.change_detector import change_detector
from backend.domain.game_state import abandon_match, db, db_write_queue, match_state
from backend.service.player_names import resolve_match_names
from backend.api.responses import error

router = APIRouter(prefix='/api', tags=['matches'])


def _snapshot_time(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            pass
    return None


def _latest_snapshot_time(match_id: str):
    try:
        snapshots = db.get_match_snapshots(match_id)
    except Exception as exc:
        print(f'[WARN] Failed to load snapshots for abandon timestamp ({match_id}): {exc}')
        return None

    latest_time = None
    latest_sequence = -1
    for snapshot in snapshots:
        timestamp = _snapshot_time(snapshot.get('timestamp'))
        sequence = int(snapshot.get('sequence_number') or 0)
        if timestamp and sequence > latest_sequence:
            latest_time = timestamp
            latest_sequence = sequence
    return latest_time


def _abandon_response(match_id: str, timestamp: datetime):
    return {
        'status': 'success',
        'match_id': match_id,
        'ended_at': timestamp.isoformat(),
        'message': 'Match abandoned successfully',
    }


@router.post('/abandon_match')
def abandon_active_match():
    match_id = match_state.match_id
    if match_id is None:
        return error('No active match', 400, legacy=True)

    timestamp = _latest_snapshot_time(match_id) or datetime.now()
    abandon_match(match_id, timestamp, reason='Manual abandonment')
    return _abandon_response(match_id, timestamp)


@router.post('/matches/{match_id}/abandon')
def abandon_specific_match(match_id: str):
    match = next((m for m in db.get_all_matches() if m.get('match_id') == match_id), None)
    if match is None:
        return error('Match not found', 404, legacy=True)
    if match.get('ended_at'):
        return error('Match is already complete', 400, legacy=True)

    timestamp = _latest_snapshot_time(match_id) or datetime.now()
    if match_state.match_id == match_id:
        abandon_match(match_id, timestamp, reason='Manual abandonment')
    else:
        db_write_queue.put(('update_match_end', match_id, timestamp))
    return _abandon_response(match_id, timestamp)


@router.get('/matches')
def get_matches():
    matches = resolve_match_names(db.get_all_matches())
    return {'status': 'success', 'matches': matches, 'count': len(matches)}


def _as_int(value, default=0):
    try:
        return int(value) if value is not None else default
    except (TypeError, ValueError):
        return default


def _player_summary(player, latest):
    units = latest.get('units') if latest and isinstance(latest.get('units'), list) else []
    return {
        'account_id': _as_int(player.get('account_id'), -1),
        'persona_name': player.get('persona_name'),
        'bot_persona_name': player.get('bot_persona_name'),
        'is_bot': bool(player.get('bot_persona_name')),
        'final_place': _as_int(player.get('final_place')),
        'health': _as_int(latest.get('health')) if latest else None,
        'gold': _as_int(latest.get('gold')) if latest else None,
        'level': _as_int(latest.get('level')) if latest else None,
        'xp': _as_int(latest.get('xp')) if latest else 0,
        'next_level_xp': _as_int(latest.get('next_level_xp'), 1) if latest else 1,
        'win_streak': _as_int(latest.get('win_streak')) if latest else 0,
        'lose_streak': _as_int(latest.get('lose_streak')) if latest else 0,
        'net_worth': _as_int(latest.get('net_worth')) if latest else None,
        'wins': _as_int(latest.get('wins')) if latest else 0,
        'losses': _as_int(latest.get('losses')) if latest else 0,
        'unit_ids': [u['unit_id'] for u in units if isinstance(u, dict) and u.get('unit_id') is not None],
        'units': units,
        'item_slots': latest.get('item_slots') if latest and isinstance(latest.get('item_slots'), list) else [],
        'synergies': latest.get('synergies') if latest and isinstance(latest.get('synergies'), list) else [],
    }


@router.get('/matches/{match_id}/summary')
def get_match_summary(match_id: str):
    match = next((m for m in resolve_match_names(db.get_all_matches()) if m.get('match_id') == match_id), None)
    if match is None:
        return error('Match not found', 404)

    try:
        snapshots = db.get_match_snapshots(match_id)
    except Exception as exc:
        print(f'[WARN] Failed to get snapshots for summary {match_id}: {exc}')
        snapshots = []

    latest_by_account = {}
    for snapshot in snapshots:
        account_id = _as_int(snapshot.get('account_id'), -1)
        previous = latest_by_account.get(account_id)
        if previous is None or _as_int(snapshot.get('sequence_number')) >= _as_int(previous.get('sequence_number')):
            latest_by_account[account_id] = snapshot

    players = [
        _player_summary(player, latest_by_account.get(_as_int(player.get('account_id'), -1)))
        for player in match.get('players') or []
    ]
    players.sort(key=lambda p: (p['final_place'] == 0, p['final_place'], p['account_id']))
    player_count = _as_int(match.get('player_count'))
    bot_count = sum(player['is_bot'] for player in players)
    complete = len(players) == player_count and player_count > 0 and all(
        1 <= player['final_place'] <= 8 for player in players
    )

    combat_summary = {}
    if match_state.match_id == match_id:
        for account_id, combats in match_state.player_combat_history.items():
            combat_summary[str(account_id)] = {
                label: sum(c.get('result') == result for c in combats)
                for label, result in (('wins', 'win'), ('losses', 'loss'), ('draws', 'draw'))
            }
    return {
        'status': 'success',
        'match_id': match_id,
        'summary': {
            'player_count': player_count,
            'bot_count': bot_count,
            'bot_heavy': player_count > 0 and bot_count > player_count / 2,
            'complete': complete,
            'partial': not complete,
            'players': players,
            'combat_summary': combat_summary,
        },
    }


@router.delete('/matches/{match_id}')
def delete_match(match_id: str):
    if match_state.match_id == match_id:
        return error('Cannot delete active match. Abandon it first.', 400)
    db_write_queue.put(('delete_match', match_id))
    return {'status': 'success', 'message': f'Match {match_id} deleted successfully'}


@router.get('/matches/{match_id}/combats')
def get_match_combats(match_id: str):
    if match_state.match_id != match_id:
        return error('Match not found or not active', 404)
    return {
        'status': 'success',
        'match_id': match_id,
        'combat_results': {str(account_id): combats for account_id, combats in match_state.player_combat_history.items()},
    }


@router.get('/matches/{match_id}/matchup_prediction')
def get_matchup_prediction(match_id: str):
    if match_state.match_id != match_id:
        return error('Match not found or not active', 404)
    return {'status': 'success', 'match_id': match_id, 'matchup_prediction': match_state.latest_matchup_prediction}


@router.get('/matches/{match_id}/shop_history')
def get_match_shop_history(match_id: str):
    return {'status': 'success', 'match_id': match_id, 'shop_history': db.get_shop_history(match_id)}


def _historical_changes(match_id, account_id, limit, round_number, round_phase):
    if account_id is not None:
        snapshots = db.get_player_snapshots(match_id, account_id, round_number=round_number, round_phase=round_phase)
    else:
        snapshots = db.get_match_snapshots(match_id)

    by_account = defaultdict(list)
    for snapshot in snapshots:
        by_account[snapshot['account_id']].append(snapshot)

    changes = []
    for player_id, player_snapshots in by_account.items():
        player_snapshots.sort(key=lambda snapshot: snapshot['sequence_number'])
        for previous, current in zip(player_snapshots, player_snapshots[1:]):
            changes.extend(change_detector.detect_changes(
                previous, current, player_id, match_id,
                round_number=current.get('round_number'), round_phase=current.get('round_phase'),
            ))
    changes.sort(key=lambda change: change.get('timestamp', ''), reverse=True)
    return changes[:limit] if limit is not None else changes


@router.get('/matches/{match_id}/changes')
def get_match_changes(
    match_id: str,
    account_id: int | None = None,
    limit: int | None = Query(default=500),
    round_number: int | None = None,
    round_phase: str | None = None,
):
    if match_state.match_id == match_id:
        changes = change_detector.get_changes(match_id, account_id=account_id, limit=limit)
    else:
        changes = _historical_changes(match_id, account_id, limit, round_number, round_phase)
    return {'status': 'success', 'match_id': match_id, 'changes': changes, 'count': len(changes)}
