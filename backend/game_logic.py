"""
Game State Logic - Player state updates and round tracking
"""
from datetime import datetime
from typing import Dict
import time

from .match_state import match_state, connected_clients
from .utils import get_highest_hp_player
from .config import socketio


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


def process_and_store_gsi_public_player_state(account_id: int, gsi_public_player_state: Dict, timestamp: datetime):
    """Process raw GSI public player state data and store in match state."""
  
    # Update round tracking based on combat_type transitions
    update_round_from_combat_type(account_id, gsi_public_player_state.get('combat_type'))
    
    # Build full player state with comprehensive data
    # Use GSI data directly - missing fields will be None (no hardcoded fallbacks)
    player_state = {
        # Basic player info
        'account_id': account_id,  # Already normalized from get_account_id() - int for both humans and bots
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
        'items_slots': gsi_public_player_state.get('item_slots'),
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
        'city_prestige_level': gsi_public_player_state.get('city_prestige_level'),
        'rank_tier': gsi_public_player_state.get('rank_tier'),
        'platform': gsi_public_player_state.get('platform'),
        
        # Board buddy
        'board_buddy': gsi_public_player_state.get('board_buddy'),
        
        # Lobby info
        'lobby_team': gsi_public_player_state.get('lobby_team'),
        
        # Modifiers (only include if they have actual values)
        #'reroll_cost_modifier': gsi_public_player_state.get('reroll_cost_modifier'),
        
        # Technical
        'sequence_number': gsi_public_player_state.get('sequence_number'),
        'timestamp': timestamp.isoformat()
    }
    
    # Store in match state
    match_state.latest_processed_public_player_states[account_id] = player_state


def process_and_store_gsi_private_player_state(gsi_private_player_state: Dict, timestamp: datetime):
    """Process raw GSI private player state data and store in match state."""
    # Get or preserve existing private state
    existing_private = match_state.latest_processed_private_player_state
    
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
        'challenges': gsi_private_player_state.get('challenges'),
        'unclaimed_reward_count': gsi_private_player_state.get('unclaimed_reward_count'),
        'oldest_unclaimed_reward': gsi_private_player_state.get('oldest_unclaimed_reward'),
        'used_item_reward_reroll_this_round': gsi_private_player_state.get('used_item_reward_reroll_this_round'),
        'grants_rewards': gsi_private_player_state.get('grants_rewards'),
        
        # Timestamp
        'timestamp': timestamp.isoformat()
    }
    
    # Store in match state (only one private player - client owner)
    match_state.latest_processed_private_player_state = processed_private_player_state


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
    
    # Emit immediately - broadcast to ALL connected clients!
    socketio.emit('match_update', update_data, to=None)

