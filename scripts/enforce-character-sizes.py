from pathlib import Path
from PIL import Image


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

CAMPAIGNS_DIR = PROJECT_ROOT / "campaigns"

# Maximum width or height for any character image.
MAX_IMAGE_DIMENSION = 1024

IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}


def resize_image(image_file):
    """
    Resize an image if either dimension exceeds
    MAX_IMAGE_DIMENSION.

    Aspect ratio is preserved.
    """
    with Image.open(image_file) as image:
        width, height = image.size

        if (
            width <= MAX_IMAGE_DIMENSION
            and height <= MAX_IMAGE_DIMENSION
        ):
            return False, (width, height), (width, height)

        scale = MAX_IMAGE_DIMENSION / max(width, height)

        new_width = round(width * scale)
        new_height = round(height * scale)

        resized = image.resize(
            (new_width, new_height),
            Image.Resampling.LANCZOS
        )

        # Preserve the existing format.
        if image.format == "WEBP":
            resized.save(
                image_file,
                "WEBP",
                quality=85,
                method=6
            )

        elif image.format == "PNG":
            resized.save(
                image_file,
                "PNG",
                optimize=True
            )

        elif image.format in ("JPEG", "JPG"):
            if resized.mode != "RGB":
                resized = resized.convert("RGB")

            resized.save(
                image_file,
                "JPEG",
                quality=90,
                optimize=True
            )

        else:
            resized.save(image_file)

        return True, (width, height), (new_width, new_height)


def process_campaign(campaign_dir):
    character_dir = (
        campaign_dir
        / "assets"
        / "characters"
    )

    if not character_dir.exists():
        return 0, 0

    resized_count = 0
    skipped_count = 0

    print()
    print(f"Campaign: {campaign_dir.name}")
    print(f"Directory: {character_dir}")

    for image_file in sorted(character_dir.iterdir()):
        if not image_file.is_file():
            continue

        if image_file.suffix.lower() not in IMAGE_EXTENSIONS:
            continue

        try:
            resized, old_size, new_size = resize_image(
                image_file
            )

            if resized:
                print(
                    f"  RESIZED  {image_file.name}: "
                    f"{old_size[0]}x{old_size[1]} "
                    f"-> "
                    f"{new_size[0]}x{new_size[1]}"
                )
                resized_count += 1

            else:
                print(
                    f"  OK       {image_file.name}: "
                    f"{old_size[0]}x{old_size[1]}"
                )
                skipped_count += 1

        except Exception as error:
            print(
                f"  ERROR    {image_file.name}: {error}"
            )

    return resized_count, skipped_count


def main():
    print("=" * 60)
    print("CHARACTER IMAGE SIZE ENFORCEMENT")
    print("=" * 60)

    print()
    print(
        f"Maximum dimension: "
        f"{MAX_IMAGE_DIMENSION}px"
    )

    total_resized = 0
    total_skipped = 0
    campaigns_processed = 0

    if not CAMPAIGNS_DIR.exists():
        raise FileNotFoundError(
            f"Campaign directory not found: {CAMPAIGNS_DIR}"
        )

    for campaign_dir in sorted(CAMPAIGNS_DIR.iterdir()):
        if not campaign_dir.is_dir():
            continue

        character_dir = (
            campaign_dir
            / "assets"
            / "characters"
        )

        if not character_dir.exists():
            continue

        campaigns_processed += 1

        resized, skipped = process_campaign(
            campaign_dir
        )

        total_resized += resized
        total_skipped += skipped

    print()
    print("=" * 60)
    print("COMPLETE")
    print("=" * 60)

    print(f"Campaigns processed: {campaigns_processed}")
    print(f"Images resized:      {total_resized}")
    print(f"Images already OK:   {total_skipped}")
    print(
        f"Maximum dimension:   "
        f"{MAX_IMAGE_DIMENSION}px"
    )


if __name__ == "__main__":
    main()
