# GameFinder

AI board game recommendations + AI Game Coach. Phase 0 web prototype.

Live: https://gamefinderapp.netlify.app

## Stack

Vite 7 + React + TypeScript + Tailwind v3, Supabase (Postgres + pgvector + Edge Functions), Netlify (Functions + hosting).

## Local setup

Requires Node 20+, the `netlify` CLI (`npm i -g netlify-cli`), and a Netlify account linked to this site.

```bash
git clone https://github.com/johnbazyk/GameFinder.git
cd GameFinder
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
netlify dev
```

`netlify dev` boots Vite on `http://localhost:5173` and proxies functions at `http://localhost:8888/.netlify/functions/<name>`.

To run only Vite (no functions): `npm run dev`.

## Deploy

Pushes to `main` trigger an automatic Netlify build and deploy. Build settings live in `netlify.toml`. Site env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are configured in the Netlify dashboard.

## Env vars

**Never commit `.env`.** It is gitignored. Use `.env.example` as the template for required keys.

| Key | Where used |
| --- | --- |
| `VITE_SUPABASE_URL` | Browser — Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Browser — Supabase client |
