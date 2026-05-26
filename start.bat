@echo off
:: ---------------------------------------------------------------------------
:: Nepsis — local development launcher (no Docker required)
:: Requirements: .NET 10 SDK, Node.js 18+, PostgreSQL on localhost:5432
::
:: Default DB: Host=localhost;Port=5432;Database=nepsis;Username=postgres;Password=nepsis_pass
:: Override:   set NEPSIS_DB=Host=...;Port=5432;Database=nepsis;Username=...;Password=...
:: ---------------------------------------------------------------------------

setlocal EnableDelayedExpansion

set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%backend
set FRONTEND_DIR=%SCRIPT_DIR%frontend-new

:: ── Prerequisite checks ────────────────────────────────────────────────────
where dotnet >nul 2>&1
if errorlevel 1 (
    echo [nepsis] ERROR: .NET SDK not found. Install from https://dot.net
    pause & exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [nepsis] ERROR: Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [nepsis] ERROR: npm not found. Install Node.js from https://nodejs.org
    pause & exit /b 1
)

:: ── Override connection string if provided ─────────────────────────────────
if defined NEPSIS_DB (
    set ConnectionStrings__DefaultConnection=%NEPSIS_DB%
    echo [nepsis] Using custom DB connection string from NEPSIS_DB.
) else (
    echo [nepsis] Using default DB connection (localhost:5432 / nepsis / postgres)
    echo [nepsis] To override: set NEPSIS_DB=Host=...;Port=5432;Database=nepsis;Username=...;Password=...
)

set ASPNETCORE_ENVIRONMENT=Development
set ASPNETCORE_URLS=http://localhost:8080

:: ── Frontend deps ──────────────────────────────────────────────────────────
echo [nepsis] Installing frontend dependencies...
pushd "%FRONTEND_DIR%"
call npm install --silent
popd

:: ── Launch backend in new window ───────────────────────────────────────────
echo [nepsis] Starting backend on http://localhost:8080 ...
start "Nepsis Backend" cmd /k "cd /d "%BACKEND_DIR%" && dotnet run --project Nepsis.Api --no-launch-profile"

:: ── Launch frontend in new window ──────────────────────────────────────────
echo [nepsis] Starting frontend on http://localhost:5173 ...
start "Nepsis Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo [nepsis] Both services launched in separate windows.
echo.
echo   Frontend  -^>  http://localhost:5173
echo   API       -^>  http://localhost:8080
echo   API Docs  -^>  http://localhost:8080/scalar/v1
echo.
echo   Default credentials:  admin@nepsis.com / admin123
echo.
echo Close the backend and frontend windows to stop the services.
pause
