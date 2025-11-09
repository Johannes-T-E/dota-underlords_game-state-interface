"""
GSI Documentation Generator - Simplified
Analyzes GSI data structure and generates JSON documentation for HTML viewer.
"""

from flask import Flask, request, jsonify
from datetime import datetime
from collections import defaultdict
import json

app = Flask(__name__)

# Global tracking state
field_data = {}  # path: {type, examples, parent_instances: set(), timestamps}
parent_instance_counts = {}  # path: total count of parent instances
total_packets = 0  # Total data packets received
instance_counters = {}  # Track instance IDs for each path
parent_instances_seen = defaultdict(set)  # path -> set of unique parent instance IDs
field_order = {}  # parent_path: [key1, key2, key3, ...] - order of keys within each parent object
example_values = 10

def get_type(value):
    """Get the type of a value."""
    if value is None:
        return 'null'
    elif isinstance(value, bool):
        return 'boolean'
    elif isinstance(value, int):
        return 'integer'
    elif isinstance(value, float):
        return 'float'
    elif isinstance(value, str):
        return 'string'
    elif isinstance(value, list):
        return 'array'
    elif isinstance(value, dict):
        return 'object'
    else:
        return 'unknown'


def insert_field_in_order(parent_path, new_key, current_keys_in_packet):
    """
    Insert a new field key into the field_order for a parent path.
    Determines position based on where it appears in the current packet.
    """
    if parent_path not in field_order:
        # First time seeing this parent - record all keys in order
        field_order[parent_path] = list(current_keys_in_packet)
        return
    
    # Find position in current packet
    current_order = field_order[parent_path]
    
    # Find the key that comes before and after new_key in the current packet
    packet_keys = list(current_keys_in_packet)
    new_key_index = packet_keys.index(new_key)
    
    # Find the last key before new_key that exists in our tracked order
    before_key = None
    for i in range(new_key_index - 1, -1, -1):
        if packet_keys[i] in current_order:
            before_key = packet_keys[i]
            break
    
    # Find the first key after new_key that exists in our tracked order
    after_key = None
    for i in range(new_key_index + 1, len(packet_keys)):
        if packet_keys[i] in current_order:
            after_key = packet_keys[i]
            break
    
    # Insert the new key
    if before_key is not None:
        # Insert after before_key
        before_index = current_order.index(before_key)
        current_order.insert(before_index + 1, new_key)
    elif after_key is not None:
        # Insert before after_key
        after_index = current_order.index(after_key)
        current_order.insert(after_index, new_key)
    else:
        # No neighbors found - append to end
        current_order.append(new_key)


def track_field(path, value, timestamp, parent_instance_id):
    """Track a field's occurrence and which parent instance contains it."""
    if path not in field_data:
        field_type = get_type(value)
        field_data[path] = {
            'type': field_type,
            'examples': [],
            #'first_seen': timestamp,
            #'last_seen': timestamp,
            'parent_instances': set()
        }
        # Only initialize array_lengths for array types
        if field_type == 'array':
            field_data[path]['array_lengths'] = []
    
    info = field_data[path]
    info['last_seen'] = timestamp
    
    # Record which parent instance contains this field
    if parent_instance_id:
        info['parent_instances'].add(parent_instance_id)
    else:
        # For root level fields, use packet number as instance
        info['parent_instances'].add(f"packet_{total_packets}")
    
    # Store examples for primitive types
    if isinstance(value, (str, int, float, bool)) and value is not None:
        if len(info['examples']) < example_values and value not in info['examples']:
            info['examples'].append(value)
    
    # Track array lengths only for array types
    if isinstance(value, list):
        if 'array_lengths' not in info:
            info['array_lengths'] = []
        info['array_lengths'].append(len(value))


def analyze_structure(data, path='', timestamp=None, parent_instance_id=None):
    """
    Recursively analyze the data structure.

    - Records, for each object path, the set of unique parent instance IDs observed.
    - Ensures array items are traversed correctly (fixed indentation).
    - Tracks field order within each parent object.
    """
    if isinstance(data, dict):
        # Skip empty dicts in block arrays
        if path == 'block' and not data:
            return

        # Generate unique instance ID for this dict
        if path not in instance_counters:
            instance_counters[path] = 0
        instance_counters[path] += 1
        current_instance_id = f"{path}#{instance_counters[path]}"

        # Count this as a parent instance
        if path:
            if path not in parent_instance_counts:
                parent_instance_counts[path] = 0
            parent_instance_counts[path] += 1

            # Track unique parent instances per path (used as denominator)
            parent_instances_seen[path].add(current_instance_id)

        # Track field order for this parent object
        # Get keys in the order they appear in the current packet
        current_keys = list(data.keys())
        for key in current_keys:
            current_path = f"{path}.{key}" if path else key
            # Check if this is a new field
            if current_path not in field_data:
                # New field - insert it in the correct position
                insert_field_in_order(path, key, current_keys)

        # Analyze each field in this dict
        for key, value in data.items():
            current_path = f"{path}.{key}" if path else key

            # Track this field with the parent instance ID
            track_field(current_path, value, timestamp, current_instance_id)

            # Recursively analyze nested structures
            if isinstance(value, dict):
                analyze_structure(value, current_path, timestamp, current_instance_id)
            elif isinstance(value, list):
                # Analyze array items (FIXED INDENTATION)
                for item in value:
                    analyze_structure(item, current_path, timestamp, current_instance_id)

    elif isinstance(data, list):
        # This handles the case where we're at the root of an array
        for item in data:
            analyze_structure(item, path, timestamp, parent_instance_id)


