"""
Unified GSI Listener + Web App for Dota Underlords.
Combines both services in one process for maximum speed.
"""

from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO, emit
from datetime import datetime
from database import UnderlordsDatabaseManager
import json
import threading
import time
import os
from typing import Dict, List
from queue import Queue
import hashlib
from signal import signal, SIGINT, SIGTERM

# ==========================================
# Configuration & Environment
# ==========================================

# Configuration from environment variables (for other settings)
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
SECRET_KEY = os.getenv('SECRET_KEY', 'underlords_gsi_secret_key')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# GSI endpoint is fixed by game configuration
GSI_HOST = '0.0.0.0'  # Must match game's GSI config
GSI_PORT = 3000       # Must match game's GSI config

app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
socketio = SocketIO(app, cors_allowed_origins="*")

# Global state
db = UnderlordsDatabaseManager("underlords_gsi_v2.db")
connected_clients = set()
data_lock = threading.Lock()
db_write_queue = Queue()

# Match state
class MatchState:
    def __init__(self):
        self.match_id = None                    # needs to be calculated.
        self.match_start = None                 # needs to be calculated.
        self.round_number = 1                   # Start at round 1
        self.round_phase = 'prep'               # Start in prep phase
        self.players = {}       # player_id -> player_data
        self.private_player = {} # private data for the human player only
        self.candidates = {}    # player_id -> player_data
        self.sequences = {}     # player_id -> last_sequence_number
        self.buffer = []        # (public_state, timestamp) tuples
        self.private_buffer = [] # (private_state, timestamp) tuples
        
        # NEW: Round tracking state
        self.tracked_player_id = None  # Current "source of truth" player
        self.last_combat_type = 0  # Track previous combat_type for transition detection
    
    def reset(self):
        """Reset to initial state."""
        self.match_id = None
        self.match_start = None
        self.players = {}
        self.private_player = {}
        self.round_number = 1  # Reset to 1
        self.round_phase = 'prep'  # Reset to prep
        self.candidates = {}
        self.sequences = {}
        self.buffer = []
        self.private_buffer = []
        
        # NEW: Reset tracking state
        self.tracked_player_id = None
        self.last_combat_type = 0

# Global match state
match_state = MatchState()

# ==========================================
# Graceful Shutdown
# ==========================================

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

# Stats
stats = {
    'total_updates': 0, # int
    'match_count': 0,   # int
    'last_update': None # datetime
}

def generate_match_id(players_data: List[Dict]) -> str:
    """
    Generate a unique match ID from player IDs and slots.
    This ensures each match gets a unique ID regardless of bots.
    """
    # Sort players by player_slot before processing
    sorted_players = sorted(players_data, key=lambda x: x.get('player_slot', 0))
    
    # Create a list of player identifiers (player_id + slot)
    player_identifiers = []
    for player in sorted_players:
        account_id = player.get('account_id', 0)
        if account_id == 0:
            # Player is a Bot -> use "bot_persona_name"
            player_id = player.get('bot_persona_name', 'unknown_bot')
        else:
            # Player is a Human -> use "account_id"
            player_id = str(account_id)
        
        player_slot = player.get('player_slot', 0) # (1,2,3,4,5,6,7,8)
        player_identifiers.append(f"{player_id}_{player_slot}")
    
    # Sort to ensure consistency 
    sorted_identifiers = sorted(player_identifiers)
    combined = "_".join(sorted_identifiers)
    return hashlib.sha256(combined.encode()).hexdigest()[:16]

def db_writer_worker():
    """Background thread to write to database (SQLite thread-safe)."""
    while True:
        try:
            task = db_write_queue.get()
            if task is None:
                break
            
            match_id, player_id, player_data, timestamp = task
            
            # Route to correct insert method based on player_id
            if player_id == 'private_player':
                db.insert_private_snapshot(match_id, player_data, timestamp)
            else:
                db.insert_public_snapshot(match_id, player_id, player_data, timestamp)
            
            db_write_queue.task_done()
        except Exception as e:
            print(f"[DB Writer] Error: {e}")
            import traceback
            traceback.print_exc()

