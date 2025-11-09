"""
GSI Handler - GSI data processing and database writer
Handles incoming GSI payloads and delegates to game_state for processing
"""
from datetime import datetime
from .game_state import (
    match_state, db, stats, db_write_queue, data_lock,
    process_and_store_gsi_public_player_state, process_and_store_gsi_private_player_state,
    emit_realtime_update, start_new_match, process_buffered_data, check_match_end,
    abandon_match
)
from .utils import generate_bot_account_id, is_valid_new_player
from .config import socketio, PRIVATE_PLAYER_ACCOUNT_ID


def db_writer_worker():
    """Background thread to write to database (SQLite thread-safe)."""
    while True:
        try:
            task = db_write_queue.get()
            if task is None:
                break
            
            # Handle different task types - only support new format with task type
            if isinstance(task, tuple) and len(task) >= 2 and isinstance(task[0], str):
                task_type = task[0]
                
                if task_type == 'insert_snapshot':
                    # New insert task: (task_type, match_id, player_category, account_id, player_data, timestamp)
                    _, match_id, player_category, account_id, player_data, timestamp = task
                    try:
                        snapshot_id = db.insert_snapshot(match_id, player_category, account_id, player_data, timestamp)
                        print(f"[DB Writer] Inserted {player_category} snapshot {snapshot_id} for match {match_id}, player {account_id}")
                    except Exception as e:
                        print(f"[DB Writer] Failed to insert snapshot: {e}")
                        raise
                
                elif task_type == 'update_final_place':
                    # Update final place task: (task_type, match_id, account_id, final_place)
                    _, match_id, account_id, final_place = task
                    db.update_match_player_final_place(match_id, account_id, final_place)
                
                elif task_type == 'update_player_final_place':
                    # Update player final place in snapshots: (task_type, match_id, account_id, final_place, timestamp)
                    _, match_id, account_id, final_place, timestamp = task
                    db.update_player_final_place(match_id, account_id, final_place, timestamp)
                
                elif task_type == 'update_match_end':
                    # Update match end time: (task_type, match_id, timestamp)
                    _, match_id, timestamp = task
                    db.update_match_end_time(match_id, timestamp)
                
                elif task_type == 'match_end_transaction':
                    # Complete match end transaction: (task_type, match_id, winner_id, timestamp)
                    _, match_id, winner_id, timestamp = task
                    # Perform all match end operations in a single transaction
                    try:
                        db.update_player_final_place(match_id, winner_id, 1, timestamp)
                        db.update_match_player_final_place(match_id, winner_id, 1)
                        db.update_match_end_time(match_id, timestamp)
                        print(f"[DB Writer] Match end transaction completed for {match_id}")
                    except Exception as e:
                        print(f"[DB Writer] Match end transaction failed: {e}")
                        db.conn.rollback()
                        raise
                
                elif task_type == 'delete_match':
                    # Delete match: (task_type, match_id)
                    _, match_id = task
                    db.delete_match(match_id)
                    print(f"[DB Writer] Match {match_id} deleted")
                
                else:
                    print(f"[DB Writer] Unknown task type: {task_type}")
            else:
                print(f"[DB Writer] ERROR: Invalid task format: {task}")
                print(f"[DB Writer] Expected format: (task_type, ...) where task_type is a string")
                continue  # Skip invalid tasks
            
            # Commit after each successful task
            db.conn.commit()
            db_write_queue.task_done()
        except Exception as e:
            print(f"[DB Writer] Error: {e}")
            # Rollback on error to ensure clean state
            try:
                db.conn.rollback()
            except:
                pass  # Ignore rollback errors
            import traceback
            traceback.print_exc()