def calculate_presence(path):
    """
    Presence (%) of `path` within its parent objects.

    presence = (# unique parent instances that included `path`)
               / (# unique parent instances of the parent) * 100

    - Numerator: size of field_data[path]['parent_instances']
    - Denominator: number of unique parent instances recorded for the parent path
    - For root-level fields (no parent), the parent instances are packets, so we use total_packets.
    """
    if path not in field_data:
        return 0.0

    # Numerator: how many distinct parent instances included this field
    included = len(field_data[path]['parent_instances'])

    parts = path.split('.')
    if len(parts) == 1:
        # Root-level: each packet is a parent instance
        total = total_packets
    else:
        parent_path = '.'.join(parts[:-1])
        # Denominator: unique parent instances observed for the parent path
        total = len(parent_instances_seen[parent_path])

    if total == 0:
        return 0.0

    return round((included / total) * 100.0, 1)


def get_ordered_paths():
    """
    Get all paths in the correct order based on field_order.
    Returns paths sorted by depth first, then by field_order within each parent.
    """
    # Group paths by depth
    paths_by_depth = defaultdict(list)
    for path in field_data.keys():
        depth = path.count('.')
        paths_by_depth[depth].append(path)
    
    # Build ordered paths level by level
    ordered_paths = []
    
    # Process each depth level
    for depth in sorted(paths_by_depth.keys()):
        depth_paths = paths_by_depth[depth]
        
        if depth == 0:
            # Root level - use field_order if available
            if '' in field_order:
                root_order = field_order['']
                # Add paths in field_order
                for key in root_order:
                    if key in field_data:
                        ordered_paths.append(key)
                # Add any remaining paths not in field_order
                for path in depth_paths:
                    if path not in ordered_paths:
                        ordered_paths.append(path)
            else:
                ordered_paths.extend(depth_paths)
        else:
            # Nested paths - group by parent
            paths_by_parent = defaultdict(list)
            for path in depth_paths:
                parts = path.split('.')
                parent_path = '.'.join(parts[:-1])
                paths_by_parent[parent_path].append(path)
            
            # Process each parent that we've already seen
            for parent_path in ordered_paths:
                if parent_path in paths_by_parent:
                    child_paths = paths_by_parent[parent_path]
                    # Get the key order for this parent
                    if parent_path in field_order:
                        parent_key_order = field_order[parent_path]
                        # Extract keys from child paths
                        child_keys = [p.split('.')[-1] for p in child_paths]
                        # Order by field_order
                        ordered_child_keys = [k for k in parent_key_order if k in child_keys]
                        # Add any keys not in field_order
                        for k in child_keys:
                            if k not in ordered_child_keys:
                                ordered_child_keys.append(k)
                        # Build full paths in order
                        for key in ordered_child_keys:
                            child_path = f"{parent_path}.{key}"
                            if child_path in field_data:
                                ordered_paths.append(child_path)
                    else:
                        # No field_order for this parent - add children as-is
                        ordered_paths.extend(child_paths)
            
            # Add any remaining parents we haven't processed yet
            for parent_path, child_paths in paths_by_parent.items():
                if parent_path not in ordered_paths:
                    # Parent not yet processed - add children as-is
                    ordered_paths.extend(child_paths)
    
    return ordered_paths