def get_player_id(public_state):
    """Extract player ID from public state."""
    account_id = public_state.get('account_id', 0)
    if account_id == 0:
        return public_state.get('bot_persona_name', 'unknown_bot')
    return str(account_id)

def is_valid_new_player(public_state):
    """Check if this player data represents a valid new game player."""
    return (
        public_state.get('health') == 100 and
        public_state.get('level', 0) == 1 and
        public_state.get('wins', 0) == 0 and
        public_state.get('losses', 0) == 0 and
        public_state.get('xp', 0) == 0
    )

def find_highest_hp_player(players: Dict) -> str:
    """Find player with highest HP to use as round tracking source."""
    if not players:
        return None
    
    highest_hp = -1
    highest_player_id = None
    
    for player_id, player_data in players.items():
        hp = player_data.get('health', 0)
        if hp > highest_hp:
            highest_hp = hp
            highest_player_id = player_id
    
    return highest_player_id

def update_round_tracking(player_id: str, public_state: Dict):
    """Update round number and phase based on combat_type transitions."""
    combat_type = public_state.get('combat_type', 0)
    
    # Initialize tracked player if not set (game start)
    if match_state.tracked_player_id is None:
        match_state.tracked_player_id = find_highest_hp_player(match_state.players)
        match_state.last_combat_type = combat_type
        match_state.round_number = 1
        match_state.round_phase = 'prep'
        print(f"[ROUND] Tracking started: Player {match_state.tracked_player_id}, Round 1.prep")
        return
    
    # Only track transitions for the designated player
    if player_id != match_state.tracked_player_id:
        return
    
    # Detect phase transition: combat → prep (increment round)
    if match_state.last_combat_type != 0 and combat_type == 0:
        match_state.round_number += 1
        match_state.round_phase = 'prep'
        # Find new highest HP player for next round
        match_state.tracked_player_id = find_highest_hp_player(match_state.players)
        print(f"[ROUND] → Round {match_state.round_number}.prep (now tracking player {match_state.tracked_player_id})")
    
    # Detect phase transition: prep → combat
    elif match_state.last_combat_type == 0 and combat_type != 0:
        match_state.round_phase = 'combat'
        print(f"[ROUND] → Round {match_state.round_number}.combat")
    
    # Update last state
    match_state.last_combat_type = combat_type

def check_match_end(match_id: str, timestamp: datetime) -> bool:
    """Check if match has ended using in-memory player states."""
    players = match_state.players
    if not players:
        return False
    
    # Count players with final_place > 0
    eliminated = [p for p in players.values() if p.get('final_place', 0) > 0]
    still_playing = [p for p in players.values() if p.get('final_place', 0) == 0]
    
    # If someone got 2nd place, find and mark winner
    second_place = [p for p in players.values() if p.get('final_place', 0) == 2]
    if second_place and still_playing:
        winner = still_playing[0]
        winner_id = winner['player_id']
        print(f"[MATCH END] Player {second_place[0]['player_id']} got 2nd, marking {winner_id} as winner")
        
        # Use a single transaction for match end operations
        try:
            db.update_player_final_place(match_id, winner_id, 1, timestamp)
            match_state.players[winner_id]['final_place'] = 1
            db.update_match_end_time(match_id, timestamp)
            print(f"[MATCH END] Match {match_id} ended")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to update match end: {e}")
            # Rollback any partial changes
            db.conn.rollback()
            return False
    
    return False

