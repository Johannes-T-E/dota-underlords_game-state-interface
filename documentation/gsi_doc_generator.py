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


def track_field(path, value, timestamp, parent_instance_id):
    """Track a field's occurrence and which parent instance contains it."""
    if path not in field_data:
        field_data[path] = {
            'type': get_type(value),
            'examples': [],
            'first_seen': timestamp,
            'last_seen': timestamp,
            'parent_instances': set(),
            'array_lengths': []
        }
    
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
        if len(info['examples']) < 5 and value not in info['examples']:
            info['examples'].append(value)
    
    # Track array lengths
    if isinstance(value, list):
        info['array_lengths'].append(len(value))


def analyze_structure(data, path='', timestamp=None, parent_instance_id=None):
    """
    Recursively analyze the data structure.

    - Records, for each object path, the set of unique parent instance IDs observed.
    - Ensures array items are traversed correctly (fixed indentation).
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

            # NEW: Track unique parent instances per path (used as denominator)
            parent_instances_seen[path].add(current_instance_id)

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
    included = len(field_data[path].get('parent_instances', set()))

    parts = path.split('.')
    if len(parts) == 1:
        # Root-level: each packet is a parent instance
        total = total_packets
    else:
        parent_path = '.'.join(parts[:-1])
        # Denominator: unique parent instances observed for the parent path
        total = len(parent_instances_seen.get(parent_path, set()))

    if total == 0:
        return 0.0

    return round((included / total) * 100.0, 1)


def build_hierarchical_structure():
    """Build hierarchical JSON structure from flat field data."""
    
    def create_node(field_path):
        """Create a node with field information."""
        if field_path not in field_data:
            return None
        
        info = field_data[field_path]
        presence = calculate_presence(field_path)
        frequency = len(info['parent_instances'])
        
        return {
            'type': info['type'],
            'presence_percentage': round(presence, 1),
            'frequency': frequency,
            'first_seen': info['first_seen'].isoformat() if info['first_seen'] else None,
            'last_seen': info['last_seen'].isoformat() if info['last_seen'] else None,
            'examples': info['examples'][:5],
            'array_lengths': info['array_lengths'][:10] if info.get('array_lengths') else []
        }
    
    def add_to_tree(tree, path, node):
        """Add a node to the tree at the specified path."""
        parts = path.split('.')
        current = tree
        
        for i, part in enumerate(parts[:-1]):
            if part not in current:
                # Create intermediate node
                intermediate_path = '.'.join(parts[:i+1])
                current[part] = create_node(intermediate_path) or {
                    'type': 'object',
                    'presence_percentage': 100.0,
                    'frequency': 0
                }
                if 'children' not in current[part]:
                    current[part]['children'] = {}
            
            if 'children' not in current[part]:
                current[part]['children'] = {}
            current = current[part]['children']
        
        # Add the final node
        current[parts[-1]] = node
        if node and node.get('type') in ['object', 'array']:
            if 'children' not in current[parts[-1]]:
                current[parts[-1]]['children'] = {}
    
    # Build the tree structure
    tree = {}
    
    # Sort paths to ensure parents are created before children
    sorted_paths = sorted(field_data.keys(), key=lambda x: (x.count('.'), x))
    
    for path in sorted_paths:
        node = create_node(path)
        if node:
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
    for path, info in sorted(field_data.items()):
        fields.append({
            'path': path,
            'type': info['type'],
            'frequency': len(info['parent_instances']),
            'presence': calculate_presence(path),
            'examples': info['examples'][:3]
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
    for path, info in sorted(field_data.items()):
        fields.append({
            'path': path,
            'type': info['type'],
            'frequency': len(info['parent_instances']),
            'presence_percentage': round(calculate_presence(path), 1),
            'first_seen': info['first_seen'].isoformat() if info['first_seen'] else None,
            'last_seen': info['last_seen'].isoformat() if info['last_seen'] else None,
            'examples': info['examples'][:5],
            'array_lengths': info['array_lengths'][:10] if info.get('array_lengths') else []
        })
    
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
        if field_path not in field_data:
            return None
        
        info = field_data[field_path]
        node = {
            'type': info['type'],
            'required': calculate_presence(field_path) == 100.0
        }
        
        # Add examples for primitive types
        if info['examples']:
            node['examples'] = info['examples'][:3]
        
        # Add array length info
        if info['type'] == 'array' and info.get('array_lengths'):
            lengths = info['array_lengths']
            node['min_length'] = min(lengths) if lengths else 0
            node['max_length'] = max(lengths) if lengths else 0
            node['avg_length'] = round(sum(lengths) / len(lengths), 1) if lengths else 0
        
        return node
    
    def build_schema_tree():
        """Build simplified schema tree."""
        schema = {}
        
        # Sort paths to ensure parents are created before children
        sorted_paths = sorted(field_data.keys(), key=lambda x: (x.count('.'), x))
        
        for path in sorted_paths:
            parts = path.split('.')
            current = schema
            
            # Navigate/create path
            for i, part in enumerate(parts[:-1]):
                if part not in current:
                    current[part] = {}
                current = current[part]
            
            # Add the field
            node = build_schema_node(path)
            if node:
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
                optional = "" if value.get('presence_percentage', 100) == 100.0 else "?"
                
                if value['type'] == 'array' and value.get('children'):
                    # For arrays with children, generate the child interface
                    child_name = f"{name}_{key.title()}"
                    lines.append(f"{indent}  {key}{optional}: {child_name}[];")
                    lines.append("")
                    lines.append(generate_interface(child_name, value['children'], depth))
                elif value['type'] == 'object' and value.get('children'):
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
        return type_map.get(field_type, 'any')
    
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
    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'formats': {
            'full_documentation': generate_json_documentation(),
            'structure_only': build_hierarchical_structure(),
            'flat_fields': [{
                'path': path,
                'type': info['type'],
                'frequency': len(info['parent_instances']),
                'presence_percentage': round(calculate_presence(path), 1),
                'examples': info['examples'][:3]
            } for path, info in sorted(field_data.items())],
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