def extract_player_states_from_payload(gsi_payload, timestamp):
    """
    Extract and separate private/public player states from GSI payload structure.
    
    The GSI payload has a nested structure: blocks -> data array -> player states
    Each data object contains either 'private_player_state' or 'public_player_state' key.
    
    Returns:
        tuple: (gsi_private_player_states, gsi_public_player_states) where each is a list of (gsi_player_state_data, timestamp) tuples
    """
    gsi_private_player_states = []
    gsi_public_player_states = []
    
    if 'block' not in gsi_payload:
        return gsi_private_player_states, gsi_public_player_states
    
    # Process all block objects in the "block" array
    for block_object in gsi_payload['block']:
        # Skip block objects that don't have "data" key
        if 'data' not in block_object:
            continue
        
        # Process each data object in the "data" array
        for data_object in block_object['data']:
            # Check for player state keys
            has_private_player_state = 'private_player_state' in data_object
            has_public_player_state = 'public_player_state' in data_object
            
            # Skip data objects that don't have player_state keys
            if not has_private_player_state and not has_public_player_state:
                continue
            
            # Extract private player state
            if has_private_player_state:
                gsi_private_player_state = data_object['private_player_state']
                gsi_private_player_states.append((gsi_private_player_state, timestamp))
            
            # Extract public player state
            if has_public_player_state:
                gsi_public_player_state = data_object['public_player_state']
                gsi_public_player_states.append((gsi_public_player_state, timestamp))
    
    return gsi_private_player_states, gsi_public_player_states


def process_private_player_state(gsi_private_player_state, timestamp):
    """
    Process private player state: buffer if no match, or update memory/DB if match active.
    
    Returns:
        bool: True if update occurred (state was processed for active match), False otherwise
    """
    # No active match - buffer private state separately
    if match_state.match_id is None:
        match_state.private_player_buffer.append((gsi_private_player_state, timestamp))
        return False
    
    # Active match mode
    private_player_sequence_num = gsi_private_player_state['sequence_number']
    
    # Skip if same or older sequence number
    if 'private_sequence' in match_state.sequences and match_state.sequences['private_sequence'] >= private_player_sequence_num:
        return False
    
    # Active match - update memory and store in DB
    # Update sequence tracker
    match_state.sequences['private_sequence'] = private_player_sequence_num
    
    # Update in-memory state and get processed data
    processed_private_state = process_and_store_gsi_private_player_state(gsi_private_player_state, timestamp)
    
    # Queue for DB write (private state) - use processed data
    db_write_queue.put(('insert_snapshot', match_state.match_id, 'private_player', None, processed_private_state, timestamp))
    print(f"[GSI] Queued private snapshot for match {match_state.match_id}, queue size: {db_write_queue.qsize()}")
    
    return True