def build_hierarchical_structure():
    """Build hierarchical JSON structure from flat field data."""
    
    def create_node(field_path):
        """Create a node with field information."""
        info = field_data[field_path]
        presence = calculate_presence(field_path)
        frequency = len(info['parent_instances'])
        
        node = {
            'type': info['type'],
            'presence_percentage': round(presence, 1),
            'frequency': frequency,
            #'first_seen': info['first_seen'].isoformat() if info['first_seen'] else None,
            #'last_seen': info['last_seen'].isoformat() if info['last_seen'] else None,
            'examples': info['examples'][:example_values]
        }
        # Only include array_lengths for array types
        if info['type'] == 'array' and 'array_lengths' in info:
            node['array_lengths'] = info['array_lengths'][:10]
        return node
    
    def add_to_tree(tree, path, node):
        """Add a node to the tree at the specified path."""
        parts = path.split('.')
        current = tree
        
        for i, part in enumerate(parts[:-1]):
            if part not in current:
                # Create intermediate node
                intermediate_path = '.'.join(parts[:i+1])
                intermediate_node = create_node(intermediate_path)
                current[part] = intermediate_node
                current[part]['children'] = {}
            
            if 'children' not in current[part]:
                current[part]['children'] = {}
            current = current[part]['children']
        
        # Add the final node
        current[parts[-1]] = node
        if node['type'] in ['object', 'array']:
            if 'children' not in current[parts[-1]]:
                current[parts[-1]]['children'] = {}
    
    # Build the tree structure
    tree = {}
    
    # Get paths in the correct order
    ordered_paths = get_ordered_paths()
    
    for path in ordered_paths:
        node = create_node(path)
        # Add description for known fields
        if path == 'block':
            node['description'] = 'Root array containing game state blocks'
        elif path == 'block.data':
            node['description'] = 'Array of player data objects'
        elif path == 'block.data.public_player_state':
            node['description'] = 'Public player state information'
        elif path == 'block.data.private_player_state':
            node['description'] = 'Private player state information'
        
        add_to_tree(tree, path, node)
    
    return tree


def generate_json_documentation():
    """Generate JSON documentation structure."""
    structure = build_hierarchical_structure()
    
    return {
        'timestamp': datetime.now().isoformat(),
        'total_samples': total_packets,
        'field_count': len(field_data),
        'parent_instance_counts': dict(parent_instance_counts),
        'structure': structure
    }


def save_json_documentation():
    """Save JSON documentation to file."""
    doc = generate_json_documentation()
    filename = 'gsi_documentation.json'
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(doc, f, indent=2)
    
    return filename


@app.route('/upload', methods=['POST'])
def receive_gsi_data():
    """Receive and analyze GSI data."""
    global total_packets
    
    try:
        data = request.get_json()
        if not data or 'block' not in data:
            return jsonify({"status": "ok"}), 200
        
        timestamp = datetime.now()
        total_packets += 1
        
        # Analyze the structure
        analyze_structure(data, timestamp=timestamp)
        
        # Save documentation after each packet
        filename = save_json_documentation()
        print(f"[{timestamp.strftime('%H:%M:%S')}] Packet #{total_packets} processed - {filename} updated")
        
        return jsonify({"status": "ok"}), 200
    
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/stats')
def get_stats():
    """Get current statistics."""
    return jsonify({
        'total_packets': total_packets,
        'field_count': len(field_data),
        'parent_instance_counts': dict(parent_instance_counts)
    })


@app.route('/fields')
def get_fields():
    """Get all tracked fields."""
    fields = []
    # Use ordered paths instead of sorting
    ordered_paths = get_ordered_paths()
    for path in ordered_paths:
        info = field_data[path]
        fields.append({
            'path': path,
            'type': info['type'],
            'frequency': len(info['parent_instances']),
            'presence': calculate_presence(path),
            'examples': info['examples'][:example_values]
        })
    
    return jsonify({'fields': fields})


@app.route('/generate')
def force_generate():
    """Force regenerate documentation."""
    filename = save_json_documentation()
    return jsonify({
        'status': 'success',
        'filename': filename,
        'message': f'Documentation saved to {filename}'
    })


@app.route('/json/structure')
def get_structure_json():
    """Get just the hierarchical structure as JSON (without metadata)."""
    structure = build_hierarchical_structure()
    return jsonify(structure)


@app.route('/json/flat')
def get_flat_json():
    """Get flattened list of all fields as JSON."""
    fields = []
    # Use ordered paths instead of sorting
    ordered_paths = get_ordered_paths()
    for path in ordered_paths:
        info = field_data[path]
        field_obj = {
            'path': path,
            'type': info['type'],
            'frequency': len(info['parent_instances']),
            'presence_percentage': round(calculate_presence(path), 1),
            #'first_seen': info['first_seen'].isoformat() if info['first_seen'] else None,
            #'last_seen': info['last_seen'].isoformat() if info['last_seen'] else None,
            'examples': info['examples'][:example_values]
        }
        # Only include array_lengths for array types
        if info['type'] == 'array' and 'array_lengths' in info:
            field_obj['array_lengths'] = info['array_lengths'][:10]
        fields.append(field_obj)
    
    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'total_samples': total_packets,
        'field_count': len(field_data),
        'fields': fields
    })