def update_public_player_state(player_id: str, public_state: Dict, timestamp: datetime):
    """Update in-memory player state directly from GSI data."""
    # NEW: Use centralized round tracking
    update_round_tracking(player_id, public_state)
    
    # Get or preserve player metadata
    existing_player = match_state.players.get(player_id, {})
    
    # Determine player metadata (only set once at match start)
    account_id = public_state.get('account_id', 0)
    is_human = account_id != 0
    
    # Build full player state with comprehensive data
    player_state = {
        # Basic player info
        'player_id': player_id,
        'account_id': account_id,
        'persona_name': existing_player.get('persona_name') or public_state.get('persona_name'),
        'bot_persona_name': existing_player.get('bot_persona_name') or public_state.get('bot_persona_name'),
        'player_slot': existing_player.get('player_slot') or public_state.get('player_slot', 0),
        'is_human_player': is_human,
        
        # Core stats
        'health': public_state.get('health', 100),
        'gold': public_state.get('gold', 0),
        'level': public_state.get('level', 1),
        'xp': public_state.get('xp', 0),
        'next_level_xp': public_state.get('next_level_xp', 0),
        
        # Match performance
        'wins': wins,
        'losses': losses,
        'win_streak': public_state.get('win_streak', 0),
        'lose_streak': public_state.get('lose_streak', 0),
        'net_worth': public_state.get('net_worth', 0),
        'final_place': public_state.get('final_place', 0),
        
        # Combat data
        'combat_type': combat_type,
        'combat_result': public_state.get('combat_result', 0),
        'combat_duration': public_state.get('combat_duration', 0.0),
        'opponent_player_slot': public_state.get('opponent_player_slot'),
        
        # Board and units
        'board_unit_limit': public_state.get('board_unit_limit', 0),
        'units': public_state.get('units', []),
        'items': public_state.get('item_slots', []),
        'synergies': public_state.get('synergies', []),
        
        # Underlord data
        'underlord': public_state.get('underlord', 0),
        'underlord_selected_talents': public_state.get('underlord_selected_talents', []),
        
        # Event and special data
        'event_tier': public_state.get('event_tier', 0),
        'owns_event': public_state.get('owns_event', False),
        'is_mirrored_match': public_state.get('is_mirrored_match', False),
        
        # Connection status
        'connection_status': public_state.get('connection_status', 1),
        'disconnected_time': public_state.get('disconnected_time', 0.0),
        
        # VS opponent stats
        'vs_opponent_wins': public_state.get('vs_opponent_wins', 0),
        'vs_opponent_losses': public_state.get('vs_opponent_losses', 0),
        'vs_opponent_draws': public_state.get('vs_opponent_draws', 0),
        
        # Special mechanics
        'brawny_kills_float': public_state.get('brawny_kills_float', 0.0),
        'city_prestige_level': public_state.get('city_prestige_level', 0),
        'rank_tier': public_state.get('rank_tier'),
        'platform': public_state.get('platform', 0),
        
        # Board buddy
        'board_buddy': public_state.get('board_buddy', {}),
        
        # Lobby info
        'lobby_team': public_state.get('lobby_team', 0),
        
        # Modifiers (only include if they have actual values)
        #'reroll_cost_modifier': public_state.get('reroll_cost_modifier', 0),
        
        # Technical
        'sequence_number': public_state.get('sequence_number', 0),
        'timestamp': timestamp.isoformat()
    }
    
    # Store in match state
    match_state.players[player_id] = player_state

def update_private_player_state(private_state: Dict, timestamp: datetime):
    """Update in-memory private player state from GSI private data."""
    # Get or preserve existing private state
    existing_private = match_state.private_player
    
    # Build comprehensive private player state
    private_player_state = {
        # Basic info
        'player_slot': private_state.get('player_slot', 0),
        'sequence_number': private_state.get('sequence_number', 0),
        
        # Shop & Economy
        'shop_units': private_state.get('shop_units', []),
        'shop_locked': private_state.get('shop_locked', False),
        'reroll_cost': private_state.get('reroll_cost', 0),
        'gold_earned_this_round': private_state.get('gold_earned_this_round', 0),
        'shop_generation_id': private_state.get('shop_generation_id', 0),
        
        # Underlord Selection
        'can_select_underlord': private_state.get('can_select_underlord', False),
        'underlord_picker_offering': private_state.get('underlord_picker_offering', []),
        
        # Challenges & Rewards
        'challenges': private_state.get('challenges', []),
        'unclaimed_reward_count': private_state.get('unclaimed_reward_count', 0),
        'oldest_unclaimed_reward': private_state.get('oldest_unclaimed_reward'),
        'used_item_reward_reroll_this_round': private_state.get('used_item_reward_reroll_this_round', False),
        'grants_rewards': private_state.get('grants_rewards', 0),
        
        # Timestamp
        'timestamp': timestamp.isoformat()
    }
    
    # Store in match state (only one private player - the human player)
    match_state.private_player = private_player_state

