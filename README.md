# LifecycleIQ

**Client Solution Lifecycle Management System**  
Weighted Factor Analysis · AI Briefings · Real-time Risk Monitoring

---

## Quick Start

```bash
git clone <your-repo>
cd lifecycleiq

# One-command deploy (demo Gemini key is bundled — works immediately)
docker compose up -d
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000         |
| API      | http://localhost:8080         |
| API Docs | http://localhost:8080/scalar  |

**Default credentials** (change immediately in production):

| Role    | Email                      | Password    |
|---------|----------------------------|-------------|
| Admin   | admin@lifecycleiq.com      | admin123    |
| Manager | manager@lifecycleiq.com    | manager123  |

---

## What Is This?

LifecycleIQ tracks the lifecycle health of enterprise client software solutions. For every managed solution it computes a **Solution Health Index (SHI)** — a risk score from 0 to 1 — using the Weighted Factor Analysis algorithm:

```
SHI = Σ(Wᵢ × Fᵢ) / ΣWᵢ
```

**Factors:**
- **Licence Urgency** (weight 0.40) — how soon the licence expires
- **Version Gap** (weight 0.25) — how far behind the current version is
- **SLA Compliance** (weight 0.25) — current SLA status
- **Maintenance Recency** (weight 0.10) — time since last maintenance

After computing the SHI, an **AI Briefing** is generated via the Gemini API — a 3-sentence plain-English explanation of the risk and recommended action.

---

## Features

- **Dashboard** — real-time stats, risk distribution chart, top-risk solutions table
- **Solution Management** — full CRUD with lifecycle metadata tracking
- **SHI Computation** — on-demand or per-solution, with AI-generated briefings
- **SHI History** — trend charts showing health over time
- **Risk Notifications** — auto-created for Critical/High SHI events
- **Change Requests** — managed workflow with approval/rejection
- **Client Management** — client registry linked to solutions
- **Role-Based Access** — Admin (full) and Manager (read + change requests)
- **Dark Mode** — paper/ink light mode, dark bluish-slate dark mode

---

## Tech Stack

| Layer    | Technology                                           |
|----------|------------------------------------------------------|
| Frontend | React 18, TypeScript, Vite, TanStack Router, Tailwind v4, shadcn/ui, Recharts |
| Backend  | ASP.NET Core 10, EF Core 8, Npgsql, Scalar UI       |
| Database | PostgreSQL 16                                        |
| AI       | Gemini API — gemini-2.0-flash (free)                     |
| Auth     | JWT Bearer (8h expiry)                               |
| Deploy   | Docker Compose                                       |

---

## Project Structure

```
lifecycleiq/
├── docker-compose.yml        # One-click deployment
├── ARCHITECTURE.md           # Full system design doc
├── frontend/                 # React app
│   ├── Dockerfile
│   ├── src/
│   │   ├── routes/           # TanStack Router pages
│   │   ├── components/       # UI components
│   │   ├── lib/              # API client, utils, schemas
│   │   └── hooks/            # Auth, dark mode, notifications
├── backend/                  # ASP.NET Core 10 API
│   ├── Dockerfile
│   └── LifecycleIQ.Api/
│       ├── Controllers/      # REST endpoints
│       ├── Services/         # WFA, AI, JWT, notifications
│       ├── Models/           # EF Core entities
│       └── Data/             # AppDbContext
└── database/
    ├── migrations/           # Reference SQL schema
    └── seeds/                # Default users, clients, solutions
```

---

## Development Setup

### Backend

```bash
cd backend

# Install .NET 10 SDK from https://dot.net

# Start a local PostgreSQL instance
docker run -d --name pg -e POSTGRES_PASSWORD=lifecycleiq_pass -e POSTGRES_DB=lifecycleiq -p 5432:5432 postgres:16-alpine

# Run API (auto-migrates on startup)
dotnet run --project LifecycleIQ.Api
# API available at http://localhost:8080
# Docs at http://localhost:8080/scalar
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173 (proxies /api → localhost:8080)
```

---

## Configuration

### Gemini API (AI Briefings)

A **demo free-tier API key is bundled in `backend/Dockerfile`** so the app works out of the box after cloning. It is rate-limited and intended for evaluation only.

To use your own key, override the environment variable in `docker-compose.yml`:

```yaml
# in the backend service's environment section:
Gemini__ApiKey: "AIza..."
```

Or get a free key at https://aistudio.google.com/apikey and set it there.

Without any key, SHI computation still works — briefings display as "not available".

### JWT Secret

Change `Jwt__Key` in `appsettings.json` or via compose env to a random 32+ character string before deploying.

---

## API Endpoints

Full interactive docs at `/scalar` when the backend is running.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Authenticate, receive JWT |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/solutions` | List solutions (filterable) |
| POST | `/api/solutions` | Create solution (Admin) |
| GET | `/api/solutions/{id}` | Solution detail |
| PUT | `/api/solutions/{id}` | Update solution (Admin) |
| DELETE | `/api/solutions/{id}` | Soft-delete (Admin) |
| POST | `/api/solutions/{id}/compute-shi` | Trigger WFA computation |
| GET | `/api/solutions/{id}/shi-history` | SHI trend data |
| GET | `/api/clients` | List clients |
| POST | `/api/clients` | Create client (Admin) |
| GET | `/api/dashboard/stats` | Aggregated stats |
| GET | `/api/notifications` | User notifications |
| PUT | `/api/notifications/{id}/read` | Mark read |
| PUT | `/api/notifications/read-all` | Mark all read |
| GET | `/api/change-requests` | Change request list |
| POST | `/api/change-requests` | Submit change request |
| PUT | `/api/change-requests/{id}/status` | Approve/reject (Admin) |

---

## License

University of Zimbabwe — Internship Project (LifecycleIQ)
