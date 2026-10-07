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

# ARG assets are stored inside the repository.
ARG_ASSET_DIR = PROJECT_ROOT / "arg" / "assets"


def get_campaign_dir(campaign_id):
    return PROJECT_ROOT / "campaigns" / campaign_id


def convert_images(image_dir, label):
    if not image_dir.exists():
        raise FileNotFoundError(
            f"{label} image directory not found: {image_dir}"
        )

    converted = 0
    skipped = 0

    for image_file in sorted(image_dir.iterdir()):
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

    return converted, skipped


def convert_portraits(campaign_id):
    character_image_dir = (
        get_campaign_dir(campaign_id)
        / "assets"
        / "characters"
    )

    print("=" * 60)
    print(f"Converting campaign portraits: {campaign_id}")
    print("=" * 60)

    converted, skipped = convert_images(
        character_image_dir,
        f"Campaign '{campaign_id}' character"
    )

    print()
    print(f"Campaign: {campaign_id}")
    print(f"Converted: {converted}")
    print(f"Already WebP: {skipped}")

    return converted, skipped


def convert_arg_assets():
    print()
    print("=" * 60)
    print("Converting ARG assets")
    print("=" * 60)

    converted, skipped = convert_images(
        ARG_ASSET_DIR,
        "ARG asset"
    )

    print()
    print("ARG assets:")
    print(f"Converted: {converted}")
    print(f"Already WebP: {skipped}")

    return converted, skipped


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "campaign",
        nargs="?",
        default=DEFAULT_CAMPAIGN
    )

    args = parser.parse_args()

    campaign_converted, campaign_skipped = convert_portraits(
        args.campaign
    )

    arg_converted, arg_skipped = convert_arg_assets()

    print()
    print("=" * 60)
    print("ALL CONVERSIONS COMPLETE")
    print("=" * 60)

    print(
        f"Campaign: {campaign_converted} converted, "
        f"{campaign_skipped} already WebP"
    )

    print(
        f"ARG:      {arg_converted} converted, "
        f"{arg_skipped} already WebP"
    )
