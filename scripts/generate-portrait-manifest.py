from pathlib import Path
import argparse
import json


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
CAMPAIGNS_DIR = PROJECT_ROOT / "campaigns"
DEFAULT_CAMPAIGN = "breaking-the-axis"


def get_campaign_dir(campaign_id):
    return CAMPAIGNS_DIR / campaign_id


def get_character_image_dir(campaign_id):
    return get_campaign_dir(campaign_id) / "assets" / "characters"


def generate_manifest(campaign_id):
    campaign_dir = get_campaign_dir(campaign_id)

    if not campaign_dir.is_dir():
        raise FileNotFoundError(
            f"Campaign directory not found: {campaign_dir}"
        )

    character_image_dir = get_character_image_dir(campaign_id)
    output_file = character_image_dir / "portrait-manifest.json"

    # Create the directory even if the campaign has no portraits.
    character_image_dir.mkdir(parents=True, exist_ok=True)

    # Build the manifest from available WebP portraits.
    portraits = {
        image_file.stem: image_file.name
        for image_file in sorted(character_image_dir.glob("*.webp"))
        if image_file.is_file()
    }

    # An empty portrait collection produces {}.
    manifest_content = json.dumps(portraits, indent=4) + "\n"

    # Avoid rewriting the file if its contents have not changed.
    if output_file.exists():
        current_content = output_file.read_text(encoding="utf-8")

        if current_content == manifest_content:
            print(
                f"Portrait manifest for '{campaign_id}' is up to date "
                f"({len(portraits)} portraits)."
            )
            return

    output_file.write_text(
        manifest_content,
        encoding="utf-8",
        newline="\n",
    )

    print(
        f"Generated portrait manifest for '{campaign_id}' "
        f"with {len(portraits)} portraits: {output_file}"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a campaign's character portrait manifest."
    )
    parser.add_argument(
        "campaign",
        nargs="?",
        default=DEFAULT_CAMPAIGN,
        help="Campaign ID (defaults to breaking-the-axis).",
    )
    args = parser.parse_args()

    generate_manifest(args.campaign)
