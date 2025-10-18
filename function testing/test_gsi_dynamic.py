"""
Dynamic GSI test script - automatically tracks ALL fields in JSON without manual specification.
Handles field disappearance by preserving old values when fields go from value → None.
"""

from flask import Flask, request, jsonify
from datetime import datetime
from collections import defaultdict
import copy

app = Flask(__name__)

# Global state
player_sequences = defaultdict(list)  # player_id -> [(sequence_num, timestamp, data)]
latest_states = {}  # player_id -> latest_data (with preserved fields)
duplicates = []
changes = []
total_requests = 0

# Data structure analysis
field_frequency = defaultdict(int)  # field_path -> count of appearances
field_types = defaultdict(set)  # field_path -> set of types seen
field_examples = defaultdict(list)  # field_path -> list of example values
structure_analysis = {
    'total_blocks_processed': 0,
    'total_public_states': 0,
    'total_private_states': 0,
    'unique_players_seen': set(),
    'field_coverage': {}  # field_path -> percentage of time it appears
}

def get_player_id(public_state):
    """Extract player ID from public state."""
    account_id = public_state.get('account_id', 0)
    return str(account_id) if account_id != 0 else public_state.get('bot_persona_name', 'unknown')

def analyze_data_structure(data, path=""):
    """Analyze the structure of incoming GSI data to understand field presence and types."""
    if isinstance(data, dict):
        for key, value in data.items():
            current_path = f"{path}.{key}" if path else key
            field_frequency[current_path] += 1
            field_types[current_path].add(type(value).__name__)
            
            # Store example values (limit to 3 per field)
            if len(field_examples[current_path]) < 3:
                if isinstance(value, (str, int, float, bool)) or value is None:
                    field_examples[current_path].append(value)
                elif isinstance(value, list) and len(value) > 0:
                    field_examples[current_path].append(f"list[{len(value)}]")
                elif isinstance(value, dict):
                    field_examples[current_path].append(f"object[{len(value)} fields]")
            
            # Recursively analyze nested structures
            if isinstance(value, (dict, list)):
                analyze_data_structure(value, current_path)
                
    elif isinstance(data, list):
        for i, item in enumerate(data):
            analyze_data_structure(item, f"{path}[{i}]")

def update_field_coverage():
    """Update field coverage percentages based on current data."""
    total_public_states = structure_analysis['total_public_states']
    if total_public_states > 0:
        for field_path, count in field_frequency.items():
            if field_path.startswith('public_player_state'):
                structure_analysis['field_coverage'][field_path] = (count / total_public_states) * 100

def deep_compare_and_preserve(old_data, new_data, path=""):
    """
    Deeply compare two data structures and preserve old values when fields disappear.
    Returns a tuple: (changes_found, preserved_data)
    """
    changes_found = []
    preserved_data = copy.deepcopy(new_data)
    
    # Get all keys from both old and new data
    all_keys = set(old_data.keys()) | set(new_data.keys())
    
    for key in all_keys:
        current_path = f"{path}.{key}" if path else key
        old_value = old_data.get(key)
        new_value = new_data.get(key)
        
        # Case 1: Field disappeared (old had value, new is None/missing)
        if old_value is not None and (new_value is None or key not in new_data):
            changes_found.append({
                'field': current_path,
                'previous': old_value,
                'current': None,
                'change_type': 'disappeared'
            })
            # Preserve the old value in the preserved data
            preserved_data[key] = old_value
            
        # Case 2: Field appeared (old was None/missing, new has value)
        elif (old_value is None or key not in old_data) and new_value is not None:
            changes_found.append({
                'field': current_path,
                'previous': None,
                'current': new_value,
                'change_type': 'appeared'
            })
            
        # Case 3: Both have values - compare them
        elif old_value is not None and new_value is not None:
            if isinstance(old_value, dict) and isinstance(new_value, dict):
                # Recursively compare nested objects
                nested_changes, nested_preserved = deep_compare_and_preserve(old_value, new_value, current_path)
                changes_found.extend(nested_changes)
                # Update preserved data with nested preserved values
                for nested_key, nested_value in nested_preserved.items():
                    if key not in preserved_data:
                        preserved_data[key] = {}
                    preserved_data[key][nested_key] = nested_value
                    
            elif isinstance(old_value, list) and isinstance(new_value, list):
                # Compare lists with detailed analysis
                if old_value != new_value:
                    # Analyze list changes in detail
                    list_changes = analyze_list_changes(old_value, new_value, current_path)
                    changes_found.extend(list_changes)
                    
            else:
                # Compare primitive values
                if old_value != new_value:
                    changes_found.append({
                        'field': current_path,
                        'previous': old_value,
                        'current': new_value,
                        'change_type': 'value_changed'
                    })
    
    return changes_found, preserved_data

