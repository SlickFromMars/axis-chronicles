import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
CAMPAIGNS_DIR = PROJECT_ROOT / "campaigns"


def load_list(path):
    try:
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except Exception:
        return []
    return data if isinstance(data, list) else []


def check_location_references():
    """Warn (never fail) about location links that will not resolve."""
    warnings = 0

    for locations_file in sorted(CAMPAIGNS_DIR.glob("*/data/locations.json")):
        locations = [item for item in load_list(locations_file) if isinstance(item, dict)]
        characters = load_list(locations_file.parent / "characters.json")

        keys = {}
        for item in locations:
            keys[str(item.get("id", "")).lower()] = item
            keys[str(item.get("name", "")).lower()] = item
        region_keys = {
            key
            for key, item in keys.items()
            if str(item.get("type", "")).lower() == "region"
        }
        character_keys = {
            str(item.get("id", "")).lower()
            for item in characters
            if isinstance(item, dict)
        }

        def warn(item, message):
            nonlocal warnings
            warnings += 1
            print(f"WARNING: {locations_file} - {item.get('id', '?')}: {message}")

        for item in locations:
            region = item.get("region")
            if region and str(region).lower() not in region_keys:
                warn(item, f"region '{region}' is not a known region")

            for entry in item.get("connections") or []:
                ref = entry.get("location") or entry.get("id") if isinstance(entry, dict) else entry
                if str(ref).lower() not in keys:
                    warn(item, f"connection '{ref}' is not a known location")

            for ref in item.get("characters") or []:
                if str(ref).lower() not in character_keys:
                    warn(item, f"character '{ref}' is not in characters.json")

            for axis in ("x", "y"):
                value = item.get(axis)
                if not isinstance(value, (int, float)) or not 0 <= value <= 100:
                    warn(item, f"{axis} should be a number from 0 to 100")

    if warnings:
        print(f"{warnings} location warning(s). These do not fail validation.")


def main():
    files = sorted(CAMPAIGNS_DIR.rglob("*.json"))
    failed = False

    for file in files:
        try:
            with file.open("r", encoding="utf-8") as handle:
                json.load(handle)
        except Exception as error:
            print(f"ERROR: {file} - {error}")
            failed = True

    if failed:
        sys.exit(1)

    print(f"Validated {len(files)} JSON files.")
    check_location_references()


if __name__ == "__main__":
    main()
