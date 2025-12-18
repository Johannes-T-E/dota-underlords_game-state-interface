"""
Flask Routes - API endpoints, WebSocket handlers, and React app serving
"""
import os
from typing import Dict, List
from flask import request, jsonify, send_from_directory
from flask_socketio import emit
from datetime import datetime
from .game_state import match_state, db, db_write_queue, connected_clients, stats, abandon_match, emit_realtime_update
from .gsi_handler import process_gsi_data
from .config import app, socketio, PRODUCTION, FRONTEND_BUILD_DIR, GSI_HOST, GSI_PORT
from .change_detector import change_detector


# Serve React App (Production mode)
if PRODUCTION and FRONTEND_BUILD_DIR and os.path.exists(FRONTEND_BUILD_DIR):
    @app.route('/')
    @app.route('/dashboard')
    @app.route('/matches')
    @app.route('/scoreboard')
    @app.route('/shop')
    @app.route('/player-boards')
    @app.route('/player-board/<path:accountId>')
    @app.route('/combat-results')
    @app.route('/hero-pool-stats')
    @app.route('/match-management')
    def serve_react_app():
        """Serve the React app for all frontend routes."""
        return send_from_directory(app.static_folder, 'index.html')


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


@app.route('/api/matches/<match_id>/combats', methods=['GET'])
def get_match_combats(match_id):
    """Get combat history for an active match."""
    try:
        # Check if match is active
        if match_state.match_id != match_id:
            return jsonify({
                'status': 'error',
                'message': 'Match not found or not active'
            }), 404
        
        # Convert account_id keys to strings for JSON serialization
        combat_results = {}
        for acc_id, combats in match_state.player_combat_history.items():
            combat_results[str(acc_id)] = combats
        
        return jsonify({
            'status': 'success',
            'match_id': match_id,
            'combat_results': combat_results
        })
    
    except Exception as e:
        print(f"[ERROR] Failed to get match combats: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/matches/<match_id>/changes', methods=['GET'])
def get_match_changes(match_id):
    """Get changes for a match (from buffer if active, or calculated from database if historical)."""
    try:
        # Get query parameters
        account_id = request.args.get('account_id', type=int)
        limit = request.args.get('limit', default=500, type=int)
        round_number = request.args.get('round_number', type=int)
        round_phase = request.args.get('round_phase', type=str)
        
        # Check if match is active
        is_active_match = match_state.match_id == match_id
        
        if is_active_match:
            # Active match: Retrieve from in-memory buffer
            changes = change_detector.get_changes(match_id, account_id=account_id, limit=limit)
        else:
            # Historical match: Calculate from database snapshots
            changes = []
            
            # Get snapshots for the match
            if account_id is not None:
                # Get snapshots for specific player
                snapshots = db.get_player_snapshots(
                    match_id, 
                    account_id, 
                    round_number=round_number, 
                    round_phase=round_phase
                )
            else:
                # Get snapshots for all players (or filtered list)
                account_ids_list = None
                if account_id is not None:
                    account_ids_list = [account_id]
                snapshots = db.get_match_snapshots(match_id, account_ids=account_ids_list)
            
            # Need at least 2 snapshots to calculate changes
            if len(snapshots) < 2:
                return jsonify({
                    'status': 'success',
                    'match_id': match_id,
                    'changes': [],
                    'count': 0
                })
            
            # Group snapshots by account_id
            snapshots_by_account: Dict[int, List[Dict]] = {}
            for snapshot in snapshots:
                acc_id = snapshot['account_id']
                if acc_id not in snapshots_by_account:
                    snapshots_by_account[acc_id] = []
                snapshots_by_account[acc_id].append(snapshot)
            
            # Calculate changes by comparing consecutive snapshots for each player
            for acc_id, player_snapshots in snapshots_by_account.items():
                # Sort by sequence_number to ensure chronological order
                player_snapshots.sort(key=lambda s: s['sequence_number'])
                
                # Compare each snapshot with the previous one
                for i in range(1, len(player_snapshots)):
                    previous_snapshot = player_snapshots[i - 1]
                    current_snapshot = player_snapshots[i]
                    
                    # Detect changes between these two snapshots
                    detected_changes = change_detector.detect_changes(
                        previous_snapshot,
                        current_snapshot,
                        acc_id,
                        match_id,
                        round_number=current_snapshot.get('round_number'),
                        round_phase=current_snapshot.get('round_phase')
                    )
                    
                    changes.extend(detected_changes)
            
            # Sort changes by timestamp descending (newest first)
            changes.sort(key=lambda c: c.get('timestamp', ''), reverse=True)
            
            # Apply limit
            if limit is not None:
                changes = changes[:limit]
        
        return jsonify({
            'status': 'success',
            'match_id': match_id,
            'changes': changes,
            'count': len(changes)
        })
    
    except Exception as e:
        print(f"[ERROR] Failed to get match changes: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
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