@app.route('/json/schema')
def get_schema_json():
    """Get simplified schema JSON for easy parsing."""
    def build_schema_node(field_path):
        """Build a simplified schema node."""
        info = field_data[field_path]
        node = {
            'type': info['type'],
            'required': calculate_presence(field_path) == 100.0
        }
        
        # Add examples for primitive types
        if info['examples']:
            node['examples'] = info['examples'][:example_values]
        
        # Add array length info only for array types
        if info['type'] == 'array' and 'array_lengths' in info and info['array_lengths']:
            lengths = info['array_lengths']
            node['min_length'] = min(lengths)
            node['max_length'] = max(lengths)
            node['avg_length'] = round(sum(lengths) / len(lengths), 1)
        
        return node
    
    def build_schema_tree():
        """Build simplified schema tree using field_order."""
        schema = {}
        
        # Get paths in the correct order
        ordered_paths = get_ordered_paths()
        
        for path in ordered_paths:
            parts = path.split('.')
            current = schema
            
            # Navigate/create path
            for i, part in enumerate(parts[:-1]):
                if part not in current:
                    current[part] = {}
                current = current[part]
            
            # Add the field
            node = build_schema_node(path)
            current[parts[-1]] = node
        
        return schema
    
    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'total_samples': total_packets,
        'field_count': len(field_data),
        'schema': build_schema_tree()
    })


@app.route('/json/typescript')
def get_typescript_interfaces():
    """Generate TypeScript interface definitions."""
    def generate_interface(name, structure, depth=0):
        """Generate TypeScript interface from structure."""
        indent = "  " * depth
        lines = [f"{indent}interface {name} {{"]
        
        for key, value in structure.items():
            if isinstance(value, dict) and 'type' in value:
                ts_type = get_typescript_type(value['type'])
                optional = "" if value['presence_percentage'] == 100.0 else "?"
                
                if value['type'] == 'array' and 'children' in value:
                    # For arrays with children, generate the child interface
                    child_name = f"{name}_{key.title()}"
                    lines.append(f"{indent}  {key}{optional}: {child_name}[];")
                    lines.append("")
                    lines.append(generate_interface(child_name, value['children'], depth))
                elif value['type'] == 'object' and 'children' in value:
                    # For objects with children, generate nested interface
                    child_name = f"{name}_{key.title()}"
                    lines.append(f"{indent}  {key}{optional}: {child_name};")
                    lines.append("")
                    lines.append(generate_interface(child_name, value['children'], depth))
                else:
                    lines.append(f"{indent}  {key}{optional}: {ts_type};")
        
        lines.append(f"{indent}}}")
        return "\n".join(lines)
    
    def get_typescript_type(field_type):
        """Convert field type to TypeScript type."""
        type_map = {
            'string': 'string',
            'integer': 'number',
            'float': 'number',
            'boolean': 'boolean',
            'array': 'any[]',
            'object': 'object',
            'null': 'null'
        }
        return type_map[field_type]
    
    structure = build_hierarchical_structure()
    interfaces = []
    
    # Generate main interface
    if 'block' in structure:
        interfaces.append(generate_interface('GSIData', structure))
    
    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'interfaces': interfaces,
        'typescript': "\n\n".join(interfaces)
    })


@app.route('/json/export')
def export_all_formats():
    """Export all JSON formats at once."""
    # Use ordered paths instead of sorting
    ordered_paths = get_ordered_paths()
    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'formats': {
            'full_documentation': generate_json_documentation(),
            'structure_only': build_hierarchical_structure(),
            'flat_fields': [{
                'path': path,
                'type': field_data[path]['type'],
                'frequency': len(field_data[path]['parent_instances']),
                'presence_percentage': round(calculate_presence(path), 1),
                'examples': field_data[path]['examples'][:example_values]
            } for path in ordered_paths],
            'statistics': {
                'total_packets': total_packets,
                'field_count': len(field_data),
                'parent_instance_counts': dict(parent_instance_counts)
            }
        }
    })


if __name__ == '__main__':
    print("=" * 60)
    print("GSI Documentation Generator - Simplified")
    print("=" * 60)
    print(f"\nServer: http://localhost:3000")
    print(f"\nEndpoints:")
    print(f"  POST /upload         - Receive GSI data")
    print(f"  GET  /stats          - View statistics")
    print(f"  GET  /fields         - View all fields")
    print(f"  GET  /generate       - Force regenerate documentation")
    print(f"\nJSON Export Endpoints:")
    print(f"  GET  /json/structure - Get hierarchical structure only")
    print(f"  GET  /json/flat      - Get flattened field list")
    print(f"  GET  /json/schema    - Get simplified schema")
    print(f"  GET  /json/typescript- Get TypeScript interfaces")
    print(f"  GET  /json/export    - Get all formats at once")
    print(f"\nOutput: gsi_documentation.json")
    print(f"\nWaiting for GSI data...")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=3000, debug=False)
