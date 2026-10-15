
@echo off
setlocal EnableExtensions

title Axis Chronicles - Calendar Git Fix

echo.
echo ==========================================
echo   Axis Chronicles - Calendar Git Fix
echo ==========================================
echo.

REM Locate the repository root from this script's location.
for /f "delims=" %%R in ('git -C "%~dp0.." rev-parse --show-toplevel 2^>nul') do set "REPO_ROOT=%%R"

if not defined REPO_ROOT (
    echo ERROR: Could not locate the Git repository.
    echo Make sure this script is inside the scripts folder.
    pause
    exit /b 1
)

cd /d "%REPO_ROOT%"

REM Locate Git's local-only attributes file.
for /f "delims=" %%A in ('git rev-parse --git-path info/attributes') do set "ATTR_FILE=%%A"

if not defined ATTR_FILE (
    echo ERROR: Could not locate Git's local attributes file.
    pause
    exit /b 1
)

REM Enumerate every tracked .ics file.
set "COUNT=0"
echo Searching for tracked ICS files...
echo.

for /f "delims=" %%F in ('git ls-files -- "*.ics"') do (
    set /a COUNT+=1
    call echo   %%F
)

if "%COUNT%"=="0" (
    echo No tracked .ics files found.
    pause
    exit /b 0
)

echo.
echo Found %COUNT% tracked .ics file(s).
echo.
echo WARNING:
echo This will discard uncommitted changes to ALL tracked .ics files.
echo Other file types and existing stashes will not be restored.
echo.

choice /C YN /N /M "Continue with calendar repair? [Y/N] "
if errorlevel 2 (
    echo.
    echo Cancelled. No changes made.
    pause
    exit /b 0
)

REM Add the local-only override if not already present.
if not exist "%ATTR_FILE%" (
    >"%ATTR_FILE%" echo *.ics -text
) else (
    findstr /X /C:"*.ics -text" "%ATTR_FILE%" >nul 2>&1
    if errorlevel 1 >>"%ATTR_FILE%" echo *.ics -text
)

REM Restore each tracked calendar file individually.
for /f "delims=" %%F in ('git ls-files -- "*.ics"') do (
    echo Repairing: %%F
    git restore --source=HEAD --staged --worktree -- "%%F"
    if errorlevel 1 (
        echo.
        echo ERROR restoring %%F
        echo Stop and inspect Git status before continuing.
        pause
        exit /b 1
    )
)

echo.
echo ==========================================
echo   Calendar repair completed.
echo ==========================================
echo.
echo Final repository status:
git status --short
echo.
echo If any .ics files remain modified, inspect them before
echo retrying your stash operation.
echo.
echo Existing stashes have not been deleted.
echo.
pause
