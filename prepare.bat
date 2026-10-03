@echo off

echo.
echo ========================================
echo   Breaking the Axis - Prepare
echo ========================================
echo.

echo Installing required Python libraries...
python -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Python library installation failed.
    echo No commit was made.
    pause
    exit /b 1
)

echo.
echo Generating calendar...
python scripts\generate-ics.py

if errorlevel 1 (
    echo.
    echo ERROR: Calendar generation failed.
    echo No commit was made.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Preparation complete!
echo ========================================
echo.
echo Generated files have been updated.
echo.
echo Review your changes with:
echo     git status
echo.
echo No commit was made.
echo.

pause
