"""
Flask Routes - API endpoints, WebSocket handlers, and React app serving
"""
import os
from flask import request, jsonify, render_template, send_from_directory
from flask_socketio import emit
from datetime import datetime
from .game_state import match_state, db, db_write_queue, connected_clients, stats, abandon_match, emit_realtime_update
from .gsi_handler import process_gsi_data
from .config import app, socketio, PRODUCTION, FRONTEND_BUILD_DIR, GSI_HOST, GSI_PORT


# Serve React App (Production mode)
if PRODUCTION and FRONTEND_BUILD_DIR and os.path.exists(FRONTEND_BUILD_DIR):
    @app.route('/')
    @app.route('/dashboard')
    @app.route('/matches')
    def serve_react_app():
        """Serve the React app for all frontend routes."""
        return send_from_directory(app.static_folder, 'index.html')
else:
    # Development mode - keep old template routes for reference
    @app.route('/dashboard')
    def dashboard():
        return render_template('scoreboard.html')

    @app.route('/matches')
    def matches_page():
        return render_template('matches.html')


@app.route('/api/status')
def get_status():
    """Get system status."""
    return jsonify({
        'active_match': {
            'match_id': match_state.match_id,
            'started_at': match_state.match_start.isoformat() if match_state.match_start else None,
            'player_count': len(match_state.latest_processed_public_player_states)
        } if match_state.match_id else None,
        'total_updates': stats['total_updates'],
        'match_count': stats['match_count'],
        'last_update': stats['last_update'].isoformat() if stats['last_update'] else None
    })


@app.route('/api/health')
def health_check():
    """Enhanced health check endpoint."""
    try:
        # Check database connection
        db.conn.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return jsonify({
        'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
        'timestamp': datetime.now().isoformat(),
        'database': db_status,
        'queue_size': db_write_queue.qsize(),
        'connected_clients': len(connected_clients),
        'active_match': match_state.match_id is not None,
        'gsi_endpoint': f"http://{GSI_HOST}:{GSI_PORT}/upload"
    })


@app.route('/api/abandon_match', methods=['POST'])
def abandon_match_endpoint():
    """Manually abandon the current active match."""
    if match_state.match_id is None:
        return jsonify({'error': 'No active match'}), 400
    
    match_id = match_state.match_id
    timestamp = datetime.now()
    abandon_match(match_id, timestamp, reason="Manual abandonment")
    
    return jsonify({
        'status': 'success',
        'match_id': match_id,
        'message': 'Match abandoned successfully'
    })


@app.route('/api/matches', methods=['GET'])
def get_matches():
    """Get list of all matches."""
    matches = db.get_all_matches()
    return jsonify({
        'status': 'success',
        'matches': matches,
        'count': len(matches)
    })


@app.route('/api/matches/<match_id>', methods=['DELETE'])
def delete_match(match_id):
    """Delete a specific match and all its data."""
    # Prevent deletion of active match
    if match_state.match_id == match_id:
        return jsonify({
            'status': 'error',
            'message': 'Cannot delete active match. Abandon it first.'
        }), 400
    
    # Queue delete operation
    db_write_queue.put(('delete_match', match_id))
    success = True  # Assume success since it's queued
    
    if success:
        return jsonify({
            'status': 'success',
            'message': f'Match {match_id} deleted successfully'
        })
    else:
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete match'
        }), 500


# GSI endpoint
@app.route('/upload', methods=['POST'])
def receive_gsi_data():
    """Receive GSI data from game."""
    try:
        gsi_payload = request.get_json()
        
        if gsi_payload:
            # Process in background to not block game (SocketIO-compatible)
            socketio.start_background_task(process_gsi_data, gsi_payload)
        else:
            print(f"[DEBUG] Received empty GSI data")
        
        return jsonify({"status": "ok"}), 200
    
    except Exception as e:
        print(f"[ERROR] Failed to process GSI data: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# WebSocket Event Handlers
# ==========================================

@socketio.on('connect')
def handle_connect():
    """Client connected."""
    connected_clients.add(request.sid)
    print(f'[WebSocket] Client connected: {request.sid}')
    print(f'[WebSocket] Total connected clients: {len(connected_clients)}')
    emit('connection_response', {'status': 'connected'})
    
    # If there's an active match, send current game state immediately
    if match_state.match_id:
        print(f'[WebSocket] Sending current game state to new client: {match_state.match_id}')
        emit_realtime_update()


@socketio.on('disconnect')
def handle_disconnect():
    """Client disconnected."""
    connected_clients.discard(request.sid)
    print(f'[WebSocket] Client disconnected: {request.sid}')
    print(f'[WebSocket] Remaining connected clients: {len(connected_clients)}')


@socketio.on('test_connection')
def handle_test_connection():
    """Test WebSocket connection."""
    print('[WebSocket] Test connection received')
    emit('test_response', {'status': 'ok', 'message': 'WebSocket is working'})

