#!/usr/bin/env python3
import zipfile
import xml.etree.ElementTree as ET
import json
import re

def read_excel_translations():
    try:
        # Open Excel file as ZIP
        with zipfile.ZipFile('/Users/aadisrivastava/Downloads/project/MatrixAI/MatrixAI_Web/aiagent/Copy of Translate(1).xlsx', 'r') as z:
            # Get list of worksheet files
            worksheet_files = [f for f in z.namelist() if f.startswith('xl/worksheets/sheet') and f.endswith('.xml')]
            print(f"Found worksheets: {worksheet_files}")
            
            # Read shared strings if exists
            shared_strings = []
            try:
                with z.open('xl/sharedStrings.xml') as f:
                    shared_strings_xml = ET.parse(f)
                    for si in shared_strings_xml.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                        t_elem = si.find('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                        if t_elem is not None:
                            shared_strings.append(t_elem.text or '')
                        else:
                            shared_strings.append('')
                print(f"Found {len(shared_strings)} shared strings")
            except:
                print("No shared strings found, reading inline values")
            
            all_translations = {}
            
            # Process each worksheet
            for sheet_file in sorted(worksheet_files):
                sheet_name = sheet_file.split('/')[-1].replace('.xml', '')
                print(f"\n--- Processing {sheet_name} ---")
                
                with z.open(sheet_file) as f:
                    sheet_xml = ET.parse(f)
                    
                # Find all rows
                rows = sheet_xml.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
                print(f"Found {len(rows)} rows in {sheet_name}")
                
                sheet_translations = {}
                
                for row_idx, row in enumerate(rows):
                    cells = row.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c')
                    
                    if len(cells) >= 3:  # Need at least 3 columns
                        row_data = []
                        
                        for cell in cells[:3]:  # Only take first 3 columns
                            cell_value = ""
                            
                            # Check if cell has a value
                            v_elem = cell.find('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                            if v_elem is not None and v_elem.text:
                                # Check if it's a shared string reference
                                t_attr = cell.get('t')
                                if t_attr == 's' and shared_strings:
                                    # It's a shared string reference
                                    try:
                                        idx = int(v_elem.text)
                                        if 0 <= idx < len(shared_strings):
                                            cell_value = shared_strings[idx]
                                    except (ValueError, IndexError):
                                        cell_value = v_elem.text
                                else:
                                    # It's an inline value
                                    cell_value = v_elem.text
                            
                            # Also check for inline string
                            is_elem = cell.find('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is')
                            if is_elem is not None:
                                t_elem = is_elem.find('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                                if t_elem is not None and t_elem.text:
                                    cell_value = t_elem.text
                            
                            row_data.append(cell_value.strip() if cell_value else "")
                        
                        # Skip header row (row 0) and empty rows
                        if row_idx > 0 and len(row_data) >= 3 and row_data[0] and row_data[2]:
                            english_key = row_data[0]
                            chinese_traditional = row_data[2]
                            
                            if english_key and chinese_traditional:
                                sheet_translations[english_key] = chinese_traditional
                
                all_translations[sheet_name] = sheet_translations
                print(f"Extracted {len(sheet_translations)} translations from {sheet_name}")
                
                # Show some examples
                if sheet_translations:
                    print("Examples:")
                    for i, (eng, chi) in enumerate(list(sheet_translations.items())[:3]):
                        print(f"  '{eng}' -> '{chi}'")
            
            return all_translations
            
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    translations = read_excel_translations()
    if translations:
        print("\n=== SUMMARY ===")
        total_translations = 0
        for sheet_name, sheet_data in translations.items():
            count = len(sheet_data)
            total_translations += count
            print(f"{sheet_name}: {count} translations")
        print(f"\nTotal translations found: {total_translations}")
        
        # Save to a JSON file for inspection
        with open('extracted_translations.json', 'w', encoding='utf-8') as f:
            json.dump(translations, f, ensure_ascii=False, indent=2)
        print("\nSaved all translations to 'extracted_translations.json'")