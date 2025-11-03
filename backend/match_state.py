"""
Match State Management
"""
from datetime import datetime
from .database import UnderlordsDatabaseManager
import threading
from queue import Queue


# Global state
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
        self.candidates = {}            # account_id -> player_data
        self.public_player_buffer = []  # (public_player_state, timestamp) tuples
        self.private_player_buffer = [] # (private_state, timestamp) tuples

    def reset(self):
        """Reset to initial state."""
        self.match_id = None
        self.match_start = None
        self.latest_processed_public_player_states = {}
        self.latest_processed_private_player_state = {}
        self.candidates = {}
        self.sequences = {}
        self.public_player_buffer = []
        self.private_player_buffer = []
        
        # Reset round tracking
        self.tracked_player_account_id = None
        self.last_combat_type = 0
        self.round_number = 1  # Reset to round 1
        self.round_phase = 'prep'  # Reset to prep


# Global match state
match_state = MatchState()

