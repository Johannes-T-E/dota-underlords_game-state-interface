"""
Database manager for Dota Underlords GSI data.
Uses SQLite for efficient storage and real-time querying.
"""

import sqlite3
import hashlib
import json
from typing import Dict, List, Optional, Literal, Any
from datetime import datetime
from pathlib import Path
import os
from .utils import generate_bot_account_id


PlayerCategory = Literal['public_player', 'private_player']


class UnderlordsDatabaseManager:
    """Manages SQLite database for Underlords GSI data."""
    
    # Field mapping constants for public snapshots
    PUBLIC_SNAPSHOT_FIELDS = [
        'sequence_number', 'health', 'gold', 'level', 'xp', 'next_level_xp',
        'wins', 'losses', 'win_streak', 'lose_streak', 'net_worth',
        'player_slot', 'combat_type', 'combat_result', 'combat_duration', 'opponent_player_slot',
        'underlord', 'board_unit_limit',
        'rank_tier', 'final_place', 'platform',
        'vs_opponent_wins', 'vs_opponent_losses', 'vs_opponent_draws',
        'brawny_kills_float', 'city_prestige_level', 'event_tier', 'owns_event', 'is_mirrored_match',
        'connection_status', 'disconnected_time', 'lobby_team',
        'round_number', 'round_phase'
    ]
    
    PUBLIC_SNAPSHOT_JSON_FIELDS = {
        'underlord_talents': 'underlord_selected_talents',
        'synergies_json': 'synergies',
        'board_buddy_json': 'board_buddy',
        'units_json': 'units',
        'items_json': 'items'
    }
    
    # Field mapping constants for private snapshots
    # Order: all direct fields first, then all JSON fields (matches public snapshot pattern)
    PRIVATE_SNAPSHOT_FIELDS = [
        'sequence_number', 'player_slot',
        'shop_locked', 'reroll_cost', 'gold_earned_this_round', 'shop_generation_id',
        'can_select_underlord',
        'unclaimed_reward_count', 'used_item_reward_reroll_this_round', 'grants_rewards'
    ]
    
    PRIVATE_SNAPSHOT_JSON_FIELDS = {
        'shop_units_json': 'shop_units',
        'underlord_picker_offering_json': 'underlord_picker_offering',
        'oldest_unclaimed_reward_json': 'oldest_unclaimed_reward'
    }
    
    
    def __init__(self, db_path: Optional[str] = None) -> None:
        # Default to parent directory if not specified
        if db_path is None:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'underlords_gsi_v4.db')
        self.db_path = db_path
        self.conn = None
        self.init_database()
    
    def init_database(self) -> None:
        """Initialize database connection and create tables if they don't exist."""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Enable column access by name
        self.create_tables()
        self.migrate_add_round_columns()
    
    def create_tables(self) -> None:
        """Create all necessary tables."""
        cursor = self.conn.cursor()
        
        # Matches table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS matches (
                match_id TEXT PRIMARY KEY,
                started_at TIMESTAMP,
                ended_at TIMESTAMP,
                player_count INTEGER DEFAULT 8,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Players in a match
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS match_players (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT,
                account_id INTEGER,
                persona_name TEXT,
                bot_persona_name TEXT,
                player_slot INTEGER,
                is_human_player BOOLEAN,
                platform INTEGER,
                final_place INTEGER DEFAULT 0,
                FOREIGN KEY (match_id) REFERENCES matches(match_id),
                UNIQUE(match_id, account_id)
            )
        """)
        
        # Public player snapshots (state at each update) with JSON data
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS public_player_snapshots (
                snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT,
                account_id INTEGER,
                sequence_number INTEGER,
                timestamp TIMESTAMP,
                
                -- Core stats
                health INTEGER,
                gold INTEGER,
                level INTEGER,
                xp INTEGER,
                next_level_xp INTEGER,
                wins INTEGER,
                losses INTEGER,
                win_streak INTEGER,
                lose_streak INTEGER,
                net_worth INTEGER,
                
                -- Match context
                player_slot INTEGER,
                combat_type INTEGER,
                combat_result INTEGER,
                combat_duration FLOAT,
                opponent_player_slot INTEGER,
                
                -- Underlord
                underlord INTEGER,
                underlord_talents TEXT,  -- JSON array
                board_unit_limit INTEGER,
                
                -- Additional stats
                rank_tier INTEGER,
                final_place INTEGER,
                platform INTEGER,
                
                -- Combat and match data
                synergies_json TEXT,  -- JSON array
                vs_opponent_wins INTEGER,
                vs_opponent_losses INTEGER,
                vs_opponent_draws INTEGER,
                brawny_kills_float FLOAT,
                city_prestige_level INTEGER,
                event_tier INTEGER,
                owns_event BOOLEAN,
                is_mirrored_match BOOLEAN,
                connection_status INTEGER,
                disconnected_time FLOAT,
                board_buddy_json TEXT,  -- JSON object
                lobby_team INTEGER,
                
                -- JSON data
                units_json TEXT,
                items_json TEXT,
                
                -- Round tracking
                round_number INTEGER,
                round_phase TEXT,
                
                FOREIGN KEY (match_id) REFERENCES matches(match_id)
            )
        """)
        
        # Private player snapshots (only for human player)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS private_player_snapshots (
                snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT,
                sequence_number INTEGER,
                timestamp TIMESTAMP,
                player_slot INTEGER,
                
                -- Shop & Economy
                shop_units_json TEXT,  -- JSON array
                shop_locked BOOLEAN,
                reroll_cost INTEGER,
                gold_earned_this_round INTEGER,
                shop_generation_id INTEGER,
                
                -- Underlord Selection
                can_select_underlord BOOLEAN,
                underlord_picker_offering_json TEXT,  -- JSON array
                
                -- Challenges & Rewards
                unclaimed_reward_count INTEGER,
                oldest_unclaimed_reward_json TEXT,  -- JSON object
                used_item_reward_reroll_this_round BOOLEAN,
                grants_rewards INTEGER,
                
                FOREIGN KEY (match_id) REFERENCES matches(match_id)
            )
        """)
        
        # Create indexes for performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_match_players ON match_players(match_id, account_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_public_snapshots_player ON public_player_snapshots(account_id, sequence_number)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_public_snapshots_match ON public_player_snapshots(match_id, timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_public_snapshots_round ON public_player_snapshots(match_id, account_id, round_number, round_phase)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_private_snapshots_match ON private_player_snapshots(match_id, timestamp)")
        
        self.conn.commit()
    
    def migrate_add_round_columns(self) -> None:
        """Add round_number and round_phase columns to existing databases if they don't exist."""
        cursor = self.conn.cursor()
        
        # Check if columns exist by querying table info
        cursor.execute("PRAGMA table_info(public_player_snapshots)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Add round_number if it doesn't exist
        if 'round_number' not in columns:
            try:
                cursor.execute("ALTER TABLE public_player_snapshots ADD COLUMN round_number INTEGER")
                print("[MIGRATION] Added round_number column to public_player_snapshots")
            except sqlite3.OperationalError as e:
                print(f"[MIGRATION] Could not add round_number: {e}")
        
        # Add round_phase if it doesn't exist
        if 'round_phase' not in columns:
            try:
                cursor.execute("ALTER TABLE public_player_snapshots ADD COLUMN round_phase TEXT")
                print("[MIGRATION] Added round_phase column to public_player_snapshots")
            except sqlite3.OperationalError as e:
                print(f"[MIGRATION] Could not add round_phase: {e}")
        
        # Add index if it doesn't exist
        try:
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_public_snapshots_round ON public_player_snapshots(match_id, account_id, round_number, round_phase)")
        except sqlite3.OperationalError as e:
            print(f"[MIGRATION] Could not create round index: {e}")
        
        self.conn.commit()
    
    def create_match(self, match_id: str, players_data: List[Dict], timestamp: datetime) -> str:
        """
        Create new match - no logic, just insert.
        """
        print(f"[DB DEBUG] create_match called with match_id: {match_id}")
        
        cursor = self.conn.cursor()
        
        # Create new match
        cursor.execute("""
            INSERT OR IGNORE INTO matches (match_id, started_at, player_count)
            VALUES (?, ?, ?)
        """, (match_id, timestamp, len(players_data)))
        print(f"[DB DEBUG] Match record inserted")
        
        # Insert players
        print(f"[DB DEBUG] Inserting {len(players_data)} players...")
        for i, player in enumerate(players_data):
            # Get account_id - for bots generate it, for humans use raw data
            is_human = player.get('is_human_player')
            if is_human is False:
                # Bot player - generate account_id
                account_id = generate_bot_account_id(player)
            else:
                # Human player - use account_id directly from raw data
                account_id = player.get('account_id')
            
            print(f"[DB DEBUG] Player {i+1}: account_id={account_id} (is_human={is_human})")
            
            cursor.execute("""
                INSERT OR IGNORE INTO match_players 
                (match_id, account_id, persona_name, bot_persona_name, 
                 player_slot, is_human_player, platform)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                match_id,
                account_id,
                player.get('persona_name'),
                player.get('bot_persona_name'),
                player.get('player_slot'),
                is_human,
                player.get('platform')
            ))
        
        print(f"[DB DEBUG] Committing transaction...")
        self.conn.commit()
        print(f"[OK] Created new match: {match_id} with {len(players_data)} players")
        return match_id
    
    def _execute_with_retry(self, sql: str, params: tuple):
        """
        Execute SQL with automatic retry on SQLite transaction errors.
        Only retries on specific "cannot start a transaction within a transaction" error.
        Re-raises all other exceptions immediately.
        """
        try:
            cursor = self.conn.cursor()
            cursor.execute(sql, params)
            return cursor
        except sqlite3.OperationalError as e:
            if "cannot start a transaction within a transaction" in str(e):
                self.conn.rollback()
                cursor = self.conn.cursor()
                cursor.execute(sql, params)
                return cursor
            else:
                raise
    
    def _serialize_json_field(self, data: Any) -> str:
        """
        Serialize a field to JSON string.
        Requires the field to exist - no defaults. Let KeyError propagate if missing.
        """
        return json.dumps(data)
    
    def _build_public_snapshot_values(self, player_data: Dict) -> tuple:
        """Build values tuple for public snapshot insert, handling missing fields."""
        values = []
        # Direct fields - use .get() with None as default for missing fields
        for field in self.PUBLIC_SNAPSHOT_FIELDS:
            values.append(player_data.get(field))
        # JSON fields - use .get() with None as default, serialize None as "null"
        for db_column, gsi_field in self.PUBLIC_SNAPSHOT_JSON_FIELDS.items():
            field_value = player_data.get(gsi_field)
            if field_value is None:
                values.append("null")
            else:
                values.append(self._serialize_json_field(field_value))
        return tuple(values)
    
    def _build_private_snapshot_values(self, private_data: Dict) -> tuple:
        """Build values tuple for private snapshot insert, handling missing fields."""
        values = []
        # Direct fields - use .get() with None as default for missing fields
        for field in self.PRIVATE_SNAPSHOT_FIELDS:
            values.append(private_data.get(field))
        # JSON fields - use .get() with None as default, serialize None as "null"
        for db_column, gsi_field in self.PRIVATE_SNAPSHOT_JSON_FIELDS.items():
            field_value = private_data.get(gsi_field)
            if field_value is None:
                values.append("null")
            else:
                values.append(self._serialize_json_field(field_value))
        return tuple(values)
    
    def _insert_public_snapshot(self, match_id: str, account_id: int, player_data: Dict, timestamp: datetime) -> int:
        """Insert public player snapshot with all fields."""
        cursor = self.conn.cursor()
        
        field_values = self._build_public_snapshot_values(player_data)
        # SQL expects: match_id, account_id, sequence_number, timestamp, then all direct fields, then all JSON fields
        # field_values starts with sequence_number, so we need to insert timestamp after it
        params = (match_id, account_id, field_values[0], timestamp, *field_values[1:])
        
        cursor.execute("""
            INSERT INTO public_player_snapshots (
                match_id, account_id, sequence_number, timestamp,
                health, gold, level, xp, next_level_xp,
                wins, losses, win_streak, lose_streak, net_worth,
                player_slot, combat_type, combat_result, combat_duration, opponent_player_slot,
                underlord, board_unit_limit,
                rank_tier, final_place, platform,
                vs_opponent_wins, vs_opponent_losses, vs_opponent_draws,
                brawny_kills_float, city_prestige_level, event_tier, owns_event, is_mirrored_match,
                connection_status, disconnected_time, lobby_team,
                underlord_talents, synergies_json, board_buddy_json, units_json, items_json,
                round_number, round_phase
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, params)
        
        return cursor.lastrowid
    
    def insert_snapshot(self, match_id: str, player_category: PlayerCategory, account_id: Optional[int] = None, player_data: Dict = None, timestamp: datetime = None) -> int:
        """
        Insert player snapshot (public or private).
        
        Args:
            match_id: Match identifier
            player_category: 'public_player' or 'private_player'
            account_id: Required for 'public_player', ignored for 'private_player'
            player_data: Player data dictionary
            timestamp: Timestamp for the snapshot
            
        Returns:
            Last inserted row ID
        """
        if player_data is None:
            raise ValueError("player_data is required")
        if timestamp is None:
            raise ValueError("timestamp is required")
        
        if player_category == 'private_player':
            return self._insert_private_snapshot(match_id, player_data, timestamp)
        elif player_category == 'public_player':
            if account_id is None:
                raise ValueError("account_id is required for public_player snapshots")
            return self._insert_public_snapshot(match_id, account_id, player_data, timestamp)
        else:
            raise ValueError(f"Invalid player_category: {player_category}. Must be 'public_player' or 'private_player'")
    
    def insert_public_snapshot(self, match_id: str, account_id: int, player_data: Dict, timestamp: datetime) -> int:
        """Insert public player snapshot with all fields. Public wrapper for backward compatibility."""
        return self._insert_public_snapshot(match_id, account_id, player_data, timestamp)
    
    def insert_private_snapshot(self, match_id: str, private_data: Dict, timestamp: datetime) -> int:
        """Insert private player snapshot with all fields. Public wrapper for backward compatibility."""
        return self._insert_private_snapshot(match_id, private_data, timestamp)
    
    def _insert_private_snapshot(self, match_id: str, private_data: Dict, timestamp: datetime) -> int:
        """Insert private player snapshot."""
        cursor = self.conn.cursor()
        
        field_values = self._build_private_snapshot_values(private_data)
        # SQL expects: match_id, sequence_number, timestamp, player_slot, then rest of fields
        # field_values starts with sequence_number, so we need to insert timestamp after it
        params = (match_id, field_values[0], timestamp, *field_values[1:])
        
        cursor.execute("""
            INSERT INTO private_player_snapshots (
                match_id, sequence_number, timestamp, player_slot,
                shop_locked, reroll_cost, gold_earned_this_round, shop_generation_id,
                can_select_underlord, unclaimed_reward_count, used_item_reward_reroll_this_round, grants_rewards,
                shop_units_json, underlord_picker_offering_json, oldest_unclaimed_reward_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, params)
        
        return cursor.lastrowid
    
    def update_match_end_time(self, match_id: str, timestamp: datetime) -> None:
        """Update match ended_at timestamp."""
        self._execute_with_retry(
            "UPDATE matches SET ended_at = ? WHERE match_id = ?",
            (timestamp, match_id)
        )
    
    def update_player_final_place(self, match_id: str, account_id: int, final_place: int, timestamp: datetime) -> None:
        """Update a player's final_place in their latest snapshot."""
        self._execute_with_retry(
            """UPDATE public_player_snapshots 
               SET final_place = ?
               WHERE match_id = ? AND account_id = ? AND sequence_number = (
                   SELECT MAX(sequence_number) 
                   FROM public_player_snapshots 
                   WHERE match_id = ? AND account_id = ?
               )""",
            (final_place, match_id, account_id, match_id, account_id)
        )
    
    def update_match_player_final_place(self, match_id: str, account_id: int, final_place: int) -> None:
        """Update a player's final_place in the match_players table."""
        self._execute_with_retry(
            "UPDATE match_players SET final_place = ? WHERE match_id = ? AND account_id = ?",
            (final_place, match_id, account_id)
        )
    
    def execute_in_transaction(self, operations: List[Dict]) -> None:
        """Execute multiple database operations in a single transaction."""
        cursor = self.conn.cursor()
        for operation in operations:
            cursor.execute(operation['sql'], operation['params'])
    
    def delete_match(self, match_id: str) -> None:
        """Delete a match and all associated data."""
        cursor = self.conn.cursor()
        
        # Delete in order: snapshots first, then players, then match
        cursor.execute("DELETE FROM private_player_snapshots WHERE match_id = ?", (match_id,))
        cursor.execute("DELETE FROM public_player_snapshots WHERE match_id = ?", (match_id,))
        cursor.execute("DELETE FROM match_players WHERE match_id = ?", (match_id,))
        cursor.execute("DELETE FROM matches WHERE match_id = ?", (match_id,))
        
        print(f"[DB] Deleted match {match_id} and all associated data")

    def get_all_matches(self) -> List[Dict]:
        """Get list of all matches with basic info and player data."""
        cursor = self.conn.cursor()
        # Get all matches
        cursor.execute("""
            SELECT 
                match_id,
                started_at,
                ended_at,
                player_count,
                created_at
            FROM matches
            ORDER BY started_at DESC
        """)
        
        matches = []
        for row in cursor.fetchall():
            match_id = row[0]
            
            # Get players for this match
            cursor.execute("""
                SELECT 
                    mp.account_id,
                    mp.persona_name,
                    mp.bot_persona_name,
                    COALESCE(
                        (SELECT final_place FROM public_player_snapshots 
                         WHERE match_id = ?
                           AND account_id = mp.account_id 
                           AND final_place > 0 
                         ORDER BY timestamp DESC LIMIT 1), 0
                    ) as final_place
                FROM match_players mp
                WHERE mp.match_id = ?
            """, (match_id, match_id))
            
            players = []
            for player_row in cursor.fetchall():
                players.append({
                    'account_id': player_row[0],
                    'persona_name': player_row[1],
                    'bot_persona_name': player_row[2],
                    'final_place': player_row[3]
                })
            
            matches.append({
                'match_id': match_id,
                'started_at': row[1],
                'ended_at': row[2],
                'player_count': row[3],
                'created_at': row[4],
                'players': players
            })
        
        return matches

    def close(self) -> None:
        """Close database connection."""
        if self.conn:
            self.conn.close()