def emit_realtime_update():
    """Emit real-time update directly from in-memory game state."""
    if not match_state.match_id or len(connected_clients) == 0:
        return
    
    # Build update payload from memory
    update_data = {
        'match': {
            'match_id': match_state.match_id,
            'started_at': match_state.match_start.isoformat() if match_state.match_start else None,
            'player_count': len(match_state.players)
        },
        'players': list(match_state.players.values()),
        'private_player': match_state.private_player,  # Private data for the human player
        'current_round': {
            'round_number': match_state.round_number,
            'round_phase': match_state.round_phase,
            'is_combat_phase': match_state.round_phase == 'combat'
        },
        'timestamp': time.time()
    }
    
    # Emit immediately - broadcast to ALL connected clients!
    socketio.emit('match_update', update_data, to=None)
    print(f"[WebSocket] ⚡ Instant update BROADCASTED to {len(connected_clients)} clients (Round {match_state.round_number}.{match_state.round_phase})")
    print(f"[WebSocket] Data sent: {len(update_data['players'])} players, private_player={'yes' if update_data['private_player'] else 'no'}, match_id={update_data['match']['match_id']}")

def start_new_match(players_data: List[Dict], timestamp: datetime) -> str:
    """Start a new match with the given players."""
    # Generate match_id
    match_id = generate_match_id(players_data)
    
    # Create match in database
    db.create_match(match_id, players_data, timestamp)
    
    # Update match state
    match_state.match_id = match_id
    match_state.match_start = timestamp
    match_state.players = {}
    match_state.sequences = {}
    
    # Update stats
    stats['match_count'] += 1
    
    print(f"\n{'='*60}")
    print(f"[MATCH START] Match ID: {match_id}")
    print(f"              Players: {len(players_data)}")
    print(f"{'='*60}\n")
    
    return match_id

def process_buffered_data(match_id: str, confirmed_players: set, timestamp: datetime):
    """Process buffered data for newly started match."""
    # Process public player states
    # Find latest sequence for each player
    latest_sequences = {}
    for buf_state, buf_time in match_state.buffer:
        buf_player_id = get_player_id(buf_state)
        buf_sequence = buf_state.get('sequence_number', 0)
        
        if buf_player_id in confirmed_players:
            if buf_player_id not in latest_sequences or buf_sequence > latest_sequences[buf_player_id]:
                latest_sequences[buf_player_id] = buf_sequence
    
    # Process only the latest sequences for each player
    for buf_state, buf_time in match_state.buffer:
        buf_player_id = get_player_id(buf_state)
        buf_sequence = buf_state.get('sequence_number', 0)
        
        if (buf_player_id in confirmed_players and 
            buf_player_id in latest_sequences and 
            buf_sequence == latest_sequences[buf_player_id]):
            
            # Update memory and database
            update_public_player_state(buf_player_id, buf_state, buf_time)
            match_state.sequences[buf_player_id] = buf_sequence
            db_write_queue.put((match_id, buf_player_id, buf_state, buf_time))
    
    # Process private player states
    # Find latest private sequence
    latest_private_sequence = 0
    for private_state, private_time in match_state.private_buffer:
        private_sequence = private_state.get('sequence_number', 0)
        if private_sequence > latest_private_sequence:
            latest_private_sequence = private_sequence
    
    # Process only the latest private sequence
    for private_state, private_time in match_state.private_buffer:
        private_sequence = private_state.get('sequence_number', 0)
        if private_sequence == latest_private_sequence:
            update_private_player_state(private_state, private_time)
            match_state.sequences['private_sequence'] = private_sequence
            db_write_queue.put((match_id, 'private_player', private_state, private_time))
            break  # Only process once
    
    # Clear both buffers
    match_state.buffer = []
    match_state.private_buffer = []

