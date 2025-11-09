"""
Unified GSI Listener + Web App for Dota Underlords.
Combines both services in one process for maximum speed.
"""

import threading
from signal import signal, SIGINT, SIGTERM
from .config import app, socketio, GSI_HOST, GSI_PORT, DEBUG
from .game_state import db, db_write_queue
from .gsi_handler import db_writer_worker

# Import routes to register HTTP and WebSocket handlers
from . import routes


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
