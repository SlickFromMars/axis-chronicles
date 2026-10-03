import json
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo


PROJECT_ROOT = Path(__file__).resolve().parent.parent

SESSIONS_FILE = PROJECT_ROOT / "data" / "sessions.json"
OUTPUT_FILE = PROJECT_ROOT / "data" / "sessions.ics"

TIMEZONE = ZoneInfo("America/New_York")


def escape_ics_text(text):
    """
    Escape characters that have special meaning in ICS files.
    """
    return (
        str(text)
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


def format_utc_datetime(dt):
    """
    Convert a datetime to the ICS UTC format.
    """
    return dt.astimezone(timezone.utc).strftime(
        "%Y%m%dT%H%M%SZ"
    )


def generate_event(session):
    """
    Convert one session into an ICS VEVENT.
    """

    start = datetime.strptime(
        f"{session['date']} {session['time']}",
        "%Y-%m-%d %H:%M"
    ).replace(tzinfo=TIMEZONE)

    duration = session.get("duration", 240)

    from datetime import timedelta

    end = start + timedelta(minutes=duration)

    now = datetime.now(timezone.utc)

    summary = session["title"]

    description = (
        f"{format_team(session['team'])} - "
        f"Chapter {session['chapter']}"
    )

    return "\n".join([
        "BEGIN:VEVENT",

        f"UID:{escape_ics_text(session['id'])}@breaking-the-axis",

        f"DTSTAMP:{format_utc_datetime(now)}",

        f"DTSTART:{format_utc_datetime(start)}",

        f"DTEND:{format_utc_datetime(end)}",

        f"SUMMARY:{escape_ics_text(summary)}",

        f"DESCRIPTION:{escape_ics_text(description)}",

        "STATUS:CONFIRMED",

        "END:VEVENT"
    ])


def format_team(team):
    teams = {
        "one": "Team One",
        "two": "Team Two",
        "shared": "Shared"
    }

    return teams.get(team, "Shared")


def main():
    with open(SESSIONS_FILE, "r", encoding="utf-8") as file:
        sessions = json.load(file)

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Breaking the Axis//Campaign Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Breaking the Axis",
        "X-WR-TIMEZONE:America/New_York"
    ]

    for session in sessions:
        lines.append(generate_event(session))

    lines.append("END:VCALENDAR")

    OUTPUT_FILE.write_text(
        "\r\n".join(lines) + "\r\n",
        encoding="utf-8"
    )

    print(f"Generated: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
