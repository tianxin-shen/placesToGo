# Places To Go — Project Context

## What This App Is

A multi-platform progressive web app (PWA) that helps solo travelers turn a scattered wishlist of saved places into a structured, AI-generated day-by-day trip itinerary. Think personal travel agent: you save places you want to visit, select the ones that matter most, set your dates and preferences, and the app builds the plan.

## Current Status

MVP in active development. Single-user trip planning only. Group features, native apps, and in-visiting mode are explicitly out of scope for v1.

See [`agents/shared-context.md`](agents/shared-context.md) for the live decisions log, milestone status, and completed features.

---

## Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** for styling
- **TanStack Query v5** for server state / caching
- **React Router v7** for routing
- **@googlemaps/js-api-loader** for Google Maps integration
- **Headless UI** for accessible components

### Backend
- **Node.js** + **Express v5** + **TypeScript**
- **MongoDB** via **Mongoose v8**
- **JWT** for auth tokens
- **Google Auth Library** for Google OAuth
- **bcryptjs** for password hashing
- **Swagger / swagger-ui-express** for API docs

### AI
- **Claude API (Anthropic)** — used for itinerary generation
- Target model: Claude Sonnet (quality/cost balance — confirm before Milestone 2)

### Infrastructure
- PWA: Web app manifest + service worker (offline shell)
- No native app — PWA is the mobile strategy for MVP

---

## Repository Structure

```
placesToGo/
├── CLAUDE.md                  ← you are here — root context, always load this
├── agents/
│   ├── pm-agent.md            ← PM role prompt + full MVP product spec
│   ├── sde-agent.md           ← SDE role prompt + implementation guidelines
│   ├── qc-agent.md            ← QC role prompt + test scenarios
│   └── shared-context.md      ← decisions log, milestone status, open issues
├── specs/
│   └── (feature specs go here, named feature-NNN-name.md)
├── frontend/
│   └── src/
│       ├── pages/             ← Explore, WantToGo, Trips (stub)
│       ├── components/
│       ├── api/
│       ├── hooks/
│       ├── context/           ← AuthContext
│       └── utils/
└── backend/
    └── src/
        ├── models/            ← User, Place, WantToGo (Trip model is next)
        ├── routes/            ← auth, places, wantToGo (trips routes are next)
        ├── middleware/        ← auth middleware
        └── config/            ← db connection
```

---

## Agent Roles

This project uses a three-agent system. Each agent has a role prompt in `agents/`:

| File | Role | When to invoke |
|---|---|---|
| [`agents/pm-agent.md`](agents/pm-agent.md) | Product Manager | Spec new features, prioritize, update milestones |
| [`agents/sde-agent.md`](agents/sde-agent.md) | Software Engineer | Implement features, write code, technical decisions |
| [`agents/qc-agent.md`](agents/qc-agent.md) | QA / QC | Write test plans, verify milestones, catch regressions |

**How to invoke an agent:** Open a new Claude Code session and say: "Read CLAUDE.md and agents/[role]-agent.md, then act in that role."

**Shared state:** All agents read and write [`agents/shared-context.md`](agents/shared-context.md) — this is the source of truth for what's decided, what's done, and what's in progress.

---

## Key Conventions

- All new API routes follow the existing pattern in `backend/src/routes/`
- Frontend API calls go through `frontend/src/api/` — never call axios directly from components
- Use TanStack Query for all server state — no local useState for fetched data
- Mobile-first CSS — design for 375px viewport first
- No comments unless the WHY is non-obvious
- TypeScript strict mode — no `any` types
