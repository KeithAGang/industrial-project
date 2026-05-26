# LifecycleIQ — Architecture

## What It Does

LifecycleIQ is a centralized lifecycle management platform for enterprise client software solutions. It answers one question for every managed solution: **how healthy is it right now, and what should we do about it?**

It does this through the **Weighted Factor Analysis (WFA) Algorithm**, which computes a **Solution Health Index (SHI)** — a single number between 0 and 1 that represents operational risk. Higher score = more urgent attention needed.

---

## The WFA Algorithm

```
SHI = Σ(Wᵢ × Fᵢ) / ΣWᵢ
```

Four factors are evaluated per solution:

| Factor | Weight | How it's measured |
|--------|--------|-------------------|
| Licence Urgency | 0.40 | Days until licence expiry → normalised 0–1 |
| Version Gap | 0.25 | Semantic version distance from current to latest |
| SLA Compliance | 0.25 | Compliant=0.1 / AtRisk=0.6 / Breached=1.0 |
| Maintenance Recency | 0.10 | Days since last maintenance → normalised 0–1 |

Weights are derived from the Analytic Hierarchy Process (AHP).

**Risk Tiers:**

```
SHI ≥ 0.80  → 🔴 Critical  (immediate action)
SHI ≥ 0.60  → 🟠 High      (this week)
SHI ≥ 0.40  → 🟡 Medium    (this sprint)
SHI  < 0.40 → 🟢 Low       (scheduled maintenance)
```

---

## AI Briefing Module

After each SHI computation, the system calls the **Google Gemini API** (gemini-2.0-flash, free tier via Google AI Studio) with a structured prompt containing the solution name, SHI score, and all factor values/weights.

The API returns a 3-sentence plain-English briefing:
1. Overall risk level
2. Dominant risk factor and its implication
3. Recommended action

If the Gemini API is unavailable or the key is not configured, the system degrades gracefully — SHI scores and risk tiers continue to work; briefings simply show as unavailable.

---

## System Architecture

```
┌──────────────────────────────────────────────┐
│                 Browser / Client              │
│  React 18 · TanStack Router · Tailwind v4    │
│  TanStack Query · Recharts · shadcn/ui        │
└─────────────────────┬────────────────────────┘
                       │ HTTP/REST + JWT
┌─────────────────────▼────────────────────────┐
│           ASP.NET Core 10 Web API             │
│                                               │
│  Controllers  →  Services  →  EF Core         │
│                                               │
│  WfaService        — SHI computation          │
│  AiBriefingService — Gemini API calls           │
│  NotificationService — risk alerts            │
│  JwtService        — auth tokens              │
│                                               │
│  Scalar UI at /scalar (OpenAPI docs)          │
└──────────┬─────────────────────┬─────────────┘
           │ PostgreSQL           │ HTTPS
           ▼                     ▼
    ┌─────────────┐       ┌─────────────┐
    │  PostgreSQL │       │ Gemini API  │
    │     16      │       │  (external) │
    └─────────────┘       └─────────────┘
```

---

## Database Schema

```
Users ──────────────────────────────────────────┐
  id, email, password_hash, full_name, role      │
                                                 │
Clients                                          │
  id, name, contact_person, email, phone         │
     │                                           │
     │ 1:N                                       │
     ▼                                           │
Solutions ─────────────────────────────────────┐ │
  id, client_id, name, current_version,        │ │
  latest_version, licence_expiry_date,         │ │
  sla_tier, sla_compliance_status,             │ │
  last_maintenance_date, is_active             │ │
     │                                         │ │
     ├─ 1:N ──► ShiRecords                     │ │
     │            shi_score, risk_tier,         │ │
     │            factor_scores, weights,       │ │
     │            ai_briefing, computed_at      │ │
     │                                         │ │
     ├─ 1:N ──► Notifications ◄────────────────┘ │
     │            type, title, message,           │
     │            is_read, user_id (nullable)      │
     │                                           │
     └─ 1:N ──► ChangeRequests ◄────────────────┘
                  title, description, status,
                  priority, requested_by_id,
                  resolved_by_id
```

---

## Data Flow: SHI Computation

```
POST /api/solutions/{id}/compute-shi
           │
           ▼
     WfaService.ComputeAsync(solution)
           │
           ├── NormaliseLicenceUrgency()
           ├── NormaliseVersionGap()
           ├── NormaliseSlaCompliance()
           ├── NormaliseMaintenanceRecency()
           │
           ├── SHI = Σ(W×F) / ΣW
           │
           ├── Save ShiRecord to DB
           │
           ├── AiBriefingService.GenerateBriefingAsync()
           │       └── POST generativelanguage.googleapis.com/v1beta
           │
           ├── Update ShiRecord.AiBriefing
           │
           └── NotificationService.CreateForShiAsync()
                   └── Create Notification if Critical/High
```

---

## Authentication

JWT Bearer tokens issued on `POST /api/auth/login`. Tokens carry: `userId`, `email`, `role`. Expiry: 8 hours.

Roles:
- **Admin** — full CRUD, approve/reject change requests, delete solutions
- **Manager** — read access, can create change requests

---

## Deployment

One command:

```bash
docker compose up -d
```

Services:
- **db** — PostgreSQL 16 (port 5432)
- **backend** — .NET 10 API (port 8080), auto-migrates on startup
- **frontend** — Nginx serving the React build (port 3000)

The API docs are available at `http://localhost:8080/scalar`.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| PostgreSQL over MongoDB | Data is relational — clients→solutions→SHI records. SQL aggregations are optimal for dashboard stats. |
| .NET 10 / C# | Strongly typed, excellent EF Core integration, clean async patterns. |
| WFA over ML | Explainable, auditable, AHP-validated weights. No training data or infrastructure needed. |
| Gemini over Groq/OpenAI | Free tier via Google AI Studio; no billing required for dev usage. |
| TanStack Router | Type-safe file-based routing, no React Router. |
| Tailwind v4 | CSS-variable approach eliminates JS config, simpler dark mode. |
| Paper/ink aesthetic | Editorial B2B feel — thin borders, strong typography, minimal chrome. Not material/card-heavy. |