def analyze_list_changes(old_list, new_list, path):
    """Analyze changes in lists with detailed tracking."""
    changes_found = []
    
    if not old_list and not new_list:
        return changes_found
    if not old_list:
        changes_found.append({
            'field': path,
            'previous': old_list,
            'current': new_list,
            'change_type': 'list_appeared',
            'details': f"+{len(new_list)} items"
        })
        return changes_found
    if not new_list:
        changes_found.append({
            'field': path,
            'previous': old_list,
            'current': new_list,
            'change_type': 'list_disappeared',
            'details': f"-{len(old_list)} items"
        })
        return changes_found
    
    # Try to find a unique identifier for list items
    # For units, use 'entindex'; for items, use position; otherwise use index
    def get_item_id(item, index):
        if isinstance(item, dict):
            if 'entindex' in item:
                return item['entindex']
            elif 'item_id' in item:
                return item['item_id']
            elif 'id' in item:
                return item['id']
        return index
    
    # Create lookup maps
    old_by_id = {get_item_id(item, i): (item, i) for i, item in enumerate(old_list)}
    new_by_id = {get_item_id(item, i): (item, i) for i, item in enumerate(new_list)}
    
    old_ids = set(old_by_id.keys())
    new_ids = set(new_by_id.keys())
    
    # Added items
    added_ids = new_ids - old_ids
    if added_ids:
        changes_found.append({
            'field': path,
            'previous': f"{len(old_list)} items",
            'current': f"{len(new_list)} items",
            'change_type': 'list_items_added',
            'details': f"+{len(added_ids)} items"
        })
        for item_id in added_ids:
            item, _ = new_by_id[item_id]
            changes_found.append({
                'field': f"{path}[{item_id}]",
                'previous': None,
                'current': item,
                'change_type': 'item_added'
            })
    
    # Removed items
    removed_ids = old_ids - new_ids
    if removed_ids:
        changes_found.append({
            'field': path,
            'previous': f"{len(old_list)} items",
            'current': f"{len(new_list)} items",
            'change_type': 'list_items_removed',
            'details': f"-{len(removed_ids)} items"
        })
        for item_id in removed_ids:
            item, _ = old_by_id[item_id]
            changes_found.append({
                'field': f"{path}[{item_id}]",
                'previous': item,
                'current': None,
                'change_type': 'item_removed'
            })
    
    # Modified items
    common_ids = old_ids & new_ids
    for item_id in common_ids:
        old_item, _ = old_by_id[item_id]
        new_item, _ = new_by_id[item_id]
        
        if old_item != new_item:
            # Recursively compare the items
            item_changes, _ = deep_compare_and_preserve(old_item, new_item, f"{path}[{item_id}]")
            changes_found.extend(item_changes)
    
    return changes_found

