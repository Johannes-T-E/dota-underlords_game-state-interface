"""
Simplified GSI test script - analyzes sequence numbers and detects changes.
"""

from flask import Flask, request, jsonify
from datetime import datetime
from collections import defaultdict

app = Flask(__name__)

# Global state
player_sequences = defaultdict(list)  # player_id -> [(sequence_num, timestamp, data)]
latest_states = {}  # player_id -> latest_data
duplicates = []
changes = []
total_requests = 0

def get_player_id(public_state):
    """Extract player ID from public state."""
    account_id = public_state.get('account_id', 0)
    return str(account_id) if account_id != 0 else public_state.get('bot_persona_name', 'unknown')

def analyze_units_changes(prev_units, curr_units):
    """Analyze specific changes in units."""
    if not prev_units and not curr_units:
        return []
    if not prev_units:
        return [f"units: +{len(curr_units)}"]
    if not curr_units:
        return [f"units: -{len(prev_units)}"]
    
    # Create lookup by entindex
    prev_by_entindex = {unit.get('entindex'): unit for unit in prev_units}
    curr_by_entindex = {unit.get('entindex'): unit for unit in curr_units}
    
    changes = []
    prev_entindexes = set(prev_by_entindex.keys())
    curr_entindexes = set(curr_by_entindex.keys())
    
    # Added units
    added = curr_entindexes - prev_entindexes
    if added:
        changes.append(f"units: +{len(added)}")
    
    # Removed units
    removed = prev_entindexes - curr_entindexes
    if removed:
        changes.append(f"units: -{len(removed)}")
    
    # Modified units
    common = prev_entindexes & curr_entindexes
    for entindex in common:
        prev_unit = prev_by_entindex[entindex]
        curr_unit = curr_by_entindex[entindex]
        
        unit_changes = []
        for key in ['position', 'rank', 'gold_value', 'kill_count']:
            if prev_unit.get(key) != curr_unit.get(key):
                unit_changes.append(f"{key}: {prev_unit.get(key)}→{curr_unit.get(key)}")
        
        if unit_changes:
            unit_id = curr_unit.get('unit_id', '?')
            changes.append(f"unit {entindex}({unit_id}): {', '.join(unit_changes)}")
    
    return changes

def analyze_items_changes(prev_items, curr_items):
    """Analyze specific changes in items."""
    if not prev_items and not curr_items:
        return []
    if not prev_items:
        return [f"items: +{len(curr_items)}"]
    if not curr_items:
        return [f"items: -{len(prev_items)}"]
    
    if len(prev_items) != len(curr_items):
        return [f"items: {len(prev_items)}→{len(curr_items)}"]
    
    # Simple comparison for now
    changes = []
    for i, (prev_item, curr_item) in enumerate(zip(prev_items, curr_items)):
        if prev_item != curr_item:
            changes.append(f"item[{i}]: changed")
    
    return changes

def detect_changes(player_id, new_data, sequence_num):
    """Detect changes between current and previous state."""
    if player_id not in latest_states:
        latest_states[player_id] = new_data
        print(f"  🆕 {player_id} seq {sequence_num} - FIRST TIME")
        return []
    
    prev_data = latest_states[player_id]
    prev_sequence = prev_data.get('sequence_number', 0)
    changes_found = []
    
    # Compare all fields that app.py tracks
    basic_fields = [
        'health', 'gold', 'level', 'xp', 'next_level_xp',
        'wins', 'losses', 'win_streak', 'lose_streak', 'net_worth',
        'combat_type', 'final_place', 'sequence_number'
    ]
    for field in basic_fields:
        if prev_data.get(field) != new_data.get(field):
            changes_found.append({
                'field': field,
                'previous': prev_data.get(field),
                'current': new_data.get(field)
            })
    
    # Analyze units changes
    prev_units = prev_data.get('units', [])
    curr_units = new_data.get('units', [])
    unit_changes = analyze_units_changes(prev_units, curr_units)
    
    # Analyze items changes
    prev_items = prev_data.get('item_slots', [])
    curr_items = new_data.get('item_slots', [])
    item_changes = analyze_items_changes(prev_items, curr_items)
    
    # Combine all changes
    all_changes = []
    
    # Add basic field changes
    for change in changes_found:
        all_changes.append(f"{change['field']}: {change['previous']}→{change['current']}")
    
    # Add unit changes
    all_changes.extend(unit_changes)
    
    # Add item changes
    all_changes.extend(item_changes)
    
    if all_changes:
        changes.append({
            'player_id': player_id,
            'sequence': sequence_num,
            'timestamp': datetime.now().isoformat(),
            'changes': all_changes
        })
        print(f"  🔄 {player_id} seq {prev_sequence}→{sequence_num} - {', '.join(all_changes)}")
    else:
        print(f"  ⏸️  {player_id} seq {prev_sequence}→{sequence_num} - NO CHANGES")
    
    latest_states[player_id] = new_data
    return all_changes

