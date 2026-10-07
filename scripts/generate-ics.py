import argparse
import hashlib
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
        raise FileNotFoundError(
            f"Campaign file not found: {campaign_file}"
        )

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

    team = team_labels.get(
        str(session.get("team")),
        session.get("team", "Shared")
    )

    description_parts = [team]

    if session.get("chapter") not in (None, ""):
        description_parts.append(
            f"Chapter {session['chapter']}"
        )

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


def calculate_calendar_state(sessions_file, campaign):
    """
    Create a hash representing everything that affects the
    generated calendar.

    If none of these values change, the existing ICS file can
    safely be reused.
    """

    with sessions_file.open("rb") as file:
        sessions_hash = hashlib.sha256(
            file.read()
        ).hexdigest()

    calendar_state = {
        "sessions_hash": sessions_hash,
        "timezone": campaign.get(
            "calendar", {}
        ).get(
            "timezone",
            DEFAULT_TIMEZONE
        ),
        "campaign_name": campaign.get("name", ""),
        "team_labels": get_team_labels(campaign)
    }

    state_json = json.dumps(
        calendar_state,
        sort_keys=True,
        ensure_ascii=False
    )

    return hashlib.sha256(
        state_json.encode("utf-8")
    ).hexdigest()


def load_previous_state(state_file):
    if not state_file.exists():
        return None

    try:
        with state_file.open("r", encoding="utf-8") as file:
            state = json.load(file)

        return state.get("calendar_hash")

    except (json.JSONDecodeError, OSError):
        return None


def save_state(state_file, calendar_hash):
    state = {
        "calendar_hash": calendar_hash
    }

    state_file.write_text(
        json.dumps(state, indent=4) + "\n",
        encoding="utf-8"
    )


def main(campaign_id, force=False):
    campaign_dir, campaign = load_campaign(campaign_id)

    data_dir = campaign_dir / "data"
    sessions_file = data_dir / "sessions.json"
    output_file = data_dir / "sessions.ics"

    # This file is local build state and should be ignored by Git.
    state_file = data_dir / ".sessions.ics.state.json"

    if not sessions_file.exists():
        raise FileNotFoundError(
            f"Sessions file not found: {sessions_file}"
        )

    with sessions_file.open("r", encoding="utf-8") as file:
        sessions = json.load(file)

    calendar_hash = calculate_calendar_state(
        sessions_file,
        campaign
    )

    previous_hash = load_previous_state(state_file)

    # If the calendar already exists and nothing affecting it
    # has changed, don't touch the ICS file.
    if (
        not force
        and output_file.exists()
        and previous_hash == calendar_hash
    ):
        print(f"Calendar is already up to date: {output_file}")
        print("No calendar file was regenerated.")
        return False

    timezone_name = campaign.get(
        "calendar", {}
    ).get(
        "timezone",
        DEFAULT_TIMEZONE
    )

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

    save_state(
        state_file,
        calendar_hash
    )

    print(f"Generated: {output_file}")

    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "campaign",
        nargs="?",
        default=DEFAULT_CAMPAIGN
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate the calendar even if nothing changed."
    )

    args = parser.parse_args()

    main(
        args.campaign,
        force=args.force
    )