def format_changes_for_display(changes, max_display=5):
    """Format changes for display with optional truncation."""
    if not changes:
        return []
    
    formatted = []
    for change in changes:
        change_type = change['change_type']
        field = change['field']
        
        if change_type == 'disappeared':
            formatted.append(f"{field}: {change['previous']}→(disappeared)")
        elif change_type == 'appeared':
            formatted.append(f"{field}: (appeared)→{change['current']}")
        elif change_type == 'list_appeared':
            details = change.get('details', '')
            formatted.append(f"{field}: (appeared) {details}")
        elif change_type == 'list_disappeared':
            details = change.get('details', '')
            formatted.append(f"{field}: (disappeared) {details}")
        elif change_type == 'list_items_added':
            details = change.get('details', '')
            formatted.append(f"{field}: {change['previous']}→{change['current']} {details}")
        elif change_type == 'list_items_removed':
            details = change.get('details', '')
            formatted.append(f"{field}: {change['previous']}→{change['current']} {details}")
        elif change_type == 'item_added':
            # For individual items, show a summary
            if isinstance(change['current'], dict):
                item_summary = get_item_summary(change['current'])
                formatted.append(f"{field}: +{item_summary}")
            else:
                formatted.append(f"{field}: +{change['current']}")
        elif change_type == 'item_removed':
            # For individual items, show a summary
            if isinstance(change['previous'], dict):
                item_summary = get_item_summary(change['previous'])
                formatted.append(f"{field}: -{item_summary}")
            else:
                formatted.append(f"{field}: -{change['previous']}")
        else:
            formatted.append(f"{field}: {change['previous']}→{change['current']}")
    
    return formatted

def get_item_summary(item):
    """Get a brief summary of an item for display."""
    if isinstance(item, dict):
        if 'unit_id' in item:
            return f"unit({item.get('unit_id', '?')})"
        elif 'item_id' in item:
            return f"item({item.get('item_id', '?')})"
        elif 'entindex' in item:
            return f"entindex({item.get('entindex', '?')})"
        else:
            return f"object({len(item)} fields)"
    return str(item)

def detect_changes_dynamic(player_id, new_data, sequence_num):
    """Detect changes between current and previous state using dynamic field tracking."""
    if player_id not in latest_states:
        latest_states[player_id] = copy.deepcopy(new_data)
        print(f"  🆕 {player_id} seq {sequence_num} - FIRST TIME")
        return []
    
    prev_data = latest_states[player_id]
    prev_sequence = prev_data.get('sequence_number', 0)
    
    # Use deep comparison to find ALL changes (including nested structures)
    all_changes, preserved_data = deep_compare_and_preserve(prev_data, new_data)
    
    # Filter out sequence_number changes as they're expected
    relevant_changes = [c for c in all_changes if c['field'] != 'sequence_number']
    
    # Format all changes for display (no special handling needed!)
    all_changes_formatted = format_changes_for_display(relevant_changes)
    
    if all_changes_formatted:
        changes.append({
            'player_id': player_id,
            'sequence': sequence_num,
            'timestamp': datetime.now().isoformat(),
            'changes': all_changes_formatted,
            'change_count': len(relevant_changes)
        })
        print(f"  🔄 {player_id} seq {prev_sequence}→{sequence_num} - {len(all_changes_formatted)} changes")
        for change in all_changes_formatted[:5]:  # Show first 5 changes
            print(f"    • {change}")
        if len(all_changes_formatted) > 5:
            print(f"    ... and {len(all_changes_formatted) - 5} more changes")
    else:
        print(f"  ⏸️  {player_id} seq {prev_sequence}→{sequence_num} - NO CHANGES")
    
    # Update latest state with preserved data (keeps old values for disappeared fields)
    latest_states[player_id] = preserved_data
    
    return all_changes_formatted

@app.route('/upload', methods=['POST'])
def receive_gsi_data():
    """Process GSI data with dynamic field tracking."""
    global total_requests
    
    try:
        data = request.get_json()
        if not data or 'block' not in data:
            return jsonify({"status": "ok"}), 200
        
        total_requests += 1
        timestamp = datetime.now()
        
        # Analyze data structure
        analyze_data_structure(data)
        structure_analysis['total_blocks_processed'] += 1
        
        # Process non-empty blocks
        non_empty_blocks = [block for block in data['block'] if isinstance(block, dict) and block]
        
        for block_index, block in enumerate(non_empty_blocks):
            if 'data' not in block:
                continue
            
            # Count object types
            public_count = sum(1 for obj in block['data'] if 'public_player_state' in obj)
            private_count = sum(1 for obj in block['data'] if 'private_player_state' in obj)
            
            structure_analysis['total_public_states'] += public_count
            structure_analysis['total_private_states'] += private_count
            
            print(f"\n[BLOCK {total_requests}, DATA {block_index + 1}] {public_count} public, {private_count} private player states")
            
            for data_obj in block['data']:
                if 'public_player_state' not in data_obj:
                    continue
                
                public_state = data_obj['public_player_state']
                player_id = get_player_id(public_state)
                sequence_num = public_state.get('sequence_number', 0)
                
                # Track unique players
                structure_analysis['unique_players_seen'].add(player_id)
                
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
                changes_found = detect_changes_dynamic(player_id, public_state, sequence_num)
                player_sequences[player_id].append((sequence_num, timestamp, public_state))
        
        # Update field coverage after processing
        update_field_coverage()
        
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
    """Get latest states (with preserved fields)."""
    return jsonify({'latest_states': latest_states})

