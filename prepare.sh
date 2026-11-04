
#!/usr/bin/env bash

set -u

# =========================================================
# AXIS CHRONICLES - PREPARE
# =========================================================

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR" || exit 1

echo
echo "========================================"
echo "  Axis Chronicles - Prepare"
echo "========================================"
echo "  Processing all campaigns"
echo "========================================"
echo

# =========================================================
# ERROR HANDLING
# =========================================================

fail() {
    echo
    echo "ERROR: $1"
    echo "No commit was made."
    echo

    if [[ -t 0 ]]; then
        read -r -p "Press Return to exit..."
    fi

    exit 1
}

# =========================================================
# CHECK PYTHON
# =========================================================

echo "Checking Python..."

if ! command -v python3 >/dev/null 2>&1; then
    fail "Python 3 was not found. Install Python 3 and make sure it is available through PATH."
fi

echo "Python found:"
python3 --version
echo

# =========================================================
# SET UP A LOCAL PYTHON ENVIRONMENT
# =========================================================

# Use a repository-local virtual environment to avoid
# modifying macOS or Homebrew's system Python installation.

VENV_DIR="$ROOT_DIR/.venv"
PYTHON="$VENV_DIR/bin/python"

if [[ ! -x "$PYTHON" ]]; then
    echo "Creating Python virtual environment..."

    python3 -m venv "$VENV_DIR" || \
        fail "Could not create the Python virtual environment."
fi

echo "Installing required Python libraries..."

"$PYTHON" -m pip install -r requirements.txt || \
    fail "Python library installation failed."

echo
echo "Dependencies ready."
echo

# =========================================================
# ENFORCE CHARACTER IMAGE SIZES
# =========================================================

echo "========================================"
echo "  Optimizing character image sizes"
echo "========================================"
echo

"$PYTHON" scripts/enforce-character-sizes.py || \
    fail "Character image size enforcement failed."

echo
echo "Character image sizes optimized."
echo

# =========================================================
# PROCESS CAMPAIGNS
# =========================================================

echo "========================================"
echo "  Processing campaigns"
echo "========================================"
echo

FOUND_CAMPAIGN=0

for CAMPAIGN_DIR in "$ROOT_DIR"/campaigns/*; do
    # Ignore unmatched globs and non-directories.
    [[ -d "$CAMPAIGN_DIR" ]] || continue

    CAMPAIGN="${CAMPAIGN_DIR##*/}"

    # Skip the campaign template.
    [[ "$CAMPAIGN" == "_template" ]] && continue

    # Only process registered campaigns.
    [[ -f "$CAMPAIGN_DIR/campaign.json" ]] || continue

    FOUND_CAMPAIGN=1

    echo
    echo "----------------------------------------"
    echo "  Campaign: $CAMPAIGN"
    echo "----------------------------------------"
    echo

    # =============================================
    # GENERATE CALENDAR
    # =============================================

    echo "Generating calendar..."

    "$PYTHON" scripts/generate-ics.py "$CAMPAIGN" || \
        fail "Calendar generation failed for $CAMPAIGN."

    echo "Calendar generated."
    echo

    # =============================================
    # UPDATE LEGACY BTA CALENDAR
    # =============================================

    if [[ "${CAMPAIGN,,}" == "breaking-the-axis" ]]; then
        echo "Updating legacy Breaking the Axis calendar..."

        mkdir -p "$ROOT_DIR/data" || \
            fail "Could not create the legacy data directory."

        cp \
            "$CAMPAIGN_DIR/data/sessions.ics" \
            "$ROOT_DIR/data/sessions.ics" || \
            fail "Could not update the legacy calendar."

        echo "Legacy calendar updated."
        echo
    fi

    # =============================================
    # CONVERT CHARACTER PORTRAITS
    # =============================================

    echo "Converting character portraits to WebP..."

    "$PYTHON" scripts/convert-character-portraits.py "$CAMPAIGN" || \
        fail "Character portrait conversion failed for $CAMPAIGN."

    echo "Portrait conversion complete."
    echo

    # =============================================
    # GENERATE PORTRAIT MANIFEST
    # =============================================

    echo "Generating character portrait manifest..."

    "$PYTHON" scripts/generate-portrait-manifest.py "$CAMPAIGN" || \
        fail "Portrait manifest generation failed for $CAMPAIGN."

    echo "Portrait manifest generated."
    echo
done

# =========================================================
# CHECK THAT AT LEAST ONE CAMPAIGN WAS FOUND
# =========================================================

if [[ "$FOUND_CAMPAIGN" -eq 0 ]]; then
    echo
    echo "ERROR: No campaign folders were found."
    echo
    echo "Expected:"
    echo "  campaigns/campaign-name/campaign.json"
    echo

    if [[ -t 0 ]]; then
        read -r -p "Press Return to exit..."
    fi

    exit 1
fi

# =========================================================
# VALIDATE CAMPAIGN JSON
# =========================================================

echo
echo "========================================"
echo "  Validating campaign JSON"
echo "========================================"
echo

"$PYTHON" scripts/validate-json.py || \
    fail "JSON validation failed."

echo "JSON validation complete."
echo

# =========================================================
# SHOW GIT STATUS
# =========================================================

echo "========================================"
echo "  Preparation complete!"
echo "========================================"
echo

echo "All campaigns have been processed."
echo

echo "Git status:"
echo "----------------------------------------"

git status || fail "Could not read Git status."

echo "----------------------------------------"
echo
echo "Review your changes before committing."
echo
echo "No commit was made."
echo

if [[ -t 0 ]]; then
    read -r -p "Press Return to exit..."
fi
