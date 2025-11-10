"""
Change Detector - Detects changes between player state snapshots
Ports frontend change detection logic to backend for real-time and historical change calculation
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import json


class ChangeDetector:
    """Detects changes between player state snapshots and maintains in-memory buffer."""
    
    def __init__(self):
        # In-memory buffer: {match_id: [change1, change2, ...]}
        self.active_changes: Dict[str, List[Dict]] = {}
        
        # Previous states for real-time detection: {match_id: {account_id: previous_state}}
        self.previous_states: Dict[str, Dict[int, Dict]] = {}
    
    def detect_changes(
        self, 
        previous_state: Dict, 
        current_state: Dict, 
        account_id: int,
        match_id: str,
        round_number: Optional[int] = None,
        round_phase: Optional[str] = None
    ) -> List[Dict]:
        """
        Compare two snapshots and return list of changes.
        
        Args:
            previous_state: Previous player state snapshot
            current_state: Current player state snapshot
            account_id: Player account ID
            match_id: Match identifier
            round_number: Current round number (for HP changes)
            round_phase: Current round phase (for HP changes)
            
        Returns:
            List of change dictionaries
        """
        changes: List[Dict] = []
        timestamp = datetime.now().isoformat()
        
        # Get player_id (use account_id as string if player_id not available)
        player_id = str(account_id)
        if 'player_id' in current_state and current_state['player_id']:
            player_id = str(current_state['player_id'])
        
        # Calculate player stat changes
        gold_delta = (current_state.get('gold') or 0) - (previous_state.get('gold') or 0)
        xp_delta = (current_state.get('xp') or 0) - (previous_state.get('xp') or 0)
        level_delta = (current_state.get('level') or 0) - (previous_state.get('level') or 0)
        health_delta = (current_state.get('health') or 0) - (previous_state.get('health') or 0)
        
        # Get units arrays - no fallbacks, let it fail if missing
        previous_units = previous_state.get('units') or []
        current_units = current_state.get('units') or []
        
        # Create maps for efficient lookup
        previous_units_by_entindex = {unit['entindex']: unit for unit in previous_units}
        current_units_by_entindex = {unit['entindex']: unit for unit in current_units}
        
        # Track units by unit_id and rank for upgrade detection
        previous_units_by_unit_id_and_rank: Dict[str, List[Dict]] = {}
        current_units_by_unit_id_and_rank: Dict[str, List[Dict]] = {}
        
        for unit in previous_units:
            key = f"{unit['unit_id']}:{unit['rank']}"
            if key not in previous_units_by_unit_id_and_rank:
                previous_units_by_unit_id_and_rank[key] = []
            previous_units_by_unit_id_and_rank[key].append(unit)
        
        for unit in current_units:
            key = f"{unit['unit_id']}:{unit['rank']}"
            if key not in current_units_by_unit_id_and_rank:
                current_units_by_unit_id_and_rank[key] = []
            current_units_by_unit_id_and_rank[key].append(unit)
        
        # Track consumed entindexes (units used in upgrades) to exclude from "sold"
        consumed_entindexes = set()
        # Track upgraded entindexes (result units) to exclude from "bought"
        upgraded_entindexes = set()
        
        # FIRST: Detect upgrades
        # If a unit with rank > 1 appears that wasn't there before, it's an upgrade (not a buy)
        # Process from highest rank to lowest to handle cascading upgrades correctly
        units_by_rank = [
            unit for unit in current_units 
            if unit['rank'] > 1 and unit['entindex'] not in previous_units_by_entindex
        ]
        units_by_rank.sort(key=lambda u: u['rank'], reverse=True)
        
        for unit in units_by_rank:
            previous_rank = unit['rank'] - 1
            previous_key = f"{unit['unit_id']}:{previous_rank}"
            previous_lower_rank_units = previous_units_by_unit_id_and_rank.get(previous_key, [])
            
            # Check which lower-rank units disappeared (were consumed in the upgrade)
            disappeared_lower_rank_units = [
                prev_unit for prev_unit in previous_lower_rank_units
                if prev_unit['entindex'] not in current_units_by_entindex 
                and prev_unit['entindex'] not in consumed_entindexes
            ]
            
            # Need at least 2 units to have disappeared
            if len(disappeared_lower_rank_units) >= 2:
                # Mark this as an upgrade
                upgraded_entindexes.add(unit['entindex'])
                
                # Mark the consumed units
                for consumed_unit in disappeared_lower_rank_units:
                    consumed_entindexes.add(consumed_unit['entindex'])
                
                # For cascading upgrades (e.g., rank 2→3), also check if rank 1 units disappeared
                if previous_rank > 1:
                    rank1_key = f"{unit['unit_id']}:1"
                    previous_rank1_units = previous_units_by_unit_id_and_rank.get(rank1_key, [])
                    disappeared_rank1_units = [
                        prev_unit for prev_unit in previous_rank1_units
                        if prev_unit['entindex'] not in current_units_by_entindex
                        and prev_unit['entindex'] not in consumed_entindexes
                    ]
                    
                    if len(disappeared_rank1_units) >= 2:
                        for consumed_unit in disappeared_rank1_units:
                            consumed_entindexes.add(consumed_unit['entindex'])
                
                # Store first consumed entindex
                consumed_entindexes_list = [u['entindex'] for u in disappeared_lower_rank_units]
                
                changes.append({
                    'type': 'upgraded',
                    'player_id': player_id,
                    'unit_id': unit['unit_id'],
                    'entindex': unit['entindex'],
                    'previous_entindex': consumed_entindexes_list[0] if consumed_entindexes_list else None,
                    'rank': unit['rank'],
                    'previous_rank': previous_rank,
                    'position': unit.get('position'),
                    'timestamp': timestamp,
                })
        
        # Detect bought: new entindex appears, but only if rank = 1
        for unit in current_units:
            if unit['entindex'] not in previous_units_by_entindex and unit['rank'] == 1:
                # Check if this unit_id was just upgraded
                was_part_of_upgrade = any(
                    upgraded_unit['unit_id'] == unit['unit_id']
                    for upgraded_entindex in upgraded_entindexes
                    for upgraded_unit in current_units
                    if upgraded_unit['entindex'] == upgraded_entindex
                )
                
                if not was_part_of_upgrade:
                    changes.append({
                        'type': 'bought',
                        'player_id': player_id,
                        'unit_id': unit['unit_id'],
                        'entindex': unit['entindex'],
                        'rank': unit['rank'],
                        'position': unit.get('position'),
                        'timestamp': timestamp,
                    })
        
        # Detect sold: entindex disappears, but exclude units consumed in upgrades
        for unit in previous_units:
            if unit['entindex'] not in current_units_by_entindex:
                if unit['entindex'] not in consumed_entindexes:
                    changes.append({
                        'type': 'sold',
                        'player_id': player_id,
                        'unit_id': unit['unit_id'],
                        'entindex': unit['entindex'],
                        'rank': unit['rank'],
                        'previous_position': unit.get('position'),
                        'timestamp': timestamp,
                    })
        
        # Detect moved: same entindex, different position
        def is_board_position(y: int) -> bool:
            return y >= 0 and y <= 3
        
        def is_bench_position(y: int) -> bool:
            return y == -1
        
        for unit in current_units:
            previous_unit = previous_units_by_entindex.get(unit['entindex'])
            if previous_unit:
                prev_pos = previous_unit.get('position', {})
                curr_pos = unit.get('position', {})
                
                position_changed = (
                    prev_pos.get('x') != curr_pos.get('x') or
                    prev_pos.get('y') != curr_pos.get('y')
                )
                
                if position_changed:
                    prev_y = prev_pos.get('y', 0)
                    curr_y = curr_pos.get('y', 0)
                    
                    prev_on_board = is_board_position(prev_y)
                    prev_on_bench = is_bench_position(prev_y)
                    curr_on_board = is_board_position(curr_y)
                    curr_on_bench = is_bench_position(curr_y)
                    
                    if prev_on_board and curr_on_board:
                        move_type = 'reposition'
                    elif prev_on_bench and curr_on_bench:
                        move_type = 'organize_bench'
                    elif prev_on_board and curr_on_bench:
                        move_type = 'benched'
                    else:
                        move_type = 'deployed'
                    
                    changes.append({
                        'type': move_type,
                        'player_id': player_id,
                        'unit_id': unit['unit_id'],
                        'entindex': unit['entindex'],
                        'rank': unit['rank'],
                        'position': curr_pos,
                        'previous_position': prev_pos,
                        'timestamp': timestamp,
                    })
        
        # Detect player changes (reroll, XP purchase, level up, HP change)
        # Get changes for this player only (for reroll detection)
        player_changes = [c for c in changes if c['player_id'] == player_id]
        
        # Detect reroll: Gold decreases by 2, no units were bought or upgraded
        has_bought_or_upgraded = any(
            c['type'] == 'bought' or c['type'] == 'upgraded'
            for c in player_changes
        )
        
        if gold_delta == -2 and not has_bought_or_upgraded:
            changes.append({
                'type': 'reroll',
                'player_id': player_id,
                'gold_spent': 2,
                'timestamp': timestamp,
            })
        
        # Detect XP purchase: Account for level ups when calculating effective XP gain
        previous_next_level_xp = previous_state.get('next_level_xp') or 0
        effective_xp_gain = xp_delta + (level_delta * previous_next_level_xp)
        
        if effective_xp_gain == 5 and gold_delta == -5:
            changes.append({
                'type': 'xp_purchase',
                'player_id': player_id,
                'gold_spent': 5,
                'xp_gained': 5,
                'timestamp': timestamp,
            })
        
        # Detect level up: Level increases
        if level_delta > 0:
            changes.append({
                'type': 'level_up',
                'player_id': player_id,
                'level_before': previous_state.get('level') or 0,
                'level_after': current_state.get('level') or 0,
                'timestamp': timestamp,
            })
        
        # Detect HP change: Health decreases (damage taken)
        if health_delta < 0:
            damage_taken = abs(health_delta)
            changes.append({
                'type': 'hp_change',
                'player_id': player_id,
                'health_before': previous_state.get('health') or 0,
                'health_after': current_state.get('health') or 0,
                'damage_taken': damage_taken,
                'round_number': round_number,
                'round_phase': round_phase,
                'timestamp': timestamp,
            })
        
        # Detect item changes
        previous_items = previous_state.get('item_slots') or []
        current_items = current_state.get('item_slots') or []
        
        # Items are added sequentially (array grows), never removed
        # Compare array lengths to detect new items
        if len(current_items) > len(previous_items):
            # New items added
            for i in range(len(previous_items), len(current_items)):
                item = current_items[i]
                changes.append({
                    'type': 'item_added',
                    'player_id': player_id,
                    'item_id': item.get('item_id'),
                    'slot_index': item.get('slot_index'),
                    'assigned_unit_entindex': item.get('assigned_unit_entindex'),
                    'timestamp': timestamp,
                })
        
        # For existing items (same slot_index), check assigned_unit_entindex changes
        for i in range(min(len(previous_items), len(current_items))):
            prev_item = previous_items[i]
            curr_item = current_items[i]
            
            # Items never change item_id once added
            if prev_item.get('item_id') != curr_item.get('item_id'):
                continue  # Should not happen, but skip if it does
            
            prev_assigned = prev_item.get('assigned_unit_entindex')
            curr_assigned = curr_item.get('assigned_unit_entindex')
            
            # item_assigned: null → integer
            if prev_assigned is None and curr_assigned is not None:
                changes.append({
                    'type': 'item_assigned',
                    'player_id': player_id,
                    'item_id': curr_item.get('item_id'),
                    'slot_index': curr_item.get('slot_index'),
                    'assigned_unit_entindex': curr_assigned,
                    'timestamp': timestamp,
                })
            # item_unassigned: integer → null
            elif prev_assigned is not None and curr_assigned is None:
                changes.append({
                    'type': 'item_unassigned',
                    'player_id': player_id,
                    'item_id': curr_item.get('item_id'),
                    'slot_index': curr_item.get('slot_index'),
                    'previous_assigned_unit_entindex': prev_assigned,
                    'timestamp': timestamp,
                })
            # item_reassigned: integer → different integer
            elif prev_assigned is not None and curr_assigned is not None and prev_assigned != curr_assigned:
                changes.append({
                    'type': 'item_reassigned',
                    'player_id': player_id,
                    'item_id': curr_item.get('item_id'),
                    'slot_index': curr_item.get('slot_index'),
                    'previous_assigned_unit_entindex': prev_assigned,
                    'new_assigned_unit_entindex': curr_assigned,
                    'timestamp': timestamp,
                })
        
        # Detect synergy changes
        previous_synergies = previous_state.get('synergies') or []
        current_synergies = current_state.get('synergies') or []
        
        # Create lookup maps by keyword
        prev_synergies_by_keyword: Dict[int, Dict] = {}
        curr_synergies_by_keyword: Dict[int, Dict] = {}
        
        for synergy in previous_synergies:
            keyword = synergy.get('keyword')
            if keyword is not None:
                prev_synergies_by_keyword[keyword] = synergy
        
        for synergy in current_synergies:
            keyword = synergy.get('keyword')
            if keyword is not None:
                curr_synergies_by_keyword[keyword] = synergy
        
        # Detect synergy_added: New keyword appears
        for keyword, synergy in curr_synergies_by_keyword.items():
            if keyword not in prev_synergies_by_keyword:
                changes.append({
                    'type': 'synergy_added',
                    'player_id': player_id,
                    'synergy_keyword': keyword,
                    'unique_unit_count': synergy.get('unique_unit_count'),
                    'timestamp': timestamp,
                })
        
        # Detect synergy_removed: keyword disappears
        for keyword, synergy in prev_synergies_by_keyword.items():
            if keyword not in curr_synergies_by_keyword:
                changes.append({
                    'type': 'synergy_removed',
                    'player_id': player_id,
                    'synergy_keyword': keyword,
                    'unique_unit_count': synergy.get('unique_unit_count'),
                    'timestamp': timestamp,
                })
        
        # Detect synergy_level_changed: Same keyword, different unique_unit_count
        for keyword in prev_synergies_by_keyword:
            if keyword in curr_synergies_by_keyword:
                prev_count = prev_synergies_by_keyword[keyword].get('unique_unit_count')
                curr_count = curr_synergies_by_keyword[keyword].get('unique_unit_count')
                
                if prev_count is not None and curr_count is not None and prev_count != curr_count:
                    changes.append({
                        'type': 'synergy_level_changed',
                        'player_id': player_id,
                        'synergy_keyword': keyword,
                        'level_before': prev_count,
                        'level_after': curr_count,
                        'timestamp': timestamp,
                    })
        
        return changes
    
    def update_previous_state(self, match_id: str, account_id: int, state: Dict) -> None:
        """Store previous state for real-time detection."""
        if match_id not in self.previous_states:
            self.previous_states[match_id] = {}
        self.previous_states[match_id][account_id] = state
    
    def get_previous_state(self, match_id: str, account_id: int) -> Optional[Dict]:
        """Get previous state for a player."""
        if match_id not in self.previous_states:
            return None
        return self.previous_states[match_id].get(account_id)
    
    def add_change(self, match_id: str, change: Dict) -> None:
        """Add detected change to in-memory buffer."""
        if match_id not in self.active_changes:
            self.active_changes[match_id] = []
        self.active_changes[match_id].append(change)
    
    def get_changes(
        self, 
        match_id: str, 
        account_id: Optional[int] = None, 
        limit: Optional[int] = None
    ) -> List[Dict]:
        """
        Retrieve changes from buffer (with optional filters).
        
        Args:
            match_id: Match identifier
            account_id: Optional player account ID to filter by
            limit: Optional limit on number of changes to return
            
        Returns:
            List of changes, sorted by timestamp descending
        """
        if match_id not in self.active_changes:
            return []
        
        changes = self.active_changes[match_id]
        
        # Filter by account_id if provided
        if account_id is not None:
            changes = [
                c for c in changes 
                if c.get('player_id') == str(account_id)
            ]
        
        # Sort by timestamp descending (newest first)
        changes.sort(key=lambda c: c.get('timestamp', ''), reverse=True)
        
        # Apply limit if provided
        if limit is not None:
            changes = changes[:limit]
        
        return changes
    
    def clear_match(self, match_id: str) -> None:
        """Clear buffer and previous states for specific match."""
        if match_id in self.active_changes:
            del self.active_changes[match_id]
        if match_id in self.previous_states:
            del self.previous_states[match_id]
    
    def reset(self) -> None:
        """Clear all previous states and buffers."""
        self.active_changes.clear()
        self.previous_states.clear()


# Global instance
change_detector = ChangeDetector()

