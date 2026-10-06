from pathlib import Path
import argparse
from PIL import Image


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

SOURCE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg"
}

WEBP_QUALITY = 90
DEFAULT_CAMPAIGN = "breaking-the-axis"


def get_campaign_dir(campaign_id):
    return PROJECT_ROOT / "campaigns" / campaign_id


def convert_portraits(campaign_id):
    character_image_dir = (
        get_campaign_dir(campaign_id)
        / "assets"
        / "characters"
    )

    if not character_image_dir.exists():
        raise FileNotFoundError(
            f"Character image directory not found: {character_image_dir}"
        )

    converted = 0
    skipped = 0

    for image_file in sorted(character_image_dir.iterdir()):
        if not image_file.is_file():
            continue

        if image_file.suffix.lower() not in SOURCE_EXTENSIONS:
            continue

        output_file = image_file.with_suffix(".webp")

        if output_file.exists():
            print(f"Skipping {image_file.name} (WebP already exists)")
            skipped += 1
            continue

        print(f"Converting {image_file.name} -> {output_file.name}")

        try:
            with Image.open(image_file) as image:
                if image.mode in ("RGBA", "LA"):
                    converted_image = image
                else:
                    converted_image = image.convert("RGB")

                converted_image.save(
                    output_file,
                    "WEBP",
                    quality=WEBP_QUALITY,
                    method=6
                )

            image_file.unlink()
            converted += 1

        except Exception as error:
            if output_file.exists():
                output_file.unlink()
            raise RuntimeError(
                f"Failed to convert {image_file.name}: {error}"
            )

    print()
    print(f"Campaign: {campaign_id}")
    print("Portrait conversion complete.")
    print(f"Converted: {converted}")
    print(f"Already WebP: {skipped}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("campaign", nargs="?", default=DEFAULT_CAMPAIGN)
    args = parser.parse_args()
    convert_portraits(args.campaign)
