"""
Match Management - Match lifecycle, end detection, abandonment
"""
from datetime import datetime
from typing import List, Dict
from .match_state import match_state, db, stats, db_write_queue
from .utils import generate_match_id, get_account_id
from .game_logic import process_and_store_gsi_public_player_state, process_and_store_gsi_private_player_state, emit_realtime_update
from .config import socketio


def start_new_match(players_data: List[Dict], timestamp: datetime) -> str:
    """Start a new match with the given players."""
    # Generate match_id
    match_id = generate_match_id(players_data)
    
    # Create match in database
    db.create_match(match_id, players_data, timestamp)
    
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
    
    # Emit update to connected clients
    socketio.emit('match_abandoned', {
        'match_id': match_id,
        'reason': reason,
        'timestamp': timestamp.isoformat()
    }, to=None)


def process_buffered_data(match_id: str, confirmed_players: set, timestamp: datetime):
    """Process buffered data for newly started match."""
    # Process public player states - find and store latest state for each player in one pass
    latest_public_player_states = {}  # account_id -> (gsi_state, time, sequence)
    
    for gsi_buf_state, buf_time in match_state.public_player_buffer:
        buf_account_id = get_account_id(gsi_buf_state)
        buf_sequence = gsi_buf_state['sequence_number']
        
        if buf_account_id in confirmed_players:
            if (buf_account_id not in latest_public_player_states or 
                buf_sequence > latest_public_player_states[buf_account_id][2]):
                latest_public_player_states[buf_account_id] = (gsi_buf_state, buf_time, buf_sequence)
    
    # Process all latest public player states
    for account_id, (gsi_state, time, sequence) in latest_public_player_states.items():
        process_and_store_gsi_public_player_state(account_id, gsi_state, time)
        match_state.sequences[account_id] = sequence
        db_write_queue.put(('insert_snapshot', match_id, account_id, gsi_state, time))
    
    # Process private player states - find and process latest in one pass
    latest_gsi_private_player_state = None
    latest_private_time = None
    latest_private_sequence = 0
    
    for gsi_private_state, private_time in match_state.private_player_buffer:
        private_sequence = gsi_private_state['sequence_number']
        if private_sequence > latest_private_sequence:
            latest_private_sequence = private_sequence
            latest_gsi_private_player_state = gsi_private_state
            latest_private_time = private_time
    
    # Process the latest private player state
    if latest_gsi_private_player_state is not None:
        process_and_store_gsi_private_player_state(latest_gsi_private_player_state, latest_private_time)
        match_state.sequences['private_sequence'] = latest_private_sequence
        db_write_queue.put(('insert_snapshot', match_id, 'private_player', latest_gsi_private_player_state, latest_private_time))
    
    # Clear both buffers
    match_state.public_player_buffer = []
    match_state.private_player_buffer = []

