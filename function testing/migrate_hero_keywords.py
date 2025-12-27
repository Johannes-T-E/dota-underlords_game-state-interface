#!/usr/bin/env python3
"""
Migration script to convert hero keywords from strings to integer arrays.

This script reads the hero data and keyword mappings, then converts
all keyword strings (e.g., "brawny brute") to integer arrays (e.g., [34, 52])
using the correct keyword IDs from the mappings file.
"""

import json
import os
from pathlib import Path

# Special case mappings for outdated keyword names
KEYWORD_NAME_MAPPINGS = {
    'scaled': 'Naga',
    'heartless': 'Undead',
    'brute': 'Brutal',
}

def parse_keywords_string(keywords_string: str, reverse_mappings: dict) -> list[int]:
    """
    Parse a keywords string into an array of integer keyword IDs.
    
    Args:
        keywords_string: Space-separated string of keywords (e.g., "brawny brute")
        reverse_mappings: Dictionary mapping synergy names to keyword IDs
        
    Returns:
        List of integer keyword IDs
    """
    if not keywords_string or not keywords_string.strip():
        return []
    
    keywords = []
    words = keywords_string.strip().split()
    
    for word in words:
        word_lower = word.lower()
        
        # Apply special case mappings first
        if word_lower in KEYWORD_NAME_MAPPINGS:
            synergy_name = KEYWORD_NAME_MAPPINGS[word_lower]
        else:
            # Capitalize first letter (e.g., "knight" -> "Knight")
            synergy_name = word.capitalize()
        
        # Look up in reverse_mappings
        keyword_id = reverse_mappings.get(synergy_name)
        if keyword_id is not None:
            keywords.append(keyword_id)
        else:
            print(f"Warning: Could not find mapping for keyword '{word}' (synergy name: '{synergy_name}')")
    
    return keywords

def migrate_hero_keywords():
    """Main migration function."""
    # Get the project root directory (assuming script is in function testing/)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # File paths
    heroes_file = project_root / 'frontend' / 'public' / 'underlords_heroes.json'
    mappings_file = project_root / 'frontend' / 'public' / 'synergy_keyword_mappings.json'
    
    # Check if files exist
    if not heroes_file.exists():
        print(f"Error: Heroes file not found at {heroes_file}")
        return False
    
    if not mappings_file.exists():
        print(f"Error: Mappings file not found at {mappings_file}")
        return False
    
    # Read keyword mappings
    print(f"Reading keyword mappings from {mappings_file}...")
    with open(mappings_file, 'r', encoding='utf-8') as f:
        mappings_data = json.load(f)
    
    reverse_mappings = mappings_data.get('reverse_mappings', {})
    if not reverse_mappings:
        print("Error: reverse_mappings not found in mappings file")
        return False
    
    print(f"Found {len(reverse_mappings)} keyword mappings")
    
    # Read hero data
    print(f"Reading hero data from {heroes_file}...")
    with open(heroes_file, 'r', encoding='utf-8') as f:
        heroes_data = json.load(f)
    
    heroes = heroes_data.get('heroes', {})
    if not heroes:
        print("Error: heroes not found in heroes file")
        return False
    
    print(f"Found {len(heroes)} heroes")
    
    # Migrate keywords
    migrated_count = 0
    skipped_count = 0
    
    for hero_name, hero_data in heroes.items():
        if 'keywords' not in hero_data:
            print(f"Warning: Hero '{hero_name}' has no keywords field")
            skipped_count += 1
            continue
        
        keywords_value = hero_data['keywords']
        
        # Check if already migrated (is already a list)
        if isinstance(keywords_value, list):
            print(f"Skipping '{hero_name}' - already migrated (keywords is already an array)")
            skipped_count += 1
            continue
        
        # Convert string to array
        if isinstance(keywords_value, str):
            keyword_ids = parse_keywords_string(keywords_value, reverse_mappings)
            hero_data['keywords'] = keyword_ids
            migrated_count += 1
            print(f"Migrated '{hero_name}': '{keywords_value}' -> {keyword_ids}")
        else:
            print(f"Warning: Hero '{hero_name}' has keywords of unexpected type: {type(keywords_value)}")
            skipped_count += 1
    
    print(f"\nMigration complete:")
    print(f"  - Migrated: {migrated_count} heroes")
    print(f"  - Skipped: {skipped_count} heroes")
    
    # Write updated hero data back to file
    print(f"\nWriting updated hero data to {heroes_file}...")
    with open(heroes_file, 'w', encoding='utf-8') as f:
        json.dump(heroes_data, f, indent=2, ensure_ascii=False)
    
    print("Migration completed successfully!")
    return True

if __name__ == '__main__':
    success = migrate_hero_keywords()
    exit(0 if success else 1)

