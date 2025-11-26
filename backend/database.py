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
    # Single source of truth: (db_column_name, gsi_field_name, is_json)
    # Order matches INSERT statement exactly
    PUBLIC_SNAPSHOT_FIELDS = [
        # Direct fields
        ('sequence_number', 'sequence_number', False),
        ('health', 'health', False),
        ('gold', 'gold', False),
        ('level', 'level', False),
        ('xp', 'xp', False),
        ('next_level_xp', 'next_level_xp', False),
        ('wins', 'wins', False),
        ('losses', 'losses', False),
        ('win_streak', 'win_streak', False),
        ('lose_streak', 'lose_streak', False),
        ('net_worth', 'net_worth', False),
        ('player_slot', 'player_slot', False),
        ('combat_type', 'combat_type', False),
        ('combat_result', 'combat_result', False),
        ('combat_duration', 'combat_duration', False),
        ('opponent_player_slot', 'opponent_player_slot', False),
        ('underlord', 'underlord', False),
        ('board_unit_limit', 'board_unit_limit', False),
        ('rank_tier', 'rank_tier', False),
        ('final_place', 'final_place', False),
        ('platform', 'platform', False),
        ('vs_opponent_wins', 'vs_opponent_wins', False),
        ('vs_opponent_losses', 'vs_opponent_losses', False),
        ('vs_opponent_draws', 'vs_opponent_draws', False),
        ('brawny_kills_float', 'brawny_kills_float', False),
        ('city_prestige_level', 'city_prestige_level', False),
        ('event_tier', 'event_tier', False),
        ('owns_event', 'owns_event', False),
        ('is_mirrored_match', 'is_mirrored_match', False),
        ('connection_status', 'connection_status', False),
        ('disconnected_time', 'disconnected_time', False),
        ('lobby_team', 'lobby_team', False),
        # JSON fields
        ('underlord_talents', 'underlord_selected_talents', True),
        ('synergies_json', 'synergies', True),
        ('board_buddy_json', 'board_buddy', True),
        ('units_json', 'units', True),
        ('item_slots_json', 'item_slots', True),
        # Round fields
        ('round_number', 'round_number', False),
        ('round_phase', 'round_phase', False),
    ]
    
    # Field mapping constants for private snapshots
    # Single source of truth: (db_column_name, gsi_field_name, is_json)
    # Order matches INSERT statement exactly
    PRIVATE_SNAPSHOT_FIELDS = [
        # Direct fields
        ('sequence_number', 'sequence_number', False),
        ('player_slot', 'player_slot', False),
        ('shop_locked', 'shop_locked', False),
        ('reroll_cost', 'reroll_cost', False),
        ('gold_earned_this_round', 'gold_earned_this_round', False),
        ('shop_generation_id', 'shop_generation_id', False),
        ('can_select_underlord', 'can_select_underlord', False),
        ('unclaimed_reward_count', 'unclaimed_reward_count', False),
        ('used_item_reward_reroll_this_round', 'used_item_reward_reroll_this_round', False),
        ('grants_rewards', 'grants_rewards', False),
        # JSON fields
        ('shop_units_json', 'shop_units', True),
        ('underlord_picker_offering_json', 'underlord_picker_offering', True),
        ('oldest_unclaimed_reward_json', 'oldest_unclaimed_reward', True),
    ]
    
    
    def __init__(self, db_path: Optional[str] = None) -> None:
        # Default to parent directory if not specified
        if db_path is None:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'underlords_gsi_v5.db')
        self.db_path = db_path
        self.conn = None
        self.init_database()
    
    def init_database(self) -> None:
        """Initialize database connection and create tables if they don't exist."""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Enable column access by name
        self.create_tables()
        self.migrate_add_round_columns()
        self.migrate_rename_items_column()
    
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
                item_slots_json TEXT,
                
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
    
    def migrate_rename_items_column(self) -> None:
        """Rename items_json column to item_slots_json to match GSI field name."""
        cursor = self.conn.cursor()
        
        # Check if old column exists
        cursor.execute("PRAGMA table_info(public_player_snapshots)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # If old column exists and new column doesn't, rename it
        if 'items_json' in columns and 'item_slots_json' not in columns:
            try:
                # SQLite doesn't support ALTER TABLE RENAME COLUMN in older versions
                # Use a workaround: create new table, copy data, drop old, rename new
                cursor.execute("""
                    CREATE TABLE public_player_snapshots_new AS
                    SELECT 
                        snapshot_id, match_id, account_id, sequence_number, timestamp,
                        health, gold, level, xp, next_level_xp,
                        wins, losses, win_streak, lose_streak, net_worth,
                        player_slot, combat_type, combat_result, combat_duration, opponent_player_slot,
                        underlord, board_unit_limit,
                        rank_tier, final_place, platform,
                        vs_opponent_wins, vs_opponent_losses, vs_opponent_draws,
                        brawny_kills_float, city_prestige_level, event_tier, owns_event, is_mirrored_match,
                        connection_status, disconnected_time, lobby_team,
                        underlord_talents, synergies_json, board_buddy_json, units_json,
                        items_json AS item_slots_json,  -- Rename during copy
                        round_number, round_phase
                    FROM public_player_snapshots
                """)
                
                # Drop old table
                cursor.execute("DROP TABLE public_player_snapshots")
                
                # Rename new table
                cursor.execute("ALTER TABLE public_player_snapshots_new RENAME TO public_player_snapshots")
                
                # Recreate indexes
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_public_snapshots_player ON public_player_snapshots(account_id, sequence_number)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_public_snapshots_match ON public_player_snapshots(match_id, timestamp)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_public_snapshots_round ON public_player_snapshots(match_id, account_id, round_number, round_phase)")
                
                print("[MIGRATION] Renamed items_json column to item_slots_json in public_player_snapshots")
            except sqlite3.OperationalError as e:
                print(f"[MIGRATION] Could not rename items_json column: {e}")
        
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
        for db_column, gsi_field, is_json in self.PUBLIC_SNAPSHOT_FIELDS:
            field_value = player_data.get(gsi_field)
            if is_json:
                # JSON fields - serialize None as "null"
                if field_value is None:
                    values.append("null")
                else:
                    values.append(self._serialize_json_field(field_value))
            else:
                # Direct fields - use None as default for missing fields
                values.append(field_value)
        return tuple(values)
    
    def _build_private_snapshot_values(self, private_data: Dict) -> tuple:
        """Build values tuple for private snapshot insert, handling missing fields."""
        values = []
        for db_column, gsi_field, is_json in self.PRIVATE_SNAPSHOT_FIELDS:
            field_value = private_data.get(gsi_field)
            if is_json:
                # JSON fields - serialize None as "null"
                if field_value is None:
                    values.append("null")
                else:
                    values.append(self._serialize_json_field(field_value))
            else:
                # Direct fields - use None as default for missing fields
                values.append(field_value)
        return tuple(values)
    
    def _insert_public_snapshot(self, match_id: str, account_id: int, player_data: Dict, timestamp: datetime) -> int:
        """Insert public player snapshot with all fields."""
        cursor = self.conn.cursor()
        
        field_values = self._build_public_snapshot_values(player_data)
        # SQL expects: match_id, account_id, sequence_number, timestamp, then all direct fields, then all JSON fields
        # field_values starts with sequence_number, so we need to insert timestamp after it
        params = (match_id, account_id, field_values[0], timestamp, *field_values[1:])
        
        # Build column list from field definitions
        columns = ['match_id', 'account_id'] + [db_column for db_column, _, _ in self.PUBLIC_SNAPSHOT_FIELDS]
        columns.insert(3, 'timestamp')  # Insert timestamp after sequence_number
        
        # Build placeholders
        placeholders = ', '.join(['?'] * len(columns))
        column_list = ', '.join(columns)
        
        cursor.execute(f"""
            INSERT INTO public_player_snapshots ({column_list})
            VALUES ({placeholders})
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
        
        # Build column list from field definitions
        columns = ['match_id'] + [db_column for db_column, _, _ in self.PRIVATE_SNAPSHOT_FIELDS]
        columns.insert(2, 'timestamp')  # Insert timestamp after sequence_number
        
        # Build placeholders
        placeholders = ', '.join(['?'] * len(columns))
        column_list = ', '.join(columns)
        
        cursor.execute(f"""
            INSERT INTO private_player_snapshots ({column_list})
            VALUES ({placeholders})
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

    def get_player_snapshots(
        self, 
        match_id: str, 
        account_id: int, 
        round_number: Optional[int] = None, 
        round_phase: Optional[str] = None
    ) -> List[Dict]:
        """
        Query snapshots for a specific player in a match.
        
        Args:
            match_id: Match identifier
            account_id: Player account ID
            round_number: Optional filter by round number
            round_phase: Optional filter by round phase
            
        Returns:
            List of snapshot dictionaries with parsed JSON fields
        """
        cursor = self.conn.cursor()
        
        # Build SELECT columns from field definitions
        select_columns = ['snapshot_id', 'match_id', 'account_id'] + [db_column for db_column, _, _ in self.PUBLIC_SNAPSHOT_FIELDS]
        select_columns.insert(4, 'timestamp')  # Insert timestamp after sequence_number
        column_list = ', '.join(select_columns)
        
        # Build query with optional filters
        query = f"""
            SELECT {column_list}
            FROM public_player_snapshots
            WHERE match_id = ? AND account_id = ?
        """
        params = [match_id, account_id]
        
        if round_number is not None:
            query += " AND round_number = ?"
            params.append(round_number)
        
        if round_phase is not None:
            query += " AND round_phase = ?"
            params.append(round_phase)
        
        query += " ORDER BY sequence_number ASC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        snapshots = []
        for row in rows:
            snapshot = {
                'snapshot_id': row[0],
                'match_id': row[1],
                'account_id': row[2],
            }
            
            # Parse fields using field definitions
            # Row structure: snapshot_id(0), match_id(1), account_id(2), sequence_number(3), timestamp(4), then rest of fields
            # Handle timestamp separately (it's inserted at index 4, after sequence_number)
            snapshot['timestamp'] = row[4]
            
            # Parse fields: start at index 3 for sequence_number, skip index 4 (timestamp), continue from index 5
            row_index = 3
            for db_column, gsi_field, is_json in self.PUBLIC_SNAPSHOT_FIELDS:
                if is_json:
                    # JSON fields - parse and use GSI field name
                    if row[row_index]:
                        snapshot[gsi_field] = json.loads(row[row_index])
                    else:
                        snapshot[gsi_field] = None
                else:
                    # Direct fields - use as-is
                    snapshot[gsi_field] = row[row_index]
                
                row_index += 1
                # Skip timestamp column (index 4) - it's already handled above
                if row_index == 4:
                    row_index += 1
            
            snapshots.append(snapshot)
        
        return snapshots
    
    def get_match_snapshots(
        self, 
        match_id: str, 
        account_ids: Optional[List[int]] = None, 
        limit: Optional[int] = None
    ) -> List[Dict]:
        """
        Query snapshots for all players (or filtered list) in a match.
        
        Args:
            match_id: Match identifier
            account_ids: Optional list of account IDs to filter by
            limit: Optional limit on number of snapshots to return
            
        Returns:
            List of snapshot dictionaries with parsed JSON fields, ordered by sequence_number ascending
        """
        cursor = self.conn.cursor()
        
        # Build SELECT columns from field definitions
        select_columns = ['snapshot_id', 'match_id', 'account_id'] + [db_column for db_column, _, _ in self.PUBLIC_SNAPSHOT_FIELDS]
        select_columns.insert(4, 'timestamp')  # Insert timestamp after sequence_number
        column_list = ', '.join(select_columns)
        
        # Build query with optional filters
        query = f"""
            SELECT {column_list}
            FROM public_player_snapshots
            WHERE match_id = ?
        """
        params = [match_id]
        
        if account_ids is not None:
            placeholders = ','.join(['?'] * len(account_ids))
            query += f" AND account_id IN ({placeholders})"
            params.extend(account_ids)
        
        query += " ORDER BY sequence_number ASC"
        
        if limit is not None:
            query += f" LIMIT {limit}"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        snapshots = []
        for row in rows:
            snapshot = {
                'snapshot_id': row[0],
                'match_id': row[1],
                'account_id': row[2],
            }
            
            # Parse fields using field definitions
            # Row structure: snapshot_id(0), match_id(1), account_id(2), sequence_number(3), timestamp(4), then rest of fields
            # Handle timestamp separately (it's inserted at index 4, after sequence_number)
            snapshot['timestamp'] = row[4]
            
            # Parse fields: start at index 3 for sequence_number, skip index 4 (timestamp), continue from index 5
            row_index = 3
            for db_column, gsi_field, is_json in self.PUBLIC_SNAPSHOT_FIELDS:
                if is_json:
                    # JSON fields - parse and use GSI field name
                    if row[row_index]:
                        snapshot[gsi_field] = json.loads(row[row_index])
                    else:
                        snapshot[gsi_field] = None
                else:
                    # Direct fields - use as-is
                    snapshot[gsi_field] = row[row_index]
                
                row_index += 1
                # Skip timestamp column (index 4) - it's already handled above
                if row_index == 4:
                    row_index += 1
            
            snapshots.append(snapshot)
        
        return snapshots

    def get_player_match_count(self, account_id: int) -> int:
        """
        Get the count of distinct matches a player has appeared in.
        This excludes the current match (if it exists).
        
        Args:
            account_id: Player account ID
            
        Returns:
            Count of distinct matches the player has appeared in
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT COUNT(DISTINCT match_id) 
            FROM match_players 
            WHERE account_id = ?
        """, (account_id,))
        
        result = cursor.fetchone()
        return result[0] if result else 0

    def close(self) -> None:
        """Close database connection."""
        if self.conn:
            self.conn.close()

