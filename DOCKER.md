# Self-host with Docker

A `docker-compose.yml` brings up the Express API and the Next.js web app on your own machine. You still need a Supabase project for storage/auth (free tier is fine) and a Gemini API key for the LLM — but neither requires you to sign up to *this* deployment.

This is for engineers who want to try the app without trusting a stranger's `ei-app.vercel.app` domain with their GitHub token. It's not a fully on-prem install — Supabase and Gemini are still external — but it removes the "give my data to someone's portfolio site" concern.

## Prerequisites

- **Docker Desktop** (or any Docker engine ≥ 24) with `docker compose` available
- **A free Supabase project** with the migrations from [`supabase/migrations/`](supabase/migrations/) applied in order
- **A Gemini API key** from [aistudio.google.com](https://aistudio.google.com/app/apikey)
- **A GitHub OAuth app** at [github.com/settings/developers](https://github.com/settings/developers) with the callback URL set to `https://<your-supabase-url>/auth/v1/callback`

## One-time setup

```bash
git clone https://github.com/gvvskvarma/engineering-intelligence.git
cd engineering-intelligence

# Single shared .env at the repo root — docker-compose reads from here
cp .env.example .env
```

Edit `.env` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23li...
GITHUB_CLIENT_SECRET=...
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

The R2 and `PORT` variables from `.env.example` are unused by docker-compose; you can ignore them.

## Run it

```bash
docker compose up --build
```

First build takes ~3 minutes. After that:

- Web: <http://localhost:3000>
- API: <http://localhost:4000/health>

Stop with `Ctrl+C` or `docker compose down`. Rebuild after pulling new code with `docker compose up --build`.

## Configure Supabase

In your Supabase dashboard:

1. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/**`
2. **Authentication → Providers → GitHub**
   - Toggle enabled
   - Client ID and Client Secret from your GitHub OAuth app
   - The callback URL Supabase shows here is what goes into your GitHub OAuth app's "Authorization callback URL" field
3. **SQL Editor** — run each file in `supabase/migrations/` in order if you haven't already

## Going fully on-prem

If you want zero external dependencies (no Supabase cloud, no Gemini):

- **Supabase** has a self-hosted Postgres bundle: <https://supabase.com/docs/guides/self-hosting>. Swap the `NEXT_PUBLIC_SUPABASE_URL` env to your self-hosted instance and re-run the migrations.
- **Gemini → local LLM:** swap `apps/api/src/services/gemini.ts` to call Ollama or a self-hosted OpenAI-compatible endpoint. Stripping out the structured-JSON-output features (debrief, changelog) is the trickiest part — most local models support JSON mode via prompt engineering instead of a hard schema, so you'd add JSON validation client-side.

These are non-trivial swaps. For most engineers wanting to try this without exposing data, the Supabase + Gemini cloud setup with your own keys is the right pragmatic middle.

## Troubleshooting

**API container exits with "GEMINI_API_KEY is not set"**
The container can't read `.env` at the project root unless docker-compose substitutes the values. Confirm the variable is set in `.env` (not in `apps/api/.env`) and rebuild: `docker compose up --build`.

**Web container can't reach the API**
The compose file uses `http://localhost:4000` for `NEXT_PUBLIC_API_URL`. That works because the API port is published. If you change the API port, change both the published port and the env var.

**OAuth callback redirects to localhost from production**
Make sure your Supabase project's Site URL and Redirect URLs are set to `http://localhost:3000` while testing locally. Production and local need separate Supabase projects (or careful URL configuration) since the OAuth callback can only point at one origin at a time.
