import argparse
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CAMPAIGN = "breaking-the-axis"
DEFAULT_TIMEZONE = "America/New_York"


def escape_ics_text(text):
    return (
        str(text)
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


def format_utc_datetime(dt):
    return dt.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def load_campaign(campaign_id):
    campaign_dir = PROJECT_ROOT / "campaigns" / campaign_id
    campaign_file = campaign_dir / "campaign.json"

    if not campaign_file.exists():
        raise FileNotFoundError(f"Campaign file not found: {campaign_file}")

    with campaign_file.open("r", encoding="utf-8") as file:
        campaign = json.load(file)

    return campaign_dir, campaign


def get_team_labels(campaign):
    return {
        str(team["id"]): team.get("label", team["id"])
        for team in campaign.get("party", {}).get("teams", [])
        if "id" in team
    }


def generate_event(session, campaign_id, team_labels, tz):
    start = datetime.strptime(
        f"{session['date']} {session['time']}",
        "%Y-%m-%d %H:%M"
    ).replace(tzinfo=tz)

    duration = session.get("duration", 240)
    end = start + timedelta(minutes=duration)
    now = datetime.now(timezone.utc)

    summary = session["title"]
    team = team_labels.get(str(session.get("team")), session.get("team", "Shared"))

    description_parts = [team]
    if session.get("chapter") not in (None, ""):
        description_parts.append(f"Chapter {session['chapter']}")

    description = " - ".join(description_parts)

    return "\n".join([
        "BEGIN:VEVENT",
        f"UID:{escape_ics_text(session['id'])}@{escape_ics_text(campaign_id)}",
        f"DTSTAMP:{format_utc_datetime(now)}",
        f"DTSTART:{format_utc_datetime(start)}",
        f"DTEND:{format_utc_datetime(end)}",
        f"SUMMARY:{escape_ics_text(summary)}",
        f"DESCRIPTION:{escape_ics_text(description)}",
        "STATUS:CONFIRMED",
        "END:VEVENT"
    ])


def main(campaign_id):
    campaign_dir, campaign = load_campaign(campaign_id)
    data_dir = campaign_dir / "data"
    sessions_file = data_dir / "sessions.json"
    output_file = data_dir / "sessions.ics"

    with sessions_file.open("r", encoding="utf-8") as file:
        sessions = json.load(file)

    timezone_name = campaign.get("calendar", {}).get("timezone", DEFAULT_TIMEZONE)
    tz = ZoneInfo(timezone_name)
    team_labels = get_team_labels(campaign)
    campaign_name = campaign.get("name", campaign_id)

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        f"PRODID:-//{escape_ics_text(campaign_name)}//Campaign Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{escape_ics_text(campaign_name)}",
        f"X-WR-TIMEZONE:{escape_ics_text(timezone_name)}"
    ]

    for session in sessions:
        lines.append(
            generate_event(
                session,
                campaign_id,
                team_labels,
                tz
            )
        )

    lines.append("END:VCALENDAR")

    output_file.write_text(
        "\r\n".join(lines) + "\r\n",
        encoding="utf-8"
    )

    print(f"Generated: {output_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("campaign", nargs="?", default=DEFAULT_CAMPAIGN)
    args = parser.parse_args()
    main(args.campaign)
