"""
Game State Management - Match state, lifecycle, and game logic
Consolidates match_state.py, match_manager.py, and game_logic.py
"""
from datetime import datetime
from typing import List, Dict
import threading
import time
from queue import Queue

from .database import UnderlordsDatabaseManager
from .utils import generate_match_id, is_valid_new_player, get_highest_hp_player
from .config import socketio
from .change_detector import change_detector
from typing import Optional, Tuple


# ==========================================
# Combat Record Type
# ==========================================

CombatRecord = Dict  # TypedDict would be better, but Dict works for now
# Structure:
# {
#     'round_number': int,
#     'player_account_id': int,
#     'opponent_account_id': int,
#     'opponent_player_slot': int,
#     'combat_type': int,
#     'combat_duration': float,  # Duration of the combat in seconds
#     'result': str,  # 'win', 'loss', 'draw'
#     'timestamp': str  # ISO format
# }


# ==========================================
# Global State
# ==========================================

db = UnderlordsDatabaseManager()
connected_clients = set()
data_lock = threading.Lock()
db_write_queue = Queue()

# Stats
stats = {
    'total_updates': 0,  # int
    'match_count': 0,    # int
    'last_update': None  # datetime
}


# ==========================================
# MatchState Class
# ==========================================

class MatchState:
    def __init__(self):
        self.match_id = None            # needs to be calculated.
        self.match_start = None         # needs to be calculated.
        self.latest_processed_private_player_state = {}        # "account_id" : {} -> latest processed private_player_state (client owner)
        self.latest_processed_public_player_states = {}        # "account_id" : {} -> latest processed public_player_state
        self.sequences = {}             # account_id -> last_sequence_number

        # Round tracking
        self.tracked_player_account_id = None   # The "source of truth" player (account_id)
        self.last_combat_type = 0       # Track previous combat_type for transitions
        self.round_number = 1           # Start at round 1
        self.round_phase = 'prep'       # Start in prep phase
    
        # Buffer is used in match start logic only
        # public_player_buffer: (gsi_state, timestamp, account_id) tuples
        self.public_player_buffer = []
        # private_player_buffer: (gsi_state, timestamp) tuples
        self.private_player_buffer = []
        
        # Match counts for players (calculated at match start)
        self.player_match_counts = {}  # account_id -> match_count
        
        # Combat tracking
        self.player_combat_history = {}  # account_id -> List[CombatRecord] - Full buffer of all combats
        self.player_vs_opponent_stats = {}  # (account_id, opponent_slot) -> Dict with wins, losses, draws
        self.new_combats_this_update = {}  # account_id -> List[CombatRecord] - New combats for this WebSocket emit

    def reset(self):
        """Reset to initial state."""
        self.match_id = None
        self.match_start = None
        self.latest_processed_public_player_states = {}
        self.latest_processed_private_player_state = {}
        self.sequences = {}
        self.public_player_buffer = []
        self.private_player_buffer = []
        self.player_match_counts = {}
        
        # Reset round tracking
        self.tracked_player_account_id = None
        self.last_combat_type = 0
        self.round_number = 1  # Reset to round 1
        self.round_phase = 'prep'  # Reset to prep
        
        # Reset combat tracking
        self.player_combat_history = {}
        self.player_vs_opponent_stats = {}
        self.new_combats_this_update = {}


# Global match state
match_state = MatchState()


# ==========================================
# Combat Detection Logic
# ==========================================

