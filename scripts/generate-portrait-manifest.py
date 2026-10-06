from pathlib import Path
import argparse
import json


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DEFAULT_CAMPAIGN = "breaking-the-axis"


def get_character_image_dir(campaign_id):
    return (
        PROJECT_ROOT
        / "campaigns"
        / campaign_id
        / "assets"
        / "characters"
    )


def generate_manifest(campaign_id):
    character_image_dir = get_character_image_dir(campaign_id)
    output_file = character_image_dir / "portrait-manifest.json"

    if not character_image_dir.exists():
        raise FileNotFoundError(
            f"Character image directory not found: {character_image_dir}"
        )

    portraits = {}

    for image_file in sorted(character_image_dir.glob("*.webp")):
        portraits[image_file.stem] = image_file.name

    with output_file.open("w", encoding="utf-8") as file:
        json.dump(portraits, file, indent=4)
        file.write("\n")

    print(
        f"Generated portrait manifest for '{campaign_id}' "
        f"with {len(portraits)} portraits: {output_file}"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("campaign", nargs="?", default=DEFAULT_CAMPAIGN)
    args = parser.parse_args()
    generate_manifest(args.campaign)
