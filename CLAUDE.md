# CLAUDE.md - Website One Page SEO Application

> **Documentation Version**: 1.0
> **Last Updated**: 2026-02-25
> **Project**: SEO Analyzer — Full-Site SEO Monitoring SaaS
> **Description**: A SaaS platform for full-site SEO monitoring with async crawling, AI-driven insights, and real-time dashboards
> **Features**: GitHub auto-backup, Task agents, technical debt prevention

---

## CRITICAL RULES - READ FIRST

> Before starting ANY task, acknowledge: "CRITICAL RULES ACKNOWLEDGED - I will follow all rules in CLAUDE.md"

### ABSOLUTE PROHIBITIONS
- **NEVER** create files in the root directory — use proper module structure
- **NEVER** use `find`, `grep`, `cat`, `head`, `tail`, `ls` commands — use Read, Grep, Glob tools
- **NEVER** create duplicate files (manager_v2.py, enhanced_xyz.py, utils_new.js) — extend existing files
- **NEVER** create multiple implementations of the same concept — single source of truth
- **NEVER** hardcode values that belong in config/env files
- **NEVER** use naming like enhanced_, improved_, new_, v2_ — extend originals instead
- **NEVER** use git commands with the -i flag (interactive mode not supported)
- **NEVER** commit .env files or secrets

### MANDATORY REQUIREMENTS
- **COMMIT** after every completed task/phase — no exceptions
- **GITHUB BACKUP** — Push to GitHub after every commit: `git push origin main`
- **USE TASK AGENTS** for all long-running operations (>30 seconds)
- **READ FILES FIRST** before editing — Edit/Write tools require a prior Read
- **DEBT PREVENTION** — Search before creating. Use Grep/Glob to find existing code first
- **SINGLE SOURCE OF TRUTH** — One authoritative implementation per feature

### PRE-TASK COMPLIANCE CHECK
Before starting any task, verify:
- [ ] Will this create files in root? → Use proper module structure instead
- [ ] Will this take >30 seconds? → Use Task agents, not Bash
- [ ] Is this 3+ steps? → Break down with TodoWrite first
- [ ] Am I about to use grep/find/cat? → Use Grep/Glob/Read tools instead
- [ ] Does similar functionality exist? → Search first, extend if found

---

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 15 (App Router) |
| Language (Frontend) | TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Backend Framework | FastAPI (Python 3.12+) |
| Crawler | Python asyncio + Playwright + BeautifulSoup4 |
| Database | PostgreSQL |
| ORM | Prisma (via Next.js) |
| Real-time | WebSockets (FastAPI native) |
| AI Suggestions | Claude API (claude-sonnet-4-6) |
| Package Manager (FE) | pnpm |
| Package Manager (BE) | uv |

---

## PROJECT STRUCTURE

```
SEO-analyzer/
├── CLAUDE.md                    # This file — rules for Claude Code
├── README.md                    # Project documentation
├── .gitignore
├── prisma/
│   └── schema.prisma            # Database schema (source of truth)
├── src/
│   ├── frontend/                # Next.js application
│   │   ├── app/                 # App Router pages
│   │   │   ├── dashboard/       # Project Dashboard
│   │   │   ├── projects/[id]/   # Individual Project view
│   │   │   ├── issues/          # Site-wide Issue Tracker
│   │   │   ├── trends/          # Historical SEO Trends
│   │   │   └── api/             # Next.js API routes (proxy to FastAPI)
│   │   ├── components/
│   │   │   ├── ui/              # Reusable UI primitives
│   │   │   ├── charts/          # Recharts wrappers
│   │   │   ├── layout/          # Shell, Sidebar, Header
│   │   │   └── drawers/         # Slide-over drawers
│   │   ├── lib/                 # Utilities, API client, WebSocket
│   │   ├── types/               # TypeScript types (shared with prisma)
│   │   ├── hooks/               # Custom React hooks
│   │   └── styles/              # Global CSS
│   ├── backend/                 # FastAPI application
│   │   ├── api/
│   │   │   ├── routes/          # Endpoint routers (sites, scans, pages)
│   │   │   └── middleware/      # Auth, CORS, rate limiting
│   │   ├── crawler/             # Async crawler engine
│   │   ├── models/              # SQLAlchemy/Pydantic models
│   │   ├── services/            # Business logic (scoring, AI)
│   │   ├── utils/               # Helpers
│   │   └── config/              # Settings, env loading
│   └── shared/
│       ├── types/               # Shared type definitions
│       └── constants/           # SEO scoring weights, etc.
├── docs/
│   ├── architecture/            # System design docs
│   ├── api/                     # API reference
│   └── phases/                  # Phase implementation notes
├── tests/
│   ├── frontend/
│   └── backend/
└── output/                      # Generated reports, exports
```

