from pathlib import Path
import json


# =========================================================
# CONFIGURATION
# =========================================================

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

CHARACTER_IMAGE_DIR = (
    PROJECT_ROOT
    / "assets"
    / "images"
    / "characters"
)

OUTPUT_FILE = (
    CHARACTER_IMAGE_DIR
    / "portrait-manifest.json"
)


# =========================================================
# GENERATE MANIFEST
# =========================================================

def generate_manifest():

    if not CHARACTER_IMAGE_DIR.exists():
        raise FileNotFoundError(
            f"Character image directory not found: "
            f"{CHARACTER_IMAGE_DIR}"
        )

    portraits = {}

    for image_file in sorted(
        CHARACTER_IMAGE_DIR.glob("*.webp")
    ):

        character_id = image_file.stem

        relative_path = image_file.relative_to(
            PROJECT_ROOT
        ).as_posix()

        portraits[character_id] = relative_path

    with OUTPUT_FILE.open(
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            portraits,
            file,
            indent=4
        )

        file.write("\n")

    print(
        f"Generated portrait manifest "
        f"with {len(portraits)} portraits."
    )


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":
    generate_manifest()
