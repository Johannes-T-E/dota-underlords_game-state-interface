"""
Flask Routes - API endpoints, WebSocket handlers, and React app serving
"""
import os
from typing import Dict, List
from flask import request, jsonify, send_from_directory
from flask_socketio import emit
from datetime import datetime
import json
from .game_state import match_state, db, db_write_queue, connected_clients, stats, abandon_match, emit_realtime_update
from .gsi_handler import process_gsi_data
from .config import app, socketio, PRODUCTION, FRONTEND_BUILD_DIR, GSI_HOST, GSI_PORT
from .change_detector import change_detector
from .bench_organizer import organize_bench, BenchOrganizerError


def _parse_snapshot_timestamp(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        normalized = value.replace('Z', '+00:00')
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None
    return None


def _get_latest_snapshot_timestamp(match_id):
    try:
        snapshots = db.get_match_snapshots(match_id)
    except Exception as e:
        print(f"[WARN] Failed to load snapshots for abandon timestamp ({match_id}): {e}")
        return None

    latest_snapshot = None
    latest_sort_key = None
    for snapshot in snapshots:
        sequence = snapshot.get('sequence_number') or 0
        snapshot_time = _parse_snapshot_timestamp(snapshot.get('timestamp'))
        sort_key = (int(sequence), snapshot_time or datetime.min)
        if latest_sort_key is None or sort_key > latest_sort_key:
            latest_sort_key = sort_key
            latest_snapshot = snapshot_time

    return latest_snapshot


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
    @app.route('/matchup-predictor')
    @app.route('/bench-sorter')
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
    timestamp = _get_latest_snapshot_timestamp(match_id) or datetime.now()
    abandon_match(match_id, timestamp, reason="Manual abandonment")
    
    return jsonify({
        'status': 'success',
        'match_id': match_id,
        'ended_at': timestamp.isoformat(),
        'message': 'Match abandoned successfully'
    })


@app.route('/api/matches/<match_id>/abandon', methods=['POST'])
def abandon_specific_match_endpoint(match_id):
    """Manually abandon a specific in-progress match id."""
    all_matches = db.get_all_matches()
    match_meta = next((m for m in all_matches if m.get('match_id') == match_id), None)
    if not match_meta:
        return jsonify({'error': 'Match not found'}), 404

    if match_meta.get('ended_at'):
        return jsonify({'error': 'Match is already complete'}), 400

    timestamp = _get_latest_snapshot_timestamp(match_id) or datetime.now()

    if match_state.match_id == match_id:
        abandon_match(match_id, timestamp, reason="Manual abandonment")
    else:
        # Historical in-progress match: mark completed without touching active in-memory state
        db_write_queue.put(('update_match_end', match_id, timestamp))

    return jsonify({
        'status': 'success',
        'match_id': match_id,
        'ended_at': timestamp.isoformat(),
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


@app.route('/api/organize_bench', methods=['POST'])
def organize_bench_endpoint():
    """Trigger frontend-requested bench organization automation."""
    try:
        request_data = request.get_json(silent=True) or {}
        dry_run = bool(request_data.get('dry_run', False))
        desired_entindex_order = request_data.get('desired_entindex_order')
        timing_scale = request_data.get('timing_scale', 1.0)

        if match_state.match_id is None:
            return jsonify({
                'status': 'error',
                'message': 'No active match'
            }), 400

        private_account_id = match_state.private_player_account_id
        if private_account_id is None:
            return jsonify({
                'status': 'error',
                'message': 'Private player account is not resolved yet'
            }), 400

        public_player_state = match_state.latest_processed_public_player_states.get(private_account_id)
        if not public_player_state:
            return jsonify({
                'status': 'error',
                'message': 'Unable to find current player state'
            }), 404

        result = organize_bench(
            public_player_state,
            dry_run=dry_run,
            desired_entindex_order=desired_entindex_order,
            timing_scale=timing_scale,
        )
        return jsonify({
            'status': 'success',
            'dry_run': dry_run,
            'moves_executed': result.get('moves_executed', 0),
            'diagnostics': result.get('diagnostics', {})
        }), 200
    except BenchOrganizerError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"[ERROR] Failed to organize bench: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/matches/<match_id>/summary', methods=['GET'])
def get_match_summary(match_id):
    """Get enriched summary/details for a match using latest snapshots and player metadata."""
    try:
        def to_int(value, default=0):
            try:
                if value is None:
                    return default
                return int(value)
            except (TypeError, ValueError):
                return default

        all_matches = db.get_all_matches()
        match_meta = next((m for m in all_matches if m.get('match_id') == match_id), None)
        if not match_meta:
            return jsonify({
                'status': 'error',
                'message': 'Match not found'
            }), 404

        players = match_meta.get('players') or []
        players_by_account = {p.get('account_id'): p for p in players}

        snapshots: List[Dict] = []
        try:
            snapshots = db.get_match_snapshots(match_id)
        except Exception as snapshot_error:
            print(f"[WARN] Failed to get snapshots for summary {match_id}: {snapshot_error}")

        latest_by_account: Dict[int, Dict] = {}
        for snapshot in snapshots:
            account_id = to_int(snapshot.get('account_id'), default=-1)
            if account_id is None:
                continue
            previous = latest_by_account.get(account_id)
            if previous is None or to_int(snapshot.get('sequence_number'), 0) >= to_int(previous.get('sequence_number'), 0):
                latest_by_account[account_id] = snapshot

        player_summaries: List[Dict] = []
        for account_id, player_meta in players_by_account.items():
            normalized_account_id = to_int(account_id, default=-1)
            latest = latest_by_account.get(normalized_account_id)
            wins = to_int(latest.get('wins'), 0) if latest else 0
            losses = to_int(latest.get('losses'), 0) if latest else 0
            units = latest.get('units') if latest and isinstance(latest.get('units'), list) else []
            unit_ids = [u.get('unit_id') for u in units if isinstance(u, dict) and u.get('unit_id') is not None]

            player_summaries.append({
                'account_id': normalized_account_id,
                'persona_name': player_meta.get('persona_name'),
                'bot_persona_name': player_meta.get('bot_persona_name'),
                'is_bot': bool(player_meta.get('bot_persona_name')),
                'final_place': to_int(player_meta.get('final_place'), 0),
                'health': to_int(latest.get('health'), 0) if latest else None,
                'gold': to_int(latest.get('gold'), 0) if latest else None,
                'level': to_int(latest.get('level'), 0) if latest else None,
                'xp': to_int(latest.get('xp'), 0) if latest else 0,
                'next_level_xp': to_int(latest.get('next_level_xp'), 0) if latest else 1,
                'win_streak': to_int(latest.get('win_streak'), 0) if latest else 0,
                'lose_streak': to_int(latest.get('lose_streak'), 0) if latest else 0,
                'net_worth': to_int(latest.get('net_worth'), 0) if latest else None,
                'wins': wins,
                'losses': losses,
                'unit_ids': unit_ids,
                'units': units,
                'item_slots': latest.get('item_slots') if latest and isinstance(latest.get('item_slots'), list) else [],
                'synergies': latest.get('synergies') if latest and isinstance(latest.get('synergies'), list) else []
            })

        player_summaries.sort(key=lambda p: (to_int(p.get('final_place'), 0) == 0, to_int(p.get('final_place'), 0), to_int(p.get('account_id'), 0)))

        player_count = to_int(match_meta.get('player_count'), 0)
        bot_count = sum(1 for p in player_summaries if p.get('is_bot'))
        complete = (
            len(player_summaries) == player_count
            and player_count > 0
            and all(1 <= to_int(p.get('final_place'), 0) <= 8 for p in player_summaries)
        )
        partial = not complete
        bot_heavy = player_count > 0 and bot_count > (player_count / 2)

        combat_summary: Dict[str, Dict[str, int]] = {}
        if match_state.match_id == match_id:
            for account_id, combats in match_state.player_combat_history.items():
                win_count = sum(1 for c in combats if c.get('result') == 'win')
                loss_count = sum(1 for c in combats if c.get('result') == 'loss')
                draw_count = sum(1 for c in combats if c.get('result') == 'draw')
                combat_summary[str(account_id)] = {
                    'wins': win_count,
                    'losses': loss_count,
                    'draws': draw_count
                }

        return jsonify({
            'status': 'success',
            'match_id': match_id,
            'summary': {
                'player_count': player_count,
                'bot_count': bot_count,
                'bot_heavy': bot_heavy,
                'complete': complete,
                'partial': partial,
                'players': player_summaries,
                'combat_summary': combat_summary
            }
        })
    except Exception as e:
        print(f"[ERROR] Failed to get match summary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


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


@app.route('/api/matches/<match_id>/matchup_prediction', methods=['GET'])
def get_matchup_prediction(match_id):
    """Get matchup prediction for an active match."""
    try:
        if match_state.match_id != match_id:
            return jsonify({
                'status': 'error',
                'message': 'Match not found or not active'
            }), 404

        return jsonify({
            'status': 'success',
            'match_id': match_id,
            'matchup_prediction': match_state.latest_matchup_prediction
        })
    except Exception as e:
        print(f"[ERROR] Failed to get matchup prediction: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/matches/<match_id>/shop_history', methods=['GET'])
def get_match_shop_history(match_id):
    """Get shop history for a match (one entry per shop_generation_id from DB)."""
    try:
        shop_history = db.get_shop_history(match_id)
        return jsonify({
            'status': 'success',
            'match_id': match_id,
            'shop_history': shop_history
        })
    except Exception as e:
        print(f"[ERROR] Failed to get match shop history: {e}")
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


# Build endpoints
@app.route('/api/builds', methods=['GET'])
def get_builds():
    """Get all builds."""
    try:
        builds = db.get_all_builds()
        return jsonify({
            'status': 'ok',
            'builds': builds
        }), 200
    except Exception as e:
        print(f"[ERROR] Failed to get builds: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/builds/<build_id>', methods=['GET'])
def get_build(build_id: str):
    """Get a specific build by ID."""
    try:
        build = db.get_build(build_id)
        if not build:
            return jsonify({
                'status': 'error',
                'message': 'Build not found'
            }), 404
        
        return jsonify({
            'status': 'ok',
            'build': build
        }), 200
    except Exception as e:
        print(f"[ERROR] Failed to get build: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/builds', methods=['POST'])
def create_build():
    """Create a new build."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        build_id = data.get('id')
        name = data.get('name')
        description = data.get('description')
        units = data.get('units', [])
        
        if not build_id or not name:
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields: id, name'
            }), 400
        
        # Check if build already exists
        existing = db.get_build(build_id)
        if existing:
            return jsonify({
                'status': 'error',
                'message': f'Build with ID "{build_id}" already exists'
            }), 409
        
        units_json = json.dumps(units)
        db.save_build(build_id, name, description, units_json)
        
        return jsonify({
            'status': 'ok',
            'message': 'Build created successfully'
        }), 201
    except Exception as e:
        print(f"[ERROR] Failed to create build: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/builds/<build_id>', methods=['PUT'])
def update_build(build_id: str):
    """Update an existing build."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        name = data.get('name')
        description = data.get('description')
        units = data.get('units', [])
        
        if not name:
            return jsonify({
                'status': 'error',
                'message': 'Missing required field: name'
            }), 400
        
        # Check if build exists
        existing = db.get_build(build_id)
        if not existing:
            return jsonify({
                'status': 'error',
                'message': 'Build not found'
            }), 404
        
        units_json = json.dumps(units)
        db.save_build(build_id, name, description, units_json)
        
        return jsonify({
            'status': 'ok',
            'message': 'Build updated successfully'
        }), 200
    except Exception as e:
        print(f"[ERROR] Failed to update build: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/builds/<build_id>', methods=['DELETE'])
def delete_build(build_id: str):
    """Delete a build."""
    try:
        deleted = db.delete_build(build_id)
        if not deleted:
            return jsonify({
                'status': 'error',
                'message': 'Build not found'
            }), 404
        
        return jsonify({
            'status': 'ok',
            'message': 'Build deleted successfully'
        }), 200
    except Exception as e:
        print(f"[ERROR] Failed to delete build: {e}")
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

