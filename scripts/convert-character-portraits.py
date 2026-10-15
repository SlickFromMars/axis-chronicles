from pathlib import Path
import argparse

from PIL import Image


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

SOURCE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
}

WEBP_QUALITY = 90
DEFAULT_CAMPAIGN = "breaking-the-axis"

# ARG assets are stored inside the repository.
ARG_ASSET_DIR = PROJECT_ROOT / "arg" / "assets"


def get_campaign_dir(campaign_id):
    return PROJECT_ROOT / "campaigns" / campaign_id


def convert_images(image_dir, label):
    # Create missing directories so campaigns without images are valid.
    image_dir.mkdir(parents=True, exist_ok=True)

    converted = 0
    skipped = 0

    image_files = sorted(image_dir.iterdir())

    for image_file in image_files:
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
                    method=6,
                )

            # Remove the source only after successful conversion.
            image_file.unlink()
            converted += 1

        except Exception as error:
            if output_file.exists():
                output_file.unlink()

            raise RuntimeError(
                f"Failed to convert {image_file.name}: {error}"
            ) from error

    if converted == 0 and skipped == 0:
        print(f"No images to convert in {label} directory.")

    return converted, skipped


def convert_portraits(campaign_id):
    campaign_dir = get_campaign_dir(campaign_id)

    if not campaign_dir.is_dir():
        raise FileNotFoundError(
            f"Campaign directory not found: {campaign_dir}"
        )

    character_image_dir = (
        campaign_dir
        / "assets"
        / "characters"
    )

    print("=" * 60)
    print(f"Converting campaign portraits: {campaign_id}")
    print("=" * 60)

    converted, skipped = convert_images(
        character_image_dir,
        f"Campaign '{campaign_id}' character",
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

    if not ARG_ASSET_DIR.is_dir():
        raise FileNotFoundError(
            f"ARG asset directory not found: {ARG_ASSET_DIR}"
        )

    converted, skipped = convert_images(
        ARG_ASSET_DIR,
        "ARG asset",
    )

    print()
    print("ARG assets:")
    print(f"Converted: {converted}")
    print(f"Already WebP: {skipped}")

    return converted, skipped


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert campaign portraits and ARG assets to WebP."
    )

    parser.add_argument(
        "campaign",
        nargs="?",
        default=DEFAULT_CAMPAIGN,
        help="Campaign ID (defaults to breaking-the-axis).",
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