@app.route('/field_analysis')
def get_field_analysis():
    """Analyze what fields are being tracked across all players."""
    return jsonify({
        'field_frequency': dict(field_frequency),
        'field_types': {k: list(v) for k, v in field_types.items()},
        'field_examples': {k: v for k, v in field_examples.items()},
        'total_unique_fields': len(field_frequency)
    })

@app.route('/structure_analysis')
def get_structure_analysis():
    """Get comprehensive analysis of the GSI data structure."""
    return jsonify({
        'summary': {
            'total_blocks_processed': structure_analysis['total_blocks_processed'],
            'total_public_states': structure_analysis['total_public_states'],
            'total_private_states': structure_analysis['total_private_states'],
            'unique_players_seen': len(structure_analysis['unique_players_seen']),
            'unique_player_ids': list(structure_analysis['unique_players_seen'])
        },
        'field_coverage': structure_analysis['field_coverage'],
        'most_common_fields': sorted(field_frequency.items(), key=lambda x: x[1], reverse=True)[:20],
        'least_common_fields': sorted(field_frequency.items(), key=lambda x: x[1])[:20]
    })

@app.route('/field_coverage')
def get_field_coverage():
    """Get field coverage analysis - which fields appear how often."""
    coverage_data = []
    for field_path, percentage in structure_analysis['field_coverage'].items():
        coverage_data.append({
            'field': field_path,
            'coverage_percentage': round(percentage, 2),
            'frequency': field_frequency[field_path],
            'types': list(field_types[field_path]),
            'examples': field_examples[field_path]
        })
    
    # Sort by coverage percentage (most common first)
    coverage_data.sort(key=lambda x: x['coverage_percentage'], reverse=True)
    
    return jsonify({
        'field_coverage': coverage_data,
        'always_present': [f for f in coverage_data if f['coverage_percentage'] == 100.0],
        'sometimes_present': [f for f in coverage_data if 0 < f['coverage_percentage'] < 100.0],
        'never_present': [f for f in coverage_data if f['coverage_percentage'] == 0.0]
    })

@app.route('/data_sample')
def get_data_sample():
    """Get a sample of the latest data received."""
    if not latest_states:
        return jsonify({'message': 'No data received yet'})
    
    # Get the most recent player's data as a sample
    latest_player = max(latest_states.keys(), key=lambda p: len(player_sequences[p]))
    sample_data = latest_states[latest_player]
    
    return jsonify({
        'sample_player_id': latest_player,
        'sample_data': sample_data,
        'data_structure_note': 'This shows the actual structure of data received, with preserved fields for disappeared values'
    })

if __name__ == '__main__':
    print("GSI Test Server - Dynamic Field Tracking")
    print("Listening on: http://localhost:3001/upload")
    print("\nEndpoints:")
    print("  • /stats - Basic statistics")
    print("  • /duplicates - Duplicate sequence detection")
    print("  • /changes - All detected changes")
    print("  • /latest - Latest player states (with preserved fields)")
    print("  • /field_analysis - Field frequency and types")
    print("  • /structure_analysis - Comprehensive data structure analysis")
    print("  • /field_coverage - Field presence percentage analysis")
    print("  • /data_sample - Sample of actual received data")
    print("\nFeatures:")
    print("  • Automatically tracks ALL fields in JSON")
    print("  • Preserves old values when fields disappear")
    print("  • Deep comparison for nested objects")
    print("  • Detailed change analysis")
    print("  • Real-time data structure analysis")
    print("  • Field coverage tracking")
    print("\nStart playing Dota Underlords...")
    
    app.run(host='0.0.0.0', port=3001, debug=False)
