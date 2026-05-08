"""
Unified GSI Listener + Web App for Dota Underlords.
Combines both services in one process for maximum speed.
"""

import threading
from datetime import datetime, timezone
from signal import signal, SIGINT, SIGTERM
from .config import (
    app,
    socketio,
    GSI_HOST,
    GSI_PORT,
    DEBUG,
    AUTO_ABANDON_STALE_MATCHES,
    AUTO_ABANDON_STALE_MATCH_MINUTES,
)
from .game_state import db, db_write_queue
from .gsi_handler import db_writer_worker

# Import routes to register HTTP and WebSocket handlers
from . import routes


def _parse_snapshot_timestamp(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            return None
    return None


def _to_utc(dt: datetime) -> datetime:
    """Normalize naive/aware datetimes for safe comparisons."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def auto_abandon_stale_in_progress_matches() -> None:
    """On startup, close stale in-progress matches based on latest snapshot age."""
    if not AUTO_ABANDON_STALE_MATCHES:
        print("[STARTUP] Auto-abandon stale matches is disabled")
        return

    threshold_minutes = max(1, AUTO_ABANDON_STALE_MATCH_MINUTES)
    threshold_seconds = threshold_minutes * 60
    now_utc = datetime.now(timezone.utc)

    try:
        matches = db.get_all_matches()
    except Exception as e:
        print(f"[STARTUP] Failed to load matches for stale sweep: {e}")
        return

    in_progress = [m for m in matches if not m.get('ended_at')]
    if not in_progress:
        print("[STARTUP] No in-progress matches found for stale sweep")
        return

    auto_closed = []
    for match in in_progress:
        match_id = match.get('match_id')
        if not match_id:
            continue
        try:
            snapshots = db.get_match_snapshots(match_id)
        except Exception as e:
            print(f"[STARTUP] Skipping {match_id}: failed to read snapshots ({e})")
            continue

        latest_snapshot_time = None
        latest_sequence = -1
        for snapshot in snapshots:
            snap_time = _parse_snapshot_timestamp(snapshot.get('timestamp'))
            if snap_time is None:
                continue
            seq = int(snapshot.get('sequence_number') or 0)
            if seq > latest_sequence:
                latest_sequence = seq
                latest_snapshot_time = snap_time

        if latest_snapshot_time is None:
            print(f"[STARTUP] Skipping {match_id}: no valid snapshot timestamp")
            continue

        age_seconds = (now_utc - _to_utc(latest_snapshot_time)).total_seconds()
        if age_seconds < threshold_seconds:
            continue

        db.update_match_end_time(match_id, latest_snapshot_time)
        auto_closed.append((match_id, latest_snapshot_time, int(age_seconds // 60)))

    if auto_closed:
        print(
            f"[STARTUP] Auto-closed {len(auto_closed)} stale in-progress match(es) "
            f"(threshold={threshold_minutes}m)"
        )
        for match_id, ended_at, age_minutes in auto_closed:
            print(
                f"[STARTUP]   - {match_id} ended_at={ended_at.isoformat()} "
                f"(last snapshot age={age_minutes}m)"
            )
    else:
        print(
            f"[STARTUP] Stale sweep complete: no in-progress matches older than {threshold_minutes}m"
        )


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    print(f"\n[SHUTDOWN] Received signal {signum}, shutting down gracefully...")
    
    # Close database connection
    if db:
        db.close()
        print("[SHUTDOWN] Database connection closed")
    
    # Stop the application
    print("[SHUTDOWN] Application stopped")
    exit(0)


# Register signal handlers
signal(SIGINT, signal_handler)
signal(SIGTERM, signal_handler)

# Verify handlers are registered (debug only)
if DEBUG:
    print(f"[DEBUG] WebSocket handlers registered")
    print(f"[DEBUG] SocketIO async_mode: {socketio.async_mode}")

# ==========================================
# Main Application
# ==========================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("  Dota Underlords - Unified GSI + Web App")
    print("="*60)
    print(f"Dashboard: http://{GSI_HOST}:{GSI_PORT}/dashboard")
    print("="*60)
    print(f"\nGSI Listener: http://{GSI_HOST}:{GSI_PORT}/upload (FIXED by game config)")
    print(f"Health Check: http://{GSI_HOST}:{GSI_PORT}/api/health")
    print(f"Debug Mode: {DEBUG}")
    print("\nWebSocket support enabled for real-time updates!")
    print("\n" + "="*60 + "\n")
    
    try:
        auto_abandon_stale_in_progress_matches()

        # Start database writer thread
        db_thread = threading.Thread(target=db_writer_worker, daemon=True)
        db_thread.start()
        print("[DB Writer] Background thread started")
        
        # Run with socketio
        socketio.run(
            app,
            host=GSI_HOST,
            port=GSI_PORT,
            debug=DEBUG,
            use_reloader=False,
            log_output=True
        )
    except (KeyboardInterrupt, SystemExit):  # Handle both
        print("\n[SHUTDOWN] Shutdown signal received")
    except Exception as e:
        print(f"[ERROR] Application failed to start: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Signal db writer thread to stop
        print("[SHUTDOWN] Signaling DB writer thread to stop...")
        try:
            db_write_queue.put(None)  # Signal worker to stop
            db_thread.join(timeout=2)  # Wait up to 2 seconds for thread to finish
        except NameError:
            pass  # db_write_queue might not be available if error occurred early
        
        # Cleanup
        if db:
            db.close()
        print("[SHUTDOWN] Cleanup completed")
