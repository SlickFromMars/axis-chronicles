@echo off

setlocal EnableDelayedExpansion

echo.
echo ========================================
echo   Axis Chronicles - Prepare
echo ========================================
echo   Processing all campaigns
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
REM ENFORCE CHARACTER IMAGE SIZES
REM ========================================================

echo ========================================
echo   Optimizing character image sizes
echo ========================================
echo.

echo Enforcing maximum character image dimension...

python scripts\enforce-character-sizes.py

if errorlevel 1 (
    echo.
    echo ERROR: Character image size enforcement failed.
    echo No commit was made.
    echo.
    pause
    exit /b 1
)

echo.
echo Character image sizes optimized.
echo.


REM ========================================================
REM PROCESS CAMPAIGNS
REM ========================================================

echo ========================================
echo   Processing campaigns
echo ========================================
echo.


set "FOUND_CAMPAIGN=0"

for /D %%D in ("campaigns\*") do (

    if exist "%%D\campaign.json" (

        set "FOUND_CAMPAIGN=1"
        set "CAMPAIGN=%%~nxD"

        echo.
        echo ----------------------------------------
        echo   Campaign: !CAMPAIGN!
        echo ----------------------------------------
        echo.


        REM ====================================================
        REM GENERATE CALENDAR
        REM ====================================================

        echo Generating calendar...

        python scripts\generate-ics.py "!CAMPAIGN!"

        if errorlevel 1 (
            echo.
            echo ERROR: Calendar generation failed for !CAMPAIGN!.
            echo No commit was made.
            echo.
            pause
            exit /b 1
        )

        echo Calendar generated.
        echo.


        REM ====================================================
        REM UPDATE LEGACY BTA CALENDAR
        REM ====================================================

        if /I "!CAMPAIGN!"=="breaking-the-axis" (

            echo Updating legacy Breaking the Axis calendar...

            if not exist "data" (
                mkdir "data"
            )

            copy /Y ^
                "campaigns\breaking-the-axis\data\sessions.ics" ^
                "data\sessions.ics" >nul

            if errorlevel 1 (
                echo.
                echo ERROR: Could not update the legacy calendar.
                echo No commit was made.
                echo.
                pause
                exit /b 1
            )

            echo Legacy calendar updated.
            echo.
        )


        REM ====================================================
        REM CONVERT CHARACTER PORTRAITS
        REM ====================================================

        echo Converting character portraits to WebP...

        python scripts\convert-character-portraits.py "!CAMPAIGN!"

        if errorlevel 1 (
            echo.
            echo ERROR: Character portrait conversion failed for !CAMPAIGN!.
            echo No commit was made.
            echo.
            pause
            exit /b 1
        )

        echo Portrait conversion complete.
        echo.


        REM ====================================================
        REM GENERATE PORTRAIT MANIFEST
        REM ====================================================

        echo Generating character portrait manifest...

        python scripts\generate-portrait-manifest.py "!CAMPAIGN!"

        if errorlevel 1 (
            echo.
            echo ERROR: Portrait manifest generation failed for !CAMPAIGN!.
            echo No commit was made.
            echo.
            pause
            exit /b 1
        )

        echo Portrait manifest generated.
        echo.

    )
)


REM ========================================================
REM CHECK THAT AT LEAST ONE CAMPAIGN WAS FOUND
REM ========================================================

if "!FOUND_CAMPAIGN!"=="0" (
    echo.
    echo ERROR: No campaign folders were found.
    echo.
    echo Expected:
    echo   campaigns\campaign-name\campaign.json
    echo.
    pause
    exit /b 1
)


REM ========================================================
REM VALIDATE CAMPAIGN JSON
REM ========================================================

echo.
echo ========================================
echo   Validating campaign JSON
echo ========================================
echo.

python scripts\validate-json.py

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

echo All campaigns have been processed.
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
