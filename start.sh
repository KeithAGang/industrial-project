#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Nepsis — local development launcher (no Docker required)
# Requirements: .NET 10 SDK, Node.js 18+, PostgreSQL running on localhost:5432
#
# Default DB: Host=localhost;Port=5432;Database=nepsis;Username=postgres;Password=nepsis_pass
# Override:   export NEPSIS_DB="Host=...;Port=5432;Database=nepsis;Username=...;Password=..."
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend-new"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${CYAN}[nepsis]${NC} $*"; }
success() { echo -e "${GREEN}[nepsis]${NC} $*"; }
warn()    { echo -e "${YELLOW}[nepsis]${NC} $*"; }
error()   { echo -e "${RED}[nepsis]${NC} $*" >&2; exit 1; }

# ── Prerequisite checks ────────────────────────────────────────────────────
command -v dotnet >/dev/null 2>&1 || error ".NET SDK not found. Install from https://dot.net"
command -v node   >/dev/null 2>&1 || error "Node.js not found. Install from https://nodejs.org"
command -v npm    >/dev/null 2>&1 || error "npm not found. Install Node.js from https://nodejs.org"

DOTNET_VERSION=$(dotnet --version 2>/dev/null | cut -d. -f1)
if [[ "$DOTNET_VERSION" -lt 10 ]]; then
    warn "Detected .NET $DOTNET_VERSION — .NET 10 SDK recommended. Get it at https://dot.net"
fi

# ── Override connection string if provided ─────────────────────────────────
if [[ -n "${NEPSIS_DB:-}" ]]; then
    export ConnectionStrings__DefaultConnection="$NEPSIS_DB"
    info "Using custom DB connection string from NEPSIS_DB."
else
    info "Using default DB connection (localhost:5432, database: nepsis, user: postgres, password: nepsis_pass)"
    info "To override: export NEPSIS_DB=\"Host=...;Port=5432;Database=nepsis;Username=...;Password=...\""
fi

export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS=http://localhost:8080

# ── Frontend deps ──────────────────────────────────────────────────────────
info "Installing frontend dependencies..."
(cd "$FRONTEND_DIR" && npm install --silent)

# ── Launch backend ─────────────────────────────────────────────────────────
info "Starting backend on http://localhost:8080 ..."
(cd "$BACKEND_DIR" && dotnet run --project Nepsis.Api --no-launch-profile) &
BACKEND_PID=$!

# ── Launch frontend ────────────────────────────────────────────────────────
info "Starting frontend on http://localhost:5173 ..."
(cd "$FRONTEND_DIR" && npm run dev) &
FRONTEND_PID=$!

success "Both services started."
echo ""
echo "  Frontend  →  http://localhost:5173"
echo "  API       →  http://localhost:8080"
echo "  API Docs  →  http://localhost:8080/scalar/v1"
echo ""
echo "  Default credentials:  admin@nepsis.com / admin123"
echo ""
echo "Press Ctrl+C to stop both services."

# ── Graceful shutdown ──────────────────────────────────────────────────────
trap 'echo ""; info "Shutting down..."; kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null; wait; success "Done."' INT TERM
wait
