import json
from html import escape
from pathlib import Path
from urllib.parse import urlencode


ROOT = Path(__file__).resolve().parent.parent
CAMPAIGNS = ROOT / "campaigns"
OUTPUT = ROOT / "share"

BASE_URL = "https://slickfrommars.github.io/axis-chronicles"


def generate_share_page(campaign_dir):
    config_path = campaign_dir / "campaign.json"

    with config_path.open(encoding="utf-8") as file:
        campaign = json.load(file)

    campaign_id = campaign["id"]
    name = campaign.get("name", "Campaign Journal")
    short_name = campaign.get("shortName", name)
    social = campaign.get("social", {})

    title = social.get("title", f"{name} | {short_name}")
    description = social.get(
        "description",
        f"The campaign journal for {name}."
    )
    image_alt = social.get("imageAlt", name)

    image_path = campaign.get("assets", {}).get(
        "socialPreview",
        ""
    )

    image_url = (
        f"{BASE_URL}/campaigns/{campaign_id}/{image_path}"
        if image_path
        else ""
    )

    share_url = f"{BASE_URL}/share/{campaign_id}/"

    destination = f"{BASE_URL}/?{urlencode({'campaign': campaign_id})}"


    metadata = f"""
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{escape(short_name, quote=True)}">
    <meta property="og:title" content="{escape(title, quote=True)}">
    <meta property="og:description" content="{escape(description, quote=True)}">
    <meta property="og:url" content="{escape(share_url, quote=True)}">
    <meta name="description" content="{escape(description, quote=True)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{escape(title, quote=True)}">
    <meta name="twitter:description" content="{escape(description, quote=True)}">
    """

    if image_url:
        metadata += f"""
    <meta property="og:image" content="{escape(image_url, quote=True)}">
    <meta property="og:image:alt" content="{escape(image_alt, quote=True)}">
    <meta name="twitter:image" content="{escape(image_url, quote=True)}">
    """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{escape(title)}</title>
{metadata}
    <meta http-equiv="refresh" content="0;url={escape(destination, quote=True)}">
</head>
<body>
    <p>Opening {escape(name)}...</p>
    <p><a href="{escape(destination, quote=True)}">Continue to the campaign</a></p>


    <script>
        const params = new URLSearchParams(window.location.search);
        const requestedPage = params.get("page");

        const allowedPages = new Set([
            "quests",
            "characters",
            "map",
            "calendar",
            "music",
            "archives"
        ]);

        const destination = new URL(
            {json.dumps(destination)},
            window.location.origin
        );

        if (allowedPages.has(requestedPage)) {{
            destination.hash = requestedPage;
        }}

        window.location.replace(destination.href);
    </script>
</body>
</html>
"""

    output_dir = OUTPUT / campaign_id
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "index.html").write_text(
        html,
        encoding="utf-8"
    )

    print(f"Generated share page: {campaign_id}")


def main():
    for campaign_dir in sorted(CAMPAIGNS.iterdir()):
        if campaign_dir.name.startswith("_"):
            continue

        if campaign_dir.is_dir() and (
            campaign_dir / "campaign.json"
        ).exists():
            generate_share_page(campaign_dir)


if __name__ == "__main__":
    main()
