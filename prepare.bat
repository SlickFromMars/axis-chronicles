@echo off
setlocal

echo.
echo ========================================
echo   Breaking the Axis - Prepare
echo ========================================
echo.

REM ========================================================
REM CHECK PYTHON
REM ========================================================

echo Checking Python...

python --version >nul 2>&1

if errorlevel 1 (
    echo.
    echo ERROR: Python was not found.
    echo Make sure Python is installed and available
    echo through the system PATH.
    echo.
    pause
    exit /b 1
)

echo Python found.
echo.


REM ========================================================
REM INSTALL PYTHON DEPENDENCIES
REM ========================================================

echo Installing required Python libraries...

python -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Python library installation failed.
    echo No commit was made.
    echo.
    pause
    exit /b 1
)

echo.
echo Dependencies ready.
echo.


REM ========================================================
REM GENERATE CALENDAR
REM ========================================================

echo Generating calendar...

python scripts\generate-ics.py

if errorlevel 1 (
    echo.
    echo ERROR: Calendar generation failed.
    echo No commit was made.
    echo.
    pause
    exit /b 1
)

echo Calendar generated.
echo.


REM ========================================================
REM GENERATE CHARACTER PORTRAIT MANIFEST
REM ========================================================

echo Generating character portrait manifest...

python scripts\generate-portrait-manifest.py

if errorlevel 1 (
    echo.
    echo ERROR: Character portrait manifest generation failed.
    echo No commit was made.
    echo.
    pause
    exit /b 1
)

echo Portrait manifest generated.
echo.


REM ========================================================
REM VALIDATE JSON FILES
REM ========================================================

echo Validating generated JSON files...

python -c "import json; from pathlib import Path; files=list(Path('data').glob('*.json')) + [Path('assets/images/characters/portrait-manifest.json')]; failed=False; [print('ERROR:', f) or (globals().__setitem__('failed', True)) if (lambda p: (json.load(open(p, encoding='utf-8')), True)[1] if True else False)(f) is None else None for f in []]"

if errorlevel 1 (
    echo.
    echo ERROR: JSON validation failed.
    echo No commit was made.
    echo.
    pause
    exit /b 1
)

echo JSON validation complete.
echo.


REM ========================================================
REM SHOW GIT STATUS
REM ========================================================

echo ========================================
echo   Preparation complete!
echo ========================================
echo.

echo Generated files have been updated.
echo.

echo Git status:
echo ----------------------------------------
git status
echo ----------------------------------------
echo.

echo Review your changes before committing.
echo.

echo No commit was made.
echo.

pause

endlocal
