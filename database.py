"""
Database manager for Dota Underlords GSI data.
Uses SQLite for efficient storage and real-time querying.
"""

import sqlite3
import hashlib
import json
from typing import Dict, List
from datetime import datetime
from pathlib import Path


class UnderlordsDatabaseManager:
    """Manages SQLite database for Underlords GSI data."""
    
    def __init__(self, db_path: str = "underlords_gsi_v2.db"):
        self.db_path = db_path
        self.conn = None
        self.init_database()
    
    def init_database(self):
        """Initialize database connection and create tables if they don't exist."""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Enable column access by name
        self.create_tables()
    
    def create_tables(self):
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
                player_id TEXT,
                account_id INTEGER,
                persona_name TEXT,
                bot_persona_name TEXT,
                player_slot INTEGER,
                is_human_player BOOLEAN,
                platform INTEGER,
                final_place INTEGER DEFAULT 0,
                FOREIGN KEY (match_id) REFERENCES matches(match_id),
                UNIQUE(match_id, player_id)
            )
        """)
        
        # Public player snapshots (state at each update) with JSON data
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS public_player_snapshots (
                snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT,
                player_id TEXT,
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
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_match_players ON match_players(match_id, player_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_public_snapshots_player ON public_player_snapshots(player_id, sequence_number)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_public_snapshots_match ON public_player_snapshots(match_id, timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_private_snapshots_match ON private_player_snapshots(match_id, timestamp)")
        
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
            account_id = player.get('account_id')
            is_human = player.get('is_human_player', True)
            
            # Generate player_id (account_id for humans, bot_persona_name for bots)
            if account_id == 0:
                player_id = player.get('bot_persona_name', 'unknown_bot')
            else:
                player_id = str(account_id)
            
            print(f"[DB DEBUG] Player {i+1}: {player_id} (account_id={account_id}, is_human={is_human})")
            
            cursor.execute("""
                INSERT OR IGNORE INTO match_players 
                (match_id, player_id, account_id, persona_name, bot_persona_name, 
                 player_slot, is_human_player, platform)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                match_id,
                player_id,
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
    
    def insert_public_snapshot(self, match_id: str, player_id: str, player_data: Dict, timestamp: datetime) -> int:
        """Insert public player snapshot with all fields."""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            INSERT INTO public_player_snapshots (
                match_id, player_id, sequence_number, timestamp,
                health, gold, level, xp, next_level_xp,
                wins, losses, win_streak, lose_streak, net_worth,
                player_slot, combat_type, combat_result, combat_duration, opponent_player_slot,
                underlord, underlord_talents, board_unit_limit,
                rank_tier, final_place, platform,
                synergies_json, vs_opponent_wins, vs_opponent_losses, vs_opponent_draws,
                brawny_kills_float, city_prestige_level, event_tier, owns_event, is_mirrored_match,
                connection_status, disconnected_time, board_buddy_json, lobby_team,
                units_json, items_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            match_id,
            player_id,
            player_data.get('sequence_number'),
            timestamp,
            player_data.get('health'),
            player_data.get('gold'),
            player_data.get('level'),
            player_data.get('xp'),
            player_data.get('next_level_xp'),
            player_data.get('wins'),
            player_data.get('losses'),
            player_data.get('win_streak'),
            player_data.get('lose_streak'),
            player_data.get('net_worth'),
            player_data.get('player_slot'),
            player_data.get('combat_type'),
            player_data.get('combat_result'),
            player_data.get('combat_duration'),
            player_data.get('opponent_player_slot'),
            player_data.get('underlord'),
            json.dumps(player_data.get('underlord_selected_talents', [])),
            player_data.get('board_unit_limit'),
            player_data.get('rank_tier'),
            player_data.get('final_place'),
            player_data.get('platform'),
            json.dumps(player_data.get('synergies', [])),
            player_data.get('vs_opponent_wins'),
            player_data.get('vs_opponent_losses'),
            player_data.get('vs_opponent_draws'),
            player_data.get('brawny_kills_float'),
            player_data.get('city_prestige_level'),
            player_data.get('event_tier'),
            player_data.get('owns_event'),
            player_data.get('is_mirrored_match'),
            player_data.get('connection_status'),
            player_data.get('disconnected_time'),
            json.dumps(player_data.get('board_buddy', {})),
            player_data.get('lobby_team'),
            json.dumps(player_data.get('units', [])),
            json.dumps(player_data.get('items', []))
        ))
        
        self.conn.commit()
        return cursor.lastrowid
    
    def insert_private_snapshot(self, match_id: str, private_data: Dict, timestamp: datetime) -> int:
        """Insert private player snapshot."""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            INSERT INTO private_player_snapshots (
                match_id, sequence_number, timestamp, player_slot,
                shop_units_json, shop_locked, reroll_cost, gold_earned_this_round, shop_generation_id,
                can_select_underlord, underlord_picker_offering_json,
                unclaimed_reward_count, oldest_unclaimed_reward_json, used_item_reward_reroll_this_round, grants_rewards
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            match_id,
            private_data.get('sequence_number'),
            timestamp,
            private_data.get('player_slot'),
            json.dumps(private_data.get('shop_units', [])),
            private_data.get('shop_locked'),
            private_data.get('reroll_cost'),
            private_data.get('gold_earned_this_round'),
            private_data.get('shop_generation_id'),
            private_data.get('can_select_underlord'),
            json.dumps(private_data.get('underlord_picker_offering', [])),
            private_data.get('unclaimed_reward_count'),
            json.dumps(private_data.get('oldest_unclaimed_reward')),
            private_data.get('used_item_reward_reroll_this_round'),
            private_data.get('grants_rewards')
        ))
        
        self.conn.commit()
        return cursor.lastrowid
    
    def update_match_end_time(self, match_id: str, timestamp: datetime):
        """Update match ended_at timestamp."""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                UPDATE matches 
                SET ended_at = ?
                WHERE match_id = ?
            """, (timestamp, match_id))
            self.conn.commit()
        except sqlite3.OperationalError as e:
            if "cannot start a transaction within a transaction" in str(e):
                # Rollback and retry
                self.conn.rollback()
                cursor = self.conn.cursor()
                cursor.execute("""
                    UPDATE matches 
                    SET ended_at = ?
                    WHERE match_id = ?
                """, (timestamp, match_id))
                self.conn.commit()
            else:
                raise
    
    def update_player_final_place(self, match_id: str, player_id: str, final_place: int, timestamp: datetime):
        """Update a player's final_place in their latest snapshot."""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                UPDATE public_player_snapshots 
                SET final_place = ?
                WHERE match_id = ? AND player_id = ? AND sequence_number = (
                    SELECT MAX(sequence_number) 
                    FROM public_player_snapshots 
                    WHERE match_id = ? AND player_id = ?
                )
            """, (final_place, match_id, player_id, match_id, player_id))
            self.conn.commit()
        except sqlite3.OperationalError as e:
            if "cannot start a transaction within a transaction" in str(e):
                # Rollback and retry
                self.conn.rollback()
                cursor = self.conn.cursor()
                cursor.execute("""
                    UPDATE public_player_snapshots 
                    SET final_place = ?
                    WHERE match_id = ? AND player_id = ? AND sequence_number = (
                        SELECT MAX(sequence_number) 
                        FROM public_player_snapshots 
                        WHERE match_id = ? AND player_id = ?
                    )
                """, (final_place, match_id, player_id, match_id, player_id))
                self.conn.commit()
            else:
                raise
    
    def update_match_player_final_place(self, match_id: str, player_id: str, final_place: int):
        """Update a player's final_place in the match_players table."""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                UPDATE match_players 
                SET final_place = ?
                WHERE match_id = ? AND player_id = ?
            """, (final_place, match_id, player_id))
            self.conn.commit()
        except sqlite3.OperationalError as e:
            if "cannot start a transaction within a transaction" in str(e):
                # Rollback and retry
                self.conn.rollback()
                cursor = self.conn.cursor()
                cursor.execute("""
                    UPDATE match_players 
                    SET final_place = ?
                    WHERE match_id = ? AND player_id = ?
                """, (final_place, match_id, player_id))
                self.conn.commit()
            else:
                raise
    
    def execute_in_transaction(self, operations):
        """Execute multiple database operations in a single transaction."""
        try:
            cursor = self.conn.cursor()
            for operation in operations:
                cursor.execute(operation['sql'], operation['params'])
            self.conn.commit()
            return True
        except Exception as e:
            self.conn.rollback()
            print(f"[DATABASE ERROR] Transaction failed: {e}")
            return False
    
    def delete_match(self, match_id: str) -> bool:
        """Delete a match and all associated data."""
        try:
            cursor = self.conn.cursor()
            
            # Delete in order: snapshots first, then players, then match
            cursor.execute("DELETE FROM private_player_snapshots WHERE match_id = ?", (match_id,))
            cursor.execute("DELETE FROM public_player_snapshots WHERE match_id = ?", (match_id,))
            cursor.execute("DELETE FROM match_players WHERE match_id = ?", (match_id,))
            cursor.execute("DELETE FROM matches WHERE match_id = ?", (match_id,))
            
            self.conn.commit()
            print(f"[DB] Deleted match {match_id} and all associated data")
            return True
        except Exception as e:
            self.conn.rollback()
            print(f"[DB ERROR] Failed to delete match {match_id}: {e}")
            return False

    def get_all_matches(self) -> List[Dict]:
        """Get list of all matches with basic info."""
        try:
            cursor = self.conn.cursor()
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
                matches.append({
                    'match_id': row[0],
                    'started_at': row[1],
                    'ended_at': row[2],
                    'player_count': row[3],
                    'created_at': row[4]
                })
            
            return matches
        except Exception as e:
            print(f"[DB ERROR] Failed to get matches: {e}")
            return []

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()