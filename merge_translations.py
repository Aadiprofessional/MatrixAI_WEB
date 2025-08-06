#!/usr/bin/env python3
import json
import os
from pathlib import Path

def load_json_file(file_path):
    """Load JSON file with error handling"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {file_path} not found")
        return {}
    except json.JSONDecodeError as e:
        print(f"Error parsing {file_path}: {e}")
        return {}

def save_json_file(data, file_path):
    """Save JSON file with proper formatting"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated: {file_path}")

def merge_translations():
    """Merge extracted translations into existing translation files"""
    
    # Load extracted translations
    extracted_file = 'extracted_translations.json'
    if not os.path.exists(extracted_file):
        print(f"Error: {extracted_file} not found")
        return
    
    extracted_data = load_json_file(extracted_file)
    print(f"Loaded extracted translations with {len(extracted_data)} sheets")
    
    # Define translation file paths
    translation_files = {
        'en': 'public/locales/en/translation.json',
        'zh-CN': 'public/locales/zh-CN/translation.json',
        'zh-TW': 'public/locales/zh-TW/translation.json'
    }
    
    # Load existing translation files
    existing_translations = {}
    for lang, file_path in translation_files.items():
        existing_translations[lang] = load_json_file(file_path)
        print(f"Loaded existing {lang} translations: {len(existing_translations[lang])} keys")
    
    # Merge extracted translations
    merged_count = 0
    new_keys_added = {lang: 0 for lang in translation_files.keys()}
    
    for sheet_name, sheet_data in extracted_data.items():
        print(f"\nProcessing sheet: {sheet_name}")
        
        for english_text, translations in sheet_data.items():
            if not isinstance(translations, dict):
                continue
                
            # Create a safe key from the English text
            # Remove special characters and limit length
            safe_key = re.sub(r'[^a-zA-Z0-9\s]', '', english_text)
            safe_key = re.sub(r'\s+', '_', safe_key.strip())
            safe_key = safe_key.lower()[:50]  # Limit length
            
            # If key is too short or empty, use a fallback
            if len(safe_key) < 3:
                safe_key = f"extracted_{sheet_name}_{merged_count}"
            
            # Create nested structure for extracted content
            section_key = f"extracted_{sheet_name}"
            
            # Add translations to each language file
            for lang in translation_files.keys():
                if lang in translations:
                    # Initialize section if it doesn't exist
                    if section_key not in existing_translations[lang]:
                        existing_translations[lang][section_key] = {}
                    
                    # Add the translation if it doesn't exist
                    if safe_key not in existing_translations[lang][section_key]:
                        existing_translations[lang][section_key][safe_key] = translations[lang]
                        new_keys_added[lang] += 1
            
            merged_count += 1
    
    # Save updated translation files
    for lang, file_path in translation_files.items():
        save_json_file(existing_translations[lang], file_path)
        print(f"Added {new_keys_added[lang]} new translations to {lang}")
    
    print(f"\n=== MERGE SUMMARY ===")
    print(f"Total translations processed: {merged_count}")
    for lang in translation_files.keys():
        print(f"{lang}: {new_keys_added[lang]} new translations added")
    print("\nMerge completed successfully!")

if __name__ == "__main__":
    import re
    merge_translations()