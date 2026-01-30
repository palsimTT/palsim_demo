#!/usr/bin/env python3
"""
Extract context_info.json files from context_videoclips subfolders
and rename them using their 'context' field as filename.
"""

import json
import shutil
from pathlib import Path

def main():
    # Source and destination paths
    source_dir = Path(__file__).parent / 'context_videoclips'
    output_dir = Path(__file__).parent / 'context_jsons'
    
    # Create output directory
    output_dir.mkdir(exist_ok=True)
    
    # Counter for statistics
    count = 0
    
    # Iterate through all subdirectories
    for folder in sorted(source_dir.iterdir()):
        if not folder.is_dir():
            continue
        
        json_file = folder / 'context_info.json'
        if not json_file.exists():
            print(f"Warning: No context_info.json in {folder.name}")
            continue
        
        # Read JSON and get context field
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        context = data.get('context', '')
        if not context:
            print(f"Warning: No 'context' field in {folder.name}/context_info.json")
            continue
        
        # Create safe filename (replace commas with underscores)
        safe_filename = context.replace(',', '_') + '.json'
        output_path = output_dir / safe_filename
        
        # Copy file with new name
        shutil.copy2(json_file, output_path)
        count += 1
        print(f"Copied: {folder.name} -> {safe_filename}")
    
    print(f"\nDone! Extracted {count} JSON files to '{output_dir}'")

if __name__ == '__main__':
    main()
