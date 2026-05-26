# ---------------------------------------------------------------------------
# Nepsis — local development launcher (no Docker required)
# Requirements: .NET 10 SDK, Node.js 18+, PostgreSQL running on localhost:5432
#
# Default DB: Host=localhost;Port=5432;Database=nepsis;Username=postgres;Password=nepsis_pass
# Override:   $env:NEPSIS_DB = "Host=...;Port=5432;Database=nepsis;Username=...;Password=..."
# ---------------------------------------------------------------------------
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir  = Join-Path $ScriptDir "backend"
$FrontendDir = Join-Path $ScriptDir "frontend-new"

function Info    ($msg) { Write-Host "[nepsis] $msg" -ForegroundColor Cyan   }
function Success ($msg) { Write-Host "[nepsis] $msg" -ForegroundColor Green  }
function Warn    ($msg) { Write-Host "[nepsis] $msg" -ForegroundColor Yellow }
function Err     ($msg) { Write-Host "[nepsis] $msg" -ForegroundColor Red; exit 1 }

# ── Prerequisite checks ────────────────────────────────────────────────────
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Err ".NET SDK not found. Install from https://dot.net"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Err "Node.js not found. Install from https://nodejs.org"
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Err "npm not found. Install Node.js from https://nodejs.org"
}

$dotnetVer = (dotnet --version).Split('.')[0] -as [int]
if ($dotnetVer -lt 10) {
    Warn "Detected .NET $dotnetVer — .NET 10 SDK recommended. Get it at https://dot.net"
}

# ── Override connection string if provided ─────────────────────────────────
if ($env:NEPSIS_DB) {
    $env:ConnectionStrings__DefaultConnection = $env:NEPSIS_DB
    Info "Using custom DB connection string from NEPSIS_DB."
} else {
    Info "Using default DB connection (localhost:5432, database: nepsis, user: postgres, password: nepsis_pass)"
    Info "To override: `$env:NEPSIS_DB = 'Host=...;Port=5432;Database=nepsis;Username=...;Password=...'"
}

$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS        = "http://localhost:8080"

# ── Frontend deps ──────────────────────────────────────────────────────────
Info "Installing frontend dependencies..."
Push-Location $FrontendDir
    npm install --silent
Pop-Location

# ── Launch backend in a new window ────────────────────────────────────────
Info "Starting backend on http://localhost:8080 ..."
$backendArgs = "cd `"$BackendDir`" && dotnet run --project Nepsis.Api --no-launch-profile"
$backendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendArgs -PassThru

# ── Launch frontend in a new window ───────────────────────────────────────
Info "Starting frontend on http://localhost:5173 ..."
$frontendArgs = "cd `"$FrontendDir`" && npm run dev"
$frontendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendArgs -PassThru

Success "Both services launched in separate windows."
Write-Host ""
Write-Host "  Frontend  ->  http://localhost:5173"
Write-Host "  API       ->  http://localhost:8080"
Write-Host "  API Docs  ->  http://localhost:8080/scalar/v1"
Write-Host ""
Write-Host "  Default credentials:  admin@nepsis.com / admin123"
Write-Host ""
Write-Host "Close the backend and frontend windows to stop the services."
Write-Host "Or press Enter here to kill both processes."
$null = Read-Host

$backendProc  | Stop-Process -Force -ErrorAction SilentlyContinue
$frontendProc | Stop-Process -Force -ErrorAction SilentlyContinue
Success "Done."