def process_gsi_data(data):
    """Process incoming GSI data with parallel memory update and DB storage."""
    with data_lock:
        stats['total_updates'] += 1
        stats['last_update'] = datetime.now()
        
        if 'block' not in data:
            return
        
        timestamp = datetime.now()
        any_updates = False

        # Process all data blocks
        for block in data['block']:
            if 'data' not in block:
                continue
            
            for data_obj in block['data']:
                # Process private player state (only for the human player)
                if 'private_player_state' in data_obj:
                    private_state = data_obj['private_player_state']
                    private_sequence_num = private_state.get('sequence_number', 0)
                    
                    # Skip if same or older sequence number (same rules as public state)
                    if 'private_sequence' in match_state.sequences and match_state.sequences['private_sequence'] >= private_sequence_num:
                        continue
                    
                    # No active match - buffer private state separately
                    if match_state.match_id is None:
                        match_state.private_buffer.append((private_state, timestamp))
                    
                    # Active match - update memory and store in DB
                    else:
                        # Update sequence tracker
                        match_state.sequences['private_sequence'] = private_sequence_num
                        
                        # Update in-memory state
                        update_private_player_state(private_state, timestamp)
                        any_updates = True
                        
                        # Queue for DB write (private state)
                        db_write_queue.put((match_state.match_id, 'private_player', private_state, timestamp))
                
                if 'public_player_state' not in data_obj:
                    continue
                
                public_state = data_obj['public_player_state']
                player_id = get_player_id(public_state)
                sequence_num = public_state.get('sequence_number', 0)
                
                # Skip if same or older sequence number
                if player_id in match_state.sequences and match_state.sequences[player_id] >= sequence_num:
                    continue
                
                # No active match - collecting candidates
                if match_state.match_id is None:
                    if is_valid_new_player(public_state) and player_id not in match_state.candidates:
                        match_state.candidates[player_id] = public_state
                        print(f"[CANDIDATE] Player {player_id} ({len(match_state.candidates)}/8)")
                    
                    if is_valid_new_player(public_state):
                        # Buffer public state only (private state buffered separately)
                        match_state.buffer.append((public_state, timestamp))
                    
                    # Start match when we have 8 valid candidates
                    if len(match_state.candidates) == 8:
                        confirmed = list(match_state.candidates.keys())
                        match_players_data = [match_state.candidates[p] for p in confirmed]
                        
                        # Start new match
                        match_id = start_new_match(match_players_data, timestamp)
                        
                        # Process buffered data
                        process_buffered_data(match_id, set(confirmed), timestamp)
                        
                        # Emit initial state
                        emit_realtime_update()
                        
                        # Clear candidates
                        match_state.candidates = {}
                
                else:
                    # Active match - update memory and store in DB
                    if player_id in match_state.players:
                        # Update sequence tracker
                        match_state.sequences[player_id] = sequence_num
                        
                        # Update in-memory state
                        update_public_player_state(player_id, public_state, timestamp)
                        any_updates = True
                        
                        # Queue for DB write
                        db_write_queue.put((match_state.match_id, player_id, public_state, timestamp))
                        
                        # Check for match end
                        final_place = public_state.get('final_place', 0)
                        if final_place > 0:
                            if check_match_end(match_state.match_id, timestamp):
                                print(f"[MATCH END] Clearing game state")
                                match_state.reset()
        
        # Emit WebSocket update if there were updates
        if any_updates and match_state.match_id:
            emit_realtime_update()

# ==========================================
# Flask Routes
# ==========================================


@app.route('/scoreboard')
def scoreboard():
    return render_template('scoreboard.html')

@app.route('/api/status')
def get_status():
    """Get system status."""
    return jsonify({
        'active_match': {
            'match_id': match_state.match_id,
            'started_at': match_state.match_start.isoformat() if match_state.match_start else None,
            'player_count': len(match_state.players)
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



# GSI endpoint
@app.route('/upload', methods=['POST'])
def receive_gsi_data():
    """Receive GSI data from game."""
    try:
        data = request.get_json()
        
        if data:
            # Process in background to not block game (SocketIO-compatible)
            socketio.start_background_task(process_gsi_data, data)
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

# ==========================================
# Main Application
# ==========================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("  Dota Underlords - Unified GSI + Web App")
    print("="*60)
    print(f"\nGSI Listener: http://{GSI_HOST}:{GSI_PORT}/upload (FIXED by game config)")
    print(f"Scoreboard: http://{GSI_HOST}:{GSI_PORT}/scoreboard")
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
    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Keyboard interrupt received")
    except Exception as e:
        print(f"[ERROR] Application failed to start: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        if db:
            db.close()
        print("[SHUTDOWN] Cleanup completed")
