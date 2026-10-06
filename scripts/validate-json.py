import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
CAMPAIGNS_DIR = PROJECT_ROOT / "campaigns"


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


if __name__ == "__main__":
    main()