@app.route('/upload', methods=['POST'])
def receive_gsi_data():
    """Process GSI data."""
    global total_requests
    
    try:
        data = request.get_json()
        if not data or 'block' not in data:
            return jsonify({"status": "ok"}), 200
        
        total_requests += 1
        timestamp = datetime.now()
        
        # Process non-empty blocks
        non_empty_blocks = [block for block in data['block'] if isinstance(block, dict) and block]
        
        for block_index, block in enumerate(non_empty_blocks):
            if 'data' not in block:
                continue
            
            # Count object types
            public_count = sum(1 for obj in block['data'] if 'public_player_state' in obj)
            private_count = sum(1 for obj in block['data'] if 'private_player_state' in obj)
            
            print(f"\n[BLOCK {total_requests}, DATA {block_index + 1}] {public_count} public, {private_count} private player states")
            
            for data_obj in block['data']:
                if 'public_player_state' not in data_obj:
                    continue
                
                public_state = data_obj['public_player_state']
                player_id = get_player_id(public_state)
                sequence_num = public_state.get('sequence_number', 0)
                
                # Check for duplicates per player
                if player_id in player_sequences:
                    existing_sequences = [seq for seq, _, _ in player_sequences[player_id]]
                    if sequence_num in existing_sequences:
                        duplicates.append({
                            'player_id': player_id,
                            'sequence': sequence_num,
                            'timestamp': timestamp.isoformat()
                        })
                        print(f"  ⚠️  {player_id} seq {sequence_num} - DUPLICATE (SKIPPED)")
                        continue  # Skip processing duplicate sequences
                
                # New sequence - detect changes and process
                changes_found = detect_changes(player_id, public_state, sequence_num)
                player_sequences[player_id].append((sequence_num, timestamp, public_state))
        
        return jsonify({"status": "ok"}), 200
    
    except Exception as e:
        print(f"ERROR: {e}")
        return jsonify({"status": "error"}), 500

@app.route('/stats')
def get_stats():
    """Get statistics."""
    return jsonify({
        'total_requests': total_requests,
        'players_tracked': len(player_sequences),
        'duplicates_found': len(duplicates),
        'changes_detected': len(changes),
        'players': {pid: len(seqs) for pid, seqs in player_sequences.items()}
    })

@app.route('/duplicates')
def get_duplicates():
    """Get duplicates."""
    return jsonify({'duplicates': duplicates})

@app.route('/changes')
def get_changes():
    """Get changes."""
    return jsonify({'changes': changes})

@app.route('/latest')
def get_latest():
    """Get latest states."""
    return jsonify({'latest_states': latest_states})

if __name__ == '__main__':
    print("GSI Test Server - Simplified")
    print("Listening on: http://localhost:3000/upload")
    print("Endpoints: /stats, /duplicates, /changes, /latest")
    print("Start playing Dota Underlords...")
    
    app.run(host='0.0.0.0', port=3000, debug=False)