def detect_and_record_combat(account_id: int, current_state: Dict, previous_state: Dict, timestamp: datetime) -> Optional[CombatRecord]:
    """Detect combat completion by monitoring vs_opponent_* stats.
    
    Returns:
        CombatRecord if combat was detected, None otherwise
    """
    # Get current opponent info
    opponent_slot = current_state.get('opponent_player_slot')
    if opponent_slot is None:
        return None
    
    # Get current vs_opponent stats
    current_wins = current_state.get('vs_opponent_wins')
    current_losses = current_state.get('vs_opponent_losses')
    current_draws = current_state.get('vs_opponent_draws')
    
    # Handle None values - treat as 0
    current_wins = current_wins if current_wins is not None else 0
    current_losses = current_losses if current_losses is not None else 0
    current_draws = current_draws if current_draws is not None else 0
    current_sum = current_wins + current_losses + current_draws
    
    # Get previous stats
    stats_key = (account_id, opponent_slot)
    previous_stats = match_state.player_vs_opponent_stats.get(stats_key, {})
    prev_wins = previous_stats.get('wins', 0)
    prev_losses = previous_stats.get('losses', 0)
    prev_draws = previous_stats.get('draws', 0)
    prev_sum = prev_wins + prev_losses + prev_draws
    
    # Check if sum increased (combat completed)
    if current_sum <= prev_sum:
        # Update stats but no combat detected
        match_state.player_vs_opponent_stats[stats_key] = {
            'wins': current_wins,
            'losses': current_losses,
            'draws': current_draws
        }
        return None
    
    # Combat detected! Determine result
    if current_wins > prev_wins:
        result = 'win'
    elif current_losses > prev_losses:
        result = 'loss'
    elif current_draws > prev_draws:
        result = 'draw'
    else:
        # Shouldn't happen, but handle gracefully
        result = 'unknown'
    
    # Get opponent account_id
    opponent_account_id = None
    for opp_account_id, opp_state in match_state.latest_processed_public_player_states.items():
        if opp_state.get('player_slot') == opponent_slot:
            opponent_account_id = opp_account_id
            break
    
    if opponent_account_id is None:
        # Opponent not found, can't create record
        return None
    
    # Create combat record
    combat_duration = current_state.get('combat_duration')
    if combat_duration is None:
        combat_duration = 0.0  # Default to 0 if not available
    
    combat_record: CombatRecord = {
        'round_number': match_state.round_number,
        'player_account_id': account_id,
        'opponent_account_id': opponent_account_id,
        'opponent_player_slot': opponent_slot,
        'combat_type': current_state.get('combat_type', 0),
        'combat_duration': float(combat_duration),
        'result': result,
        'timestamp': timestamp.isoformat()
    }
    
    # Add to buffers
    if account_id not in match_state.player_combat_history:
        match_state.player_combat_history[account_id] = []
    match_state.player_combat_history[account_id].append(combat_record)
    
    if account_id not in match_state.new_combats_this_update:
        match_state.new_combats_this_update[account_id] = []
    match_state.new_combats_this_update[account_id].append(combat_record)
    
    # Update stats
    match_state.player_vs_opponent_stats[stats_key] = {
        'wins': current_wins,
        'losses': current_losses,
        'draws': current_draws
    }
    
    return combat_record


# ==========================================
# Round Tracking Logic
# ==========================================

def update_round_from_combat_type(account_id: int, combat_type: int):
    """Update round number and phase based on combat_type transitions."""
    
    # Check if tracked player is valid (exists and is still in game)
    has_valid_tracked_player = (
        match_state.tracked_player_account_id is not None and 
        match_state.tracked_player_account_id in match_state.latest_processed_public_player_states
    )
    
    if not has_valid_tracked_player:
        # Initialize tracked player from highest HP player
        match_state.tracked_player_account_id = get_highest_hp_player(match_state.latest_processed_public_player_states)
        match_state.last_combat_type = combat_type
        match_state.round_phase = 'prep' if combat_type == 0 else 'combat'
        return
    
    # Only process transitions for the tracked player
    if account_id != match_state.tracked_player_account_id:
        return
    
    # Detect transitions
    prev_combat_type = match_state.last_combat_type
    
    # Transition: prep → combat (0 → non-0)
    if prev_combat_type == 0 and combat_type != 0:
        match_state.round_phase = 'combat'
        # Round number stays the same
    
    # Transition: combat → prep (non-0 → 0)
    elif prev_combat_type != 0 and combat_type == 0:
        match_state.round_number += 1
        match_state.round_phase = 'prep'
        # Find new highest HP player at start of prep phase
        match_state.tracked_player_account_id = get_highest_hp_player(match_state.latest_processed_public_player_states)
    
    # Update last combat_type
    match_state.last_combat_type = combat_type


# ==========================================
# State Processing Functions
# ==========================================

