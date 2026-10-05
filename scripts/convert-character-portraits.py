from pathlib import Path
from PIL import Image


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

SOURCE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg"
}

WEBP_QUALITY = 90


# =========================================================
# CONVERT PORTRAITS
# =========================================================

def convert_portraits():

    if not CHARACTER_IMAGE_DIR.exists():
        raise FileNotFoundError(
            f"Character image directory not found: "
            f"{CHARACTER_IMAGE_DIR}"
        )

    converted = 0
    skipped = 0

    for image_file in sorted(
        CHARACTER_IMAGE_DIR.iterdir()
    ):

        if not image_file.is_file():
            continue

        if image_file.suffix.lower() not in SOURCE_EXTENSIONS:
            continue

        output_file = (
            image_file.with_suffix(".webp")
        )

        # Do not overwrite an existing WebP.
        if output_file.exists():
            print(
                f"Skipping {image_file.name} "
                f"(WebP already exists)"
            )

            skipped += 1
            continue

        print(
            f"Converting {image_file.name} "
            f"-> {output_file.name}"
        )

        try:

            with Image.open(image_file) as image:

                # Preserve transparency when present.
                if image.mode in (
                    "RGBA",
                    "LA"
                ):
                    converted_image = image
                else:
                    converted_image = image.convert(
                        "RGB"
                    )

                converted_image.save(
                    output_file,
                    "WEBP",
                    quality=WEBP_QUALITY,
                    method=6
                )

            # Only delete the original after
            # successful conversion.
            image_file.unlink()

            converted += 1

        except Exception as error:

            # Remove a potentially incomplete output.
            if output_file.exists():
                output_file.unlink()

            raise RuntimeError(
                f"Failed to convert "
                f"{image_file.name}: {error}"
            )

    print()
    print(
        f"Portrait conversion complete."
    )
    print(
        f"Converted: {converted}"
    )
    print(
        f"Already WebP: {skipped}"
    )


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":
    convert_portraits()
