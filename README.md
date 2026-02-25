# SEO Analyzer — Full-Site SEO Monitoring SaaS

A SaaS platform for full-site SEO monitoring with async crawling, AI-driven diagnosis, and real-time dashboards.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4, Recharts |
| Backend | FastAPI (Python 3.12+) |
| Crawler | asyncio + Playwright + BeautifulSoup4 |
| Database | PostgreSQL + Prisma ORM |
| Real-time | WebSockets |
| AI | Claude API (claude-sonnet-4-6) |

## Project Phases

### Phase 1: Infrastructure & Data Modeling
- Database schema (Sites, ScanTasks, PageResults, AiSuggestions, ScoreHistory)
- FastAPI + Next.js project scaffolds
- WebSocket real-time update architecture

### Phase 2: Core Crawler & Analysis Engine
- Async internal-link crawler (depth limit 3)
- Per-page data extraction (URL, status, title, meta, H1-H3, alt tags, load time)
- SEO health scoring algorithm (0–100)
- JSON output: Critical / Warning / Passed categories

### Phase 3: Dynamic Dashboard & AI Diagnosis
- Top metrics cards with circular progress bar
- 7-day trend line chart (Recharts)
- Top 10 lowest-scoring pages table
- Slide-over drawer with page-level diagnosis
- Skeleton loading states
- Dark/Light mode
- Claude AI fix suggestions

## Quick Start

```bash
# Frontend
cd src/frontend
pnpm install
pnpm dev

# Backend
cd src/backend
uv sync
uv run uvicorn main:app --reload

# Database
npx prisma migrate dev
```

## Development Guidelines

- Read `CLAUDE.md` before starting any task
- Search before creating — extend existing code
- Commit after every completed feature
- Push to GitHub after every commit