def process_and_store_gsi_public_player_state(account_id: int, gsi_public_player_state: Dict, timestamp: datetime) -> Dict:
    """Process raw GSI public player state data and store in match state.
    
    Returns:
        Dict: Processed public player state data
    """
    # Update round tracking based on combat_type transitions
    update_round_from_combat_type(account_id, gsi_public_player_state.get('combat_type'))
    
    # Get previous state BEFORE updating (for combat detection)
    previous_state = match_state.latest_processed_public_player_states.get(account_id)
    
    # Build full player state with comprehensive data
    # Use GSI data directly - missing fields will be None (no hardcoded fallbacks)
    processed_public_player_state = {
        # Basic player info
        'account_id': account_id,  # Normalized account_id (int) - bots end with "000", humans use raw account_id
        'persona_name': gsi_public_player_state.get('persona_name'),  # Only for humans
        'bot_persona_name': gsi_public_player_state.get('bot_persona_name'),  # Only for bots
        'player_slot': gsi_public_player_state.get('player_slot'),
        'is_human_player': gsi_public_player_state.get('is_human_player'),
        
        # Core stats
        'health': gsi_public_player_state.get('health'),
        'gold': gsi_public_player_state.get('gold'),
        'level': gsi_public_player_state.get('level'),
        'xp': gsi_public_player_state.get('xp'),
        'next_level_xp': gsi_public_player_state.get('next_level_xp'),
        
        # Match performance
        'wins': gsi_public_player_state.get('wins'),
        'losses': gsi_public_player_state.get('losses'),
        'win_streak': gsi_public_player_state.get('win_streak'),
        'lose_streak': gsi_public_player_state.get('lose_streak'),
        'net_worth': gsi_public_player_state.get('net_worth'),
        'final_place': gsi_public_player_state.get('final_place'),
        
        # Combat data
        'combat_type': gsi_public_player_state.get('combat_type'),
        'combat_result': gsi_public_player_state.get('combat_result'),
        'combat_duration': gsi_public_player_state.get('combat_duration'),
        'opponent_player_slot': gsi_public_player_state.get('opponent_player_slot'),
        
        # Board and units
        'board_unit_limit': gsi_public_player_state.get('board_unit_limit'),
        'units': gsi_public_player_state.get('units'),
        'item_slots': gsi_public_player_state.get('item_slots'),
        'synergies': gsi_public_player_state.get('synergies'),
        
        # Underlord data
        'underlord': gsi_public_player_state.get('underlord'),
        'underlord_selected_talents': gsi_public_player_state.get('underlord_selected_talents'),
        
        # Event and special data
        'event_tier': gsi_public_player_state.get('event_tier'),
        'owns_event': gsi_public_player_state.get('owns_event'),
        'is_mirrored_match': gsi_public_player_state.get('is_mirrored_match'),
        
        # Connection status
        'connection_status': gsi_public_player_state.get('connection_status'),
        'disconnected_time': gsi_public_player_state.get('disconnected_time'),
        
        # VS opponent stats
        'vs_opponent_wins': gsi_public_player_state.get('vs_opponent_wins'),
        'vs_opponent_losses': gsi_public_player_state.get('vs_opponent_losses'),
        'vs_opponent_draws': gsi_public_player_state.get('vs_opponent_draws'),
        
        # Special mechanics
        'brawny_kills_float': gsi_public_player_state.get('brawny_kills_float'),

        # Player data
        'city_prestige_level': gsi_public_player_state.get('city_prestige_level'),
        'rank_tier': gsi_public_player_state.get('rank_tier'),
        'platform': gsi_public_player_state.get('platform'),
        
        # Board buddy
        'board_buddy': gsi_public_player_state.get('board_buddy'),
        
        # Lobby info
        'lobby_team': gsi_public_player_state.get('lobby_team'),
        
        # Technical
        'sequence_number': gsi_public_player_state.get('sequence_number'),
        'timestamp': timestamp.isoformat(),
        
        # Round tracking
        'round_number': match_state.round_number,
        'round_phase': match_state.round_phase,
        
        # Match count (how many previous matches we've seen this player in)
        'match_count': match_state.player_match_counts.get(account_id, 0)
    }
    
    # Store in match state
    match_state.latest_processed_public_player_states[account_id] = processed_public_player_state
    
    # Detect combat completion (if we have previous state)
    if previous_state is not None:
        detect_and_record_combat(account_id, processed_public_player_state, previous_state, timestamp)
    
    return processed_public_player_state


