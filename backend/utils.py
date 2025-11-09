"""
Utility Functions - Pure utility functions with no state dependencies
"""
import hashlib
from typing import Dict, List


def generate_match_id(players_data: List[Dict]) -> str:
    """
    Generate a unique match ID from player IDs and slots.
    This ensures each match gets a unique ID regardless of bots.
    """
    # Sort players by player_slot before processing
    sorted_players = sorted(players_data, key=lambda x: x.get('player_slot'))
    
    # Create a list of player identifiers (account_id + slot)
    player_identifiers = []
    for player in sorted_players:
        account_id = player.get('account_id')
        is_human = player.get('is_human_player',)
        is_bot = is_human is False
        
        if is_bot:
            # Player is a Bot -> generate normalized account_id (ending with "000")
            normalized_account_id = generate_bot_account_id(player)
            player_identifier = str(normalized_account_id)
        else:
            # Player is a Human -> use account_id directly from raw data
            player_identifier = str(account_id)
        
        player_slot = player.get('player_slot')  # (1,2,3,4,5,6,7,8)
        player_identifiers.append(f"{player_identifier}_{player_slot}")
    
    # Sort to ensure consistency 
    sorted_identifiers = sorted(player_identifiers)
    combined = "_".join(sorted_identifiers)
    return hashlib.sha256(combined.encode()).hexdigest()[:16]


def get_highest_hp_player(players: dict) -> int:
    """Find player with highest HP. Used to determine authoritative player for round tracking."""
    if not players:
        return None
    
    max_hp = 0
    highest_hp_player = None
    
    for account_id, player_data in players.items():
        hp = player_data.get('health')
        if hp > max_hp:
            max_hp = hp
            highest_hp_player = account_id
    
    return highest_hp_player


def generate_bot_account_id(gsi_public_player_state) -> int:
    """Generate account_id for bots - returns integer ending with '000' (e.g., 123456000).
    
    This function should ONLY be called for bot players.
    For humans, use account_id directly from raw data.
    """
    bot_name = gsi_public_player_state.get('bot_persona_name')
    
    if bot_name is None:
        raise ValueError("Bot player missing 'bot_persona_name' in public_player_state")
    
    # Hash to value 0-999999, then multiply by 1000 to get "000" ending
    hash_value = abs(hash(bot_name)) % 1000000  # 0 to 999999
    return hash_value * 1000  # Results in 0, 1000, 2000, ..., 999999000


def is_valid_new_player(gsi_public_player_state):
    """Check if this player data represents a valid new game player."""
    return (
        gsi_public_player_state.get('health') == 100 and
        gsi_public_player_state.get('level', 0) == 1 and
        gsi_public_player_state.get('wins', 0) == 0 and
        gsi_public_player_state.get('losses', 0) == 0 and
        gsi_public_player_state.get('xp', 0) == 0
    )

