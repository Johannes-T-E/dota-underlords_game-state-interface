
from typing import List, Dict
import hashlib

players_data = [
    {"account_id": 12344, "player_slot": 1},
    {"account_id": 12346, "player_slot": 2},
    {"account_id": 12347, "player_slot": 3},
    {"account_id": 12348, "player_slot": 4},
    {"account_id": 0, "player_slot": 5, "bot_persona_name": "bot_1"},
    {"account_id": 0, "player_slot": 6, "bot_persona_name": "bot_2"},
    {"account_id": 12349, "player_slot": 7},
    {"account_id": 12350, "player_slot": 8}
]

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


if __name__ == '__main__':
    match_id = generate_match_id(players_data)
    print(f"Generated match ID: {match_id}")