def process_and_store_gsi_private_player_state(gsi_private_player_state: Dict, timestamp: datetime) -> Dict:
    """Process raw GSI private player state data and store in match state.
    
    Returns:
        Dict: Processed private player state data
    """
    # Build comprehensive private player state
    processed_private_player_state = {
        # Basic info
        'player_slot': gsi_private_player_state.get('player_slot'),
        'sequence_number': gsi_private_player_state.get('sequence_number'),
        
        # Shop & Economy
        'shop_units': gsi_private_player_state.get('shop_units'),
        'shop_locked': gsi_private_player_state.get('shop_locked'),
        'reroll_cost': gsi_private_player_state.get('reroll_cost'),
        'gold_earned_this_round': gsi_private_player_state.get('gold_earned_this_round'),
        'shop_generation_id': gsi_private_player_state.get('shop_generation_id'),
        
        # Underlord Selection
        'can_select_underlord': gsi_private_player_state.get('can_select_underlord'),
        'underlord_picker_offering': gsi_private_player_state.get('underlord_picker_offering'),
        
        # Challenges & Rewards
        #'challenges': gsi_private_player_state.get('challenges'),
        #'unclaimed_reward_count': gsi_private_player_state.get('unclaimed_reward_count'),
        #'oldest_unclaimed_reward': gsi_private_player_state.get('oldest_unclaimed_reward'),
        'used_item_reward_reroll_this_round': gsi_private_player_state.get('used_item_reward_reroll_this_round'),
        #'grants_rewards': gsi_private_player_state.get('grants_rewards'),
        
        # Timestamp
        'timestamp': timestamp.isoformat()
    }
    
    # Store in match state (only one private player - client owner)
    match_state.latest_processed_private_player_state = processed_private_player_state
    
    return processed_private_player_state


def emit_realtime_update():
    """Emit real-time update directly from in-memory game state."""
    if not match_state.match_id or len(connected_clients) == 0:
        return
    
    # Build update payload from memory
    update_data = {
        'match': {
            'match_id': match_state.match_id,
            'started_at': match_state.match_start.isoformat() if match_state.match_start else None,
            'player_count': len(match_state.latest_processed_public_player_states)
        },
        'public_player_states': list(match_state.latest_processed_public_player_states.values()),
        'private_player_state': match_state.latest_processed_private_player_state,  # Private data for client owner
        'current_round': {
            'round_number': match_state.round_number,
            'round_phase': match_state.round_phase
        },
        'timestamp': time.time()
    }
    
    # Add combat results if there are new combats
    if match_state.new_combats_this_update:
        # Convert to JSON-serializable format (account_id as string key for JSON)
        combat_results = {}
        for acc_id, combats in match_state.new_combats_this_update.items():
            combat_results[str(acc_id)] = combats
        update_data['combat_results'] = combat_results
        # Clear after adding to payload
        match_state.new_combats_this_update = {}
    
    # Emit immediately - broadcast to ALL connected clients!
    socketio.emit('match_update', update_data, to=None)


# ==========================================
# Match Lifecycle Functions
# ==========================================

def start_new_match(players_data: List[Dict], timestamp: datetime) -> str:
    """Start a new match with the given players."""
    # Generate match_id
    match_id = generate_match_id(players_data)
    
    # Calculate match counts for each player BEFORE creating the match
    # This ensures the count excludes the current match
    from .utils import generate_bot_account_id
    player_match_counts = {}
    for player in players_data:
        is_human = player.get('is_human_player')
        if is_human is False:
            # Bot player - generate account_id
            account_id = generate_bot_account_id(player)
        else:
            # Human player - use account_id directly from raw data
            account_id = player.get('account_id')
        
        if account_id:
            match_count = db.get_player_match_count(account_id)
            player_match_counts[account_id] = match_count
    
    # Create match in database
    db.create_match(match_id, players_data, timestamp)
    
    # Store match counts in match state for use when processing player states
    match_state.player_match_counts = player_match_counts
    
    # Update match state
    match_state.match_id = match_id
    match_state.match_start = timestamp
    match_state.latest_processed_public_player_states = {}
    match_state.sequences = {}
    
    # Update stats
    stats['match_count'] += 1
    
    print(f"\n{'='*60}")
    print(f"[MATCH START] Match ID: {match_id}")
    print(f"              Players: {len(players_data)}")
    print(f"{'='*60}\n")
    
    return match_id