---

## DATABASE SCHEMA (Prisma)

Source of truth: `prisma/schema.prisma`

**Core models:**
- `Site` — registered domains to monitor
- `ScanTask` — crawl jobs (status, progress, timestamps)
- `PageResult` — per-page extracted data (URL, title, meta, H1-H3, status code, load time)
- `SeoIssue` — categorized issues (Critical / Warning / Passed) per page
- `AiSuggestion` — Claude-generated fix recommendations per issue
- `ScoreHistory` — time-series SEO scores per site (for trend chart)

---

## API ROUTES

### FastAPI Backend (`src/backend/api/routes/`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sites` | Register a new site |
| GET | `/sites` | List all sites |
| POST | `/scans` | Trigger a new crawl |
| GET | `/scans/{id}` | Get scan status |
| GET | `/scans/{id}/results` | Get all page results |
| GET | `/pages/{id}` | Get single page diagnosis |
| GET | `/sites/{id}/trends` | Historical score data |
| WS | `/ws/scans/{id}` | Real-time crawl progress |

---

## SEO SCORING ALGORITHM

Source of truth: `src/backend/services/scoring.py`

```
Base score: 100
Deductions:
  - 404 / 5xx status:          -50
  - Missing <title>:           -20
  - Title too long (>60 chars):-10
  - Missing meta description:  -15
  - Meta desc too long:        -5
  - Missing H1:                -15
  - Multiple H1 tags:          -10
  - Images without alt:        -5 each (max -20)
  - Load time >3s:             -10
  - Load time >5s:             -20

Categories:
  - Critical:  score < 50
  - Warning:   score 50-79
  - Passed:    score >= 80
```

---

## DEVELOPMENT PHASES

### Phase 1: Infrastructure & Data Modeling
- [ ] Prisma schema with all models
- [ ] FastAPI project scaffold
- [ ] Next.js project scaffold
- [ ] Database migrations
- [ ] WebSocket setup

### Phase 2: Core Crawler & Analysis
- [ ] Async crawler with asyncio + Playwright
- [ ] Internal link traversal (depth limit 3)
- [ ] Data extraction per page
- [ ] SEO scoring algorithm
- [ ] JSON output formatter (Critical/Warning/Passed)

### Phase 3: Dynamic Dashboard & AI Diagnosis
- [ ] Top metrics cards (score, issues, pages)
- [ ] Recharts trend line (7-day)
- [ ] Top 10 lowest scoring pages table
- [ ] Slide-over drawer with page diagnosis
- [ ] Skeleton loading states
- [ ] Dark/Light mode
- [ ] Claude AI suggestion integration

---

## REAL-TIME DATA FLOW

```
User triggers scan
    → POST /scans (FastAPI)
    → Background task: crawler starts
    → Each page scraped → saved to DB → WebSocket broadcast
    → Frontend WS listener updates UI progressively
    → On completion → full results rendered
```

---

## GITHUB BACKUP WORKFLOW

After every commit:
```bash
git push origin main
```

This ensures remote backup, collaboration readiness, and version history.

---

## COMMON COMMANDS

```bash
# Frontend
cd src/frontend && pnpm dev          # Start Next.js dev server
cd src/frontend && pnpm build        # Production build
cd src/frontend && pnpm lint         # Lint

# Backend
cd src/backend && uv run uvicorn main:app --reload  # Start FastAPI
cd src/backend && uv run pytest      # Run tests

# Database
npx prisma migrate dev               # Run migrations
npx prisma studio                    # Open Prisma Studio GUI

# Git
git add <files> && git commit -m "..." && git push origin main
```

---

## TECHNICAL DEBT PREVENTION

### Before Creating ANY New File:
1. Search first: `Grep(pattern="<functionality>", glob="*.py")` or `*.tsx`
2. Read existing files to understand current patterns
3. Extend existing code if possible — prefer Edit over Write
4. Only create new files when extending is genuinely impossible

### Single Source of Truth:
- SEO scoring weights → `src/shared/constants/`
- TypeScript types → `src/frontend/types/` (generated from Prisma where possible)
- API client → `src/frontend/lib/api.ts`
- WebSocket client → `src/frontend/lib/websocket.ts`

---

*Template by Chang Ho Chien | HC AI 說人話channel | v1.0.0*