def process_public_player_state(gsi_public_player_state, timestamp):
    """
    Process public player state - handles both buffering and active match.
    
    Returns:
        bool: True if update occurred (state was processed), False otherwise
    """
    # Get account_id - for bots generate it, for humans use raw data
    is_human = gsi_public_player_state.get('is_human_player')
    if is_human is False:
        # Bot player - generate account_id
        account_id = generate_bot_account_id(gsi_public_player_state)
    else:
        # Human player - use account_id directly from raw data
        account_id = gsi_public_player_state.get('account_id')
    
    # No active match - buffering mode
    if match_state.match_id is None:
        # Validate each object individually - discard invalid data silently
        if not is_valid_new_player(gsi_public_player_state):
            return False  # Discard invalid data, don't ban player
        
        # Check current unique players before adding
        unique_players_before = set(acc_id for _, _, acc_id in match_state.public_player_buffer)
        is_new_player = account_id not in unique_players_before
        
        # Add valid data to buffer (with account_id for tracking unique players)
        match_state.public_player_buffer.append((gsi_public_player_state, timestamp, account_id))
        
        # Check for 8 unique players in buffer
        unique_players = set(acc_id for _, _, acc_id in match_state.public_player_buffer)
        unique_count = len(unique_players)
        
        # Log buffering progress
        if is_new_player:
            print(f"[BUFFER] New player found: {account_id} ({unique_count}/8 unique players in buffer, {len(match_state.public_player_buffer)} total entries)")
        else:
            print(f"[BUFFER] Update for existing player: {account_id} ({unique_count}/8 unique players in buffer, {len(match_state.public_player_buffer)} total entries)")
        
        if unique_count == 8:
            print(f"[BUFFER] Match detected! Found 8 unique players. Processing buffer...")
            # Match detected - extract latest state for each of the 8 players
            # Build dict of latest state per player (by sequence number)
            latest_states = {}  # account_id -> (gsi_state, timestamp, sequence)
            
            for gsi_state, buf_timestamp, buf_account_id in match_state.public_player_buffer:
                sequence = gsi_state.get('sequence_number', 0)
                if (buf_account_id not in latest_states or 
                    sequence > latest_states[buf_account_id][2]):
                    latest_states[buf_account_id] = (gsi_state, buf_timestamp, sequence)
            
            # Extract confirmed players and their data
            confirmed_players = list(unique_players)
            match_players_data = [latest_states[acc_id][0] for acc_id in confirmed_players]
            
            print(f"[BUFFER] Starting match with players: {confirmed_players}")
            
            # Start new match
            match_id = start_new_match(match_players_data, timestamp)
            
            # Process all buffered data for the confirmed players
            process_buffered_data(match_id, timestamp)
            
            # Emit initial state
            emit_realtime_update()
            
            return True
        
        return False
    
    # Active match mode
    sequence_num = gsi_public_player_state['sequence_number']
    
    # Skip if same or older sequence number
    if account_id in match_state.sequences and match_state.sequences[account_id] >= sequence_num:
        return False
    
    # Check if client owner has reset (indicates abandoned previous game)
    if account_id == PRIVATE_PLAYER_ACCOUNT_ID and account_id in match_state.latest_processed_public_player_states:
        old_health = match_state.latest_processed_public_player_states[account_id].get('health', 0)
        old_slot = match_state.latest_processed_public_player_states[account_id].get('player_slot', 0)
        new_health = gsi_public_player_state.get('health', 0)
        new_slot = gsi_public_player_state.get('player_slot', 0)
        
        # Detect game abandonment: health reset to 100 OR slot changed
        if (new_health == 100 and old_health < 100) or (new_slot != old_slot and new_slot > 0):
            print(f"[MATCH ABANDONED] Detected new game start (health: {old_health}→{new_health}, slot: {old_slot}→{new_slot})")
            abandon_match(match_state.match_id, timestamp, reason="Client owner started new game")
            # Don't process this update; it belongs to the new game
            return False
    
    # Only process if player is already in match
    if account_id not in match_state.latest_processed_public_player_states:
        return False
    
    # Update sequence tracker
    match_state.sequences[account_id] = sequence_num
    
    # Update in-memory state and get processed data
    processed_public_state = process_and_store_gsi_public_player_state(account_id, gsi_public_player_state, timestamp)
    
    # Queue for DB write - use processed data
    db_write_queue.put(('insert_snapshot', match_state.match_id, 'public_player', account_id, processed_public_state, timestamp))
    print(f"[GSI] Queued public snapshot for player {account_id}, match {match_state.match_id}, queue size: {db_write_queue.qsize()}")
    
    # Check for match end
    final_place = gsi_public_player_state.get('final_place', 0)
    if final_place > 0:
        # Queue update for match_players table
        db_write_queue.put(('update_final_place', match_state.match_id, account_id, final_place))
        
        if check_match_end(match_state.match_id, timestamp):
            print(f"[MATCH END] Clearing game state")
            # Send final update to frontend before resetting
            emit_realtime_update()
            # Notify frontend that match ended
            socketio.emit('match_ended', {
                'match_id': match_state.match_id,
                'timestamp': timestamp.isoformat()
            }, to=None)
            # Now reset the state
            match_state.reset()
    
    return True


def process_gsi_data(gsi_payload):
    """Process incoming GSI data with parallel memory update and DB storage."""
    with data_lock:
        stats['total_updates'] += 1
        stats['last_update'] = datetime.now()
        
        timestamp = datetime.now()
        
        # Extract player states from payload structure
        gsi_private_player_states, gsi_public_player_states = extract_player_states_from_payload(gsi_payload, timestamp)
        
        any_updates = False
        
        # Process all private player states
        for gsi_private_player_state, state_timestamp in gsi_private_player_states:
            if process_private_player_state(gsi_private_player_state, state_timestamp):
                any_updates = True
        
        # Process all public player states
        for gsi_public_player_state, state_timestamp in gsi_public_player_states:
            if process_public_player_state(gsi_public_player_state, state_timestamp):
                any_updates = True
        
        # Emit WebSocket update if there were updates
        if any_updates and match_state.match_id:
            emit_realtime_update()