def check_match_end(match_id: str, timestamp: datetime) -> bool:
    """Check if match has ended using in-memory player states."""
    if not match_state.latest_processed_public_player_states:
        return False
    
    # Count players with final_place > 0
    eliminated = [p for p in match_state.latest_processed_public_player_states.values() if p.get('final_place', 0) > 0]
    still_playing = [p for p in match_state.latest_processed_public_player_states.values() if p.get('final_place', 0) == 0]
    
    # Check if someone got 2nd place
    second_place = [p for p in match_state.latest_processed_public_player_states.values() if p.get('final_place', 0) == 2]
    if second_place:
        # Check if winner (final_place = 1) already exists
        winner = [p for p in match_state.latest_processed_public_player_states.values() if p.get('final_place', 0) == 1]
        
        if not winner and still_playing:
            # No winner yet, assign it to the remaining player
            winner_player = still_playing[0]
            winner_id = winner_player['account_id']
            print(f"[MATCH END] Player {second_place[0]['account_id']} got 2nd, marking {winner_id} as winner")
            
            # Queue match end transaction to avoid race conditions
            try:
                # Update in-memory state immediately
                match_state.latest_processed_public_player_states[winner_id]['final_place'] = 1
                
                # Queue all match end operations as a single transaction
                db_write_queue.put(('match_end_transaction', match_id, winner_id, timestamp))
                print(f"[MATCH END] Match {match_id} ended - transaction queued")
                return True
            except Exception as e:
                print(f"[ERROR] Failed to queue match end transaction: {e}")
                return False
    
    # After any final_place update, check if ALL players have final places
    # Recalculate still_playing in case it changed
    still_playing = [p for p in match_state.latest_processed_public_player_states.values() if p.get('final_place', 0) == 0]
    if len(still_playing) == 0 and len(match_state.latest_processed_public_player_states) > 0:
        print(f"[MATCH END] All {len(match_state.latest_processed_public_player_states)} players have final places - ending match")
        # All players have final places, just update match end time
        db_write_queue.put(('update_match_end', match_id, timestamp))
        return True
    
    return False


def abandon_match(match_id: str, timestamp: datetime, reason: str = "Manual"):
    """Mark a match as abandoned and reset game state."""
    print(f"[MATCH ABANDONED] Match {match_id} - Reason: {reason}")
    
    # Queue database update: set match end time
    db_write_queue.put(('update_match_end', match_id, timestamp))
    
    # Reset match state to allow new game detection
    match_state.reset()

    # Clear change detector buffer and previous states for abandoned match
    change_detector.clear_match(match_id)
    
    # Emit update to connected clients
    socketio.emit('match_abandoned', {
        'match_id': match_id,
        'reason': reason,
        'timestamp': timestamp.isoformat()
    }, to=None)


# ==========================================
# Buffer Management Functions
# ==========================================

def cleanup_buffers():
    """
    Clean up buffers to prevent excessive memory usage.
    Since validation happens on entry, all entries are already valid.
    Only cleanup needed: limit buffer size and keep latest private state.
    """
    # For public player buffer, limit size to prevent memory issues
    # Keep most recent entries (in case match detection is delayed)
    MAX_PUBLIC_BUFFER_SIZE = 1000
    if len(match_state.public_player_buffer) > MAX_PUBLIC_BUFFER_SIZE:
        # Keep the most recent entries
        removed_count = len(match_state.public_player_buffer) - MAX_PUBLIC_BUFFER_SIZE
        match_state.public_player_buffer = match_state.public_player_buffer[-MAX_PUBLIC_BUFFER_SIZE:]
        print(f"[BUFFER CLEANUP] Removed {removed_count} old entries from public_player_buffer (size limit)")
    
    # For private player buffer, keep only the latest entry (private state is simpler)
    # This prevents accumulation of old private states
    if len(match_state.private_player_buffer) > 1:
        # Find the latest by sequence number
        latest_private = None
        latest_sequence = -1
        latest_time = None
        
        for gsi_private_state, private_time in match_state.private_player_buffer:
            private_sequence = gsi_private_state.get('sequence_number', 0)
            if private_sequence > latest_sequence:
                latest_sequence = private_sequence
                latest_private = gsi_private_state
                latest_time = private_time
        
        if latest_private is not None:
            removed_count = len(match_state.private_player_buffer) - 1
            if removed_count > 0:
                print(f"[BUFFER CLEANUP] Removed {removed_count} stale entries from private_player_buffer")
            match_state.private_player_buffer = [(latest_private, latest_time)]


