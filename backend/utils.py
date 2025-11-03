"""
Utility Functions
"""
import hashlib
from typing import Dict, List
from signal import signal, SIGINT, SIGTERM
from .match_state import db, match_state


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


def generate_match_id(players_data: List[Dict]) -> str:
    """
    Generate a unique match ID from player IDs and slots.
    This ensures each match gets a unique ID regardless of bots.
    """
    # Sort players by player_slot before processing
    sorted_players = sorted(players_data, key=lambda x: x.get('player_slot', 0))
    
    # Create a list of player identifiers (account_id + slot)
    player_identifiers = []
    for player in sorted_players:
        account_id = player.get('account_id', 0)
        if account_id == 0:
            # Player is a Bot -> use normalized account_id (hashed bot_persona_name)
            bot_name = player.get('bot_persona_name')
            if bot_name is None:
                player_identifier = 'unknown_bot'
            else:
                # Hash to negative integer (same logic as get_account_id)
                normalized_account_id = -abs(hash(bot_name)) % 999999999 - 1
                player_identifier = str(normalized_account_id)
        else:
            # Player is a Human -> use account_id
            player_identifier = str(account_id)
        
        player_slot = player.get('player_slot', 0)  # (1,2,3,4,5,6,7,8)
        player_identifiers.append(f"{player_identifier}_{player_slot}")
    
    # Sort to ensure consistency 
    sorted_identifiers = sorted(player_identifiers)
    combined = "_".join(sorted_identifiers)
    return hashlib.sha256(combined.encode()).hexdigest()[:16]


def get_highest_hp_player(players: dict) -> int:
    """Find player with highest HP. Used to determine authoritative player for round tracking."""
    if not players:
        return None
    
    max_hp = -1
    highest_hp_player = None
    
    for account_id, player_data in players.items():
        hp = player_data.get('health', 0)
        if hp > max_hp:
            max_hp = hp
            highest_hp_player = account_id
    
    return highest_hp_player


def get_account_id(gsi_public_player_state) -> int:
    """Get account_id - for bots, hash bot_persona_name to negative integer."""
    account_id = gsi_public_player_state.get('account_id')
    if account_id == 0:
        # Bot player - convert bot_persona_name to consistent negative integer
        bot_name = gsi_public_player_state.get('bot_persona_name')
        if bot_name is None:
            raise ValueError("Bot player missing 'bot_persona_name' in public_player_state")
        # Hash to negative integer (range: -1 to -999999999)
        # Use deterministic hash for consistency
        return -abs(hash(bot_name)) % 999999999 - 1
    return account_id


def is_valid_new_player(gsi_public_player_state):
    """Check if this player data represents a valid new game player."""
    return (
        gsi_public_player_state.get('health') == 100 and
        gsi_public_player_state.get('level', 0) == 1 and
        gsi_public_player_state.get('wins', 0) == 0 and
        gsi_public_player_state.get('losses', 0) == 0 and
        gsi_public_player_state.get('xp', 0) == 0
    )

