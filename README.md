# Engineering Intelligence Platform

AI platform for engineering teams. Four modules over one codebase:

| Module | What it does |
|---|---|
| **Meeting Debrief** | Paste a meeting transcript. Gemini extracts action items with assignees, priorities, and due dates. One-click create GitHub issues. |
| **Codebase Q&A** | Connect a GitHub repo. Ask natural-language questions. Get answers with file path and line-number citations, streamed token-by-token. |
| **Daily Digest** | Pulls 24h of GitHub activity (PRs, reviews, commits) and synthesizes a morning briefing with suggested priorities. |
| **Changelog Generator** | Picks merged PRs in a date range and writes three audience-tuned changelogs: engineer, PM, customer. |

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui |
| State | TanStack Query |
| Backend | Node.js + Express, TypeScript |
| LLM | Google Gemini 1.5 Flash (free tier) |
| Embeddings | Gemini `text-embedding-004` (768-dim, pgvector compatible) |
| Database | Supabase (PostgreSQL + pgvector + Auth + Realtime) |
| Hosting | Vercel (web) + Render (api) |

## Repo layout

```
engineering-intelligence/
├── apps/
│   ├── web/      Next.js 14 frontend
│   └── api/      Node.js + Express backend
├── supabase/
│   └── migrations/   SQL schema (pgvector, tables, RLS policies)
├── .env.example
└── README.md
```

## Local development

Prerequisites: Node 20+, a Supabase project, a Gemini API key, and a GitHub OAuth app.

```bash
# 1. Copy env template, then fill in keys for both apps
cp .env.example apps/web/.env.local
cp .env.example apps/api/.env

# 2. Run Supabase migrations (paste each file in supabase/migrations/ into the SQL editor)

# 3. Start both apps in two terminals
cd apps/api && npm install && npm run dev   # → http://localhost:4000
cd apps/web && npm install && npm run dev   # → http://localhost:3000
```

## Build phases

1. **Phase 0 — Setup** ✅ scaffolded
2. **Phase 1 — Auth + dashboard shell**
3. **Phase 2 — Meeting Debrief** (deployable)
4. **Phase 3 — Codebase Q&A** (RAG, the technical centerpiece)
5. **Phase 4 — Daily Digest**
6. **Phase 5 — Changelog Generator**

Detailed plan: `../AI_Platform_Game_Plan.md`.