def process_buffered_data(match_id: str, timestamp: datetime):
    """Process buffered data for newly started match. Derives confirmed players from buffer."""
    # Copy buffers to local variables before clearing to prevent race conditions
    # This ensures we only process data that was buffered before match started
    public_buffer = match_state.public_player_buffer[:]
    private_buffer = match_state.private_player_buffer[:]
    
    # Clear buffers immediately to prevent any new data from being mixed in
    match_state.public_player_buffer = []
    match_state.private_player_buffer = []
    
    # Derive confirmed players from buffer (should be 8 unique players)
    # Buffer format: (gsi_state, timestamp, account_id) tuples
    confirmed_players = set(acc_id for _, _, acc_id in public_buffer)
    
    # Process public player states - find and store latest state for each player in one pass
    latest_public_player_states = {}  # account_id -> (gsi_state, time, sequence)
    
    for gsi_buf_state, buf_time, buf_account_id in public_buffer:
        # Only process confirmed players (all data in buffer should be valid since we validated on entry)
        if buf_account_id in confirmed_players:
            buf_sequence = gsi_buf_state.get('sequence_number', 0)
            if (buf_account_id not in latest_public_player_states or 
                buf_sequence > latest_public_player_states[buf_account_id][2]):
                latest_public_player_states[buf_account_id] = (gsi_buf_state, buf_time, buf_sequence)
    
    # Process all latest public player states
    for account_id, (gsi_state, time, sequence) in latest_public_player_states.items():
        processed_public_state = process_and_store_gsi_public_player_state(account_id, gsi_state, time)
        match_state.sequences[account_id] = sequence
        db_write_queue.put(('insert_snapshot', match_id, 'public_player', account_id, processed_public_state, time))
        print(f"[BUFFER] Queued buffered public snapshot for player {account_id}, match {match_id}")
    
    # Process private player states - find and process latest in one pass
    # Filter out stale private states from a previous match by comparing timestamps
    # with the earliest valid public buffer entry. Private states that arrived before
    # any valid new-game public state are likely leftover post-match data.
    earliest_public_time = min(buf_time for _, buf_time, _ in public_buffer) if public_buffer else None
    
    latest_gsi_private_player_state = None
    latest_private_time = None
    latest_private_sequence = 0
    stale_count = 0
    
    for gsi_private_state, private_time in private_buffer:
        # Skip private states that predate the earliest valid public state
        if earliest_public_time and private_time < earliest_public_time:
            stale_count += 1
            continue
        private_sequence = gsi_private_state.get('sequence_number', 0)
        if private_sequence > latest_private_sequence:
            latest_private_sequence = private_sequence
            latest_gsi_private_player_state = gsi_private_state
            latest_private_time = private_time
    
    if stale_count > 0:
        print(f"[BUFFER] Filtered {stale_count} stale private state(s) from previous match (arrived before earliest valid public state)")
    
    # Process the latest private player state
    # NOTE: Do NOT set match_state.sequences['private_sequence'] here.
    # The buffer may contain stale private states from a previous match (post-match GSI payloads).
    # If we initialize private_sequence from a stale high value, all new-match private states
    # (which have reset/lower sequence numbers) would be silently rejected.
    # Leaving private_sequence unset ensures the first real-time private state is always accepted.
    if latest_gsi_private_player_state is not None:
        processed_private_state = process_and_store_gsi_private_player_state(latest_gsi_private_player_state, latest_private_time)
        db_write_queue.put(('insert_snapshot', match_id, 'private_player', None, processed_private_state, latest_private_time))
        print(f"[BUFFER] Queued buffered private snapshot for match {match_id}")
    
    # Initialize change detector previous states with latest processed states
    # This ensures the first real-time update can detect changes against the last buffered snapshot
    for account_id, processed_state in match_state.latest_processed_public_player_states.items():
        change_detector.update_previous_state(match_id, account_id, processed_state)
        print(f"[BUFFER] Initialized change detector previous state for player {account_id}, match {match_id}")

