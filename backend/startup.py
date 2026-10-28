"""One-time database housekeeping during application startup."""

from datetime import datetime, timezone

from backend.config import AUTO_ABANDON_STALE_MATCHES, AUTO_ABANDON_STALE_MATCH_MINUTES
from backend.domain.game_state import db


def _snapshot_timestamp(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            pass
    return None


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def auto_abandon_stale_in_progress_matches() -> None:
    """Close matches whose latest persisted snapshot exceeds the configured age."""
    if not AUTO_ABANDON_STALE_MATCHES:
        print('[STARTUP] Auto-abandon stale matches is disabled')
        return

    threshold_minutes = max(1, AUTO_ABANDON_STALE_MATCH_MINUTES)
    threshold_seconds = threshold_minutes * 60
    try:
        matches = db.get_all_matches()
    except Exception as exc:
        print(f'[STARTUP] Failed to load matches for stale sweep: {exc}')
        return

    in_progress = [match for match in matches if not match.get('ended_at')]
    if not in_progress:
        print('[STARTUP] No in-progress matches found for stale sweep')
        return

    closed = []
    now = datetime.now(timezone.utc)
    for match in in_progress:
        match_id = match.get('match_id')
        if not match_id:
            continue
        try:
            snapshots = db.get_match_snapshots(match_id)
        except Exception as exc:
            print(f'[STARTUP] Skipping {match_id}: failed to read snapshots ({exc})')
            continue

        latest_time = None
        latest_sequence = -1
        for snapshot in snapshots:
            timestamp = _snapshot_timestamp(snapshot.get('timestamp'))
            sequence = int(snapshot.get('sequence_number') or 0)
            if timestamp is not None and sequence > latest_sequence:
                latest_time = timestamp
                latest_sequence = sequence

        if latest_time is None:
            print(f'[STARTUP] Skipping {match_id}: no valid snapshot timestamp')
            continue
        age_seconds = (now - _utc(latest_time)).total_seconds()
        if age_seconds >= threshold_seconds:
            db.update_match_end_time(match_id, latest_time)
            closed.append((match_id, latest_time, int(age_seconds // 60)))

    if closed:
        db.conn.commit()
        print(f'[STARTUP] Auto-closed {len(closed)} stale in-progress match(es) (threshold={threshold_minutes}m)')
        for match_id, ended_at, age_minutes in closed:
            print(f'[STARTUP]   - {match_id} ended_at={ended_at.isoformat()} (last snapshot age={age_minutes}m)')
    else:
        print(f'[STARTUP] Stale sweep complete: no in-progress matches older than {threshold_minutes}m')
