#!/usr/bin/env python3
"""
validate_layers.py

Sanity-checks js/modules/datasetRegistry.js before you commit/push,
so a typo doesn't quietly break the live site at jazeeramap.com.

Checks:
  - each layer has the required fields for its type
  - no duplicate ids
  - "geojson" layers point at a file that actually exists
  - local .geojson files parse as valid JSON / FeatureCollections
  - "arcgis" layers have a plausible-looking FeatureServer URL

This is a lightweight regex-based parser (not a JS engine), so it
expects the registry to stay in the same style as the shipped file:
one JS object literal per layer, one field per line, inside the
LayerRegistry array. If you restructure the file heavily, this script
may need updating too.

Usage:
    python3 validate_layers.py
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REGISTRY_PATH = ROOT / "js" / "modules" / "datasetRegistry.js"

REQUIRED_COMMON = ["id", "name", "group", "type", "geomType", "visible"]
REQUIRED_BY_TYPE = {
    "arcgis": ["url"],
    "geojson": ["path"],
}


def extract_layer_blocks(text):
    """Split the LayerRegistry array into individual {...} object blocks."""
    start = text.find("const LayerRegistry")
    if start == -1:
        print("ERROR: could not find 'const LayerRegistry' in the file.")
        sys.exit(1)

    array_start = text.find("[", start)
    depth = 0
    blocks = []
    current = ""
    in_array = False

    for ch in text[array_start:]:
        if ch == "[":
            depth += 1
            if depth == 1:
                in_array = True
                continue
        if ch == "]":
            depth -= 1
            if depth == 0:
                break

        if in_array:
            current += ch

    # now split top-level {...} objects within `current`
    obj_depth = 0
    obj = ""
    for ch in current:
        if ch == "{":
            obj_depth += 1
        if obj_depth > 0:
            obj += ch
        if ch == "}":
            obj_depth -= 1
            if obj_depth == 0 and obj.strip():
                blocks.append(obj)
                obj = ""

    return blocks


def extract_field(block, field):
    # matches:  field: "value"   or   field: value   or   field: 'value'
    match = re.search(rf'{field}\s*:\s*["\']([^"\']+)["\']', block)
    if match:
        return match.group(1)

    match = re.search(rf'{field}\s*:\s*(true|false)', block)
    if match:
        return match.group(1) == "true"

    return None


def main():
    if not REGISTRY_PATH.exists():
        print(f"ERROR: {REGISTRY_PATH} not found.")
        sys.exit(1)

    text = REGISTRY_PATH.read_text()
    blocks = extract_layer_blocks(text)

    if not blocks:
        print("ERROR: no layer objects found — did the file structure change?")
        sys.exit(1)

    errors = []
    warnings = []
    seen_ids = set()

    for i, block in enumerate(blocks):
        layer_type = extract_field(block, "type")
        layer_id = extract_field(block, "id") or f"<layer #{i+1}, no id found>"

        for field in REQUIRED_COMMON:
            if extract_field(block, field) is None:
                errors.append(f"[{layer_id}] missing required field '{field}'")

        if layer_id in seen_ids:
            errors.append(f"[{layer_id}] duplicate id — ids must be unique")
        seen_ids.add(layer_id)

        if layer_type in REQUIRED_BY_TYPE:
            for field in REQUIRED_BY_TYPE[layer_type]:
                value = extract_field(block, field)
                if value is None:
                    errors.append(f"[{layer_id}] type '{layer_type}' requires '{field}'")
                    continue

                if field == "path":
                    file_path = ROOT / value
                    if not file_path.exists():
                        errors.append(f"[{layer_id}] path '{value}' does not exist on disk")
                    else:
                        try:
                            data = json.loads(file_path.read_text())
                            if data.get("type") != "FeatureCollection":
                                warnings.append(f"[{layer_id}] '{value}' is valid JSON but not a FeatureCollection")
                            elif "features" not in data:
                                warnings.append(f"[{layer_id}] '{value}' has no 'features' array")
                        except json.JSONDecodeError as e:
                            errors.append(f"[{layer_id}] '{value}' is not valid JSON ({e})")

                if field == "url":
                    if "FeatureServer" not in value and "MapServer" not in value:
                        warnings.append(f"[{layer_id}] url doesn't look like a FeatureServer/MapServer endpoint: {value}")
        elif layer_type not in (None,):
            warnings.append(f"[{layer_id}] unrecognized type '{layer_type}' (expected 'arcgis' or 'geojson')")

    print(f"Checked {len(blocks)} layer(s) in datasetRegistry.js\n")

    if warnings:
        print("Warnings:")
        for w in warnings:
            print("  -", w)
        print()

    if errors:
        print("Errors:")
        for e in errors:
            print("  -", e)
        print(f"\n{len(errors)} error(s) found. Fix these before pushing.")
        sys.exit(1)

    print("All layers look good.")
    sys.exit(0)


if __name__ == "__main__":
    main()
