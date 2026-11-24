# Deploying SorkariPath to Vercel

Because this monorepo contains a **Next.js 16 frontend** (`frontend/`) and an **Express + MongoDB + Live Scraper backend** (`server/`), deploy them as **two Vercel projects from the same Git repository** (or two folder deploys via `vercel` CLI).

---

## Step 1: Initialize Git & Push to GitHub

```bash
cd C:\Git\bd-govt-job-portal
git init
git add .
git commit -m "Prepare SorkariPath for Vercel deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

---

## Step 2: Deploy Project 1 — Backend API (`server/`)

1. In the **Vercel Dashboard**, click **Add New → Project** and import your GitHub repository.
2. Under **Root Directory**, click **Edit** and select `server`.
3. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = your MongoDB Atlas connection string (ensure **MongoDB Atlas Network Access** allows `0.0.0.0/0` so Vercel serverless IPs can connect!)
   - `CORS_ORIGIN` = `http://localhost:3000` (you will replace/update this with your frontend `.vercel.app` URL right after Step 3)
   - `CORS_ALLOW_VERCEL_PREVIEWS` = `false` *(default & recommended for security; only set `true` temporarily if you test preview deployments alongside `CORS_VERCEL_PROJECT_PREFIX`)*
   - `ADMIN_API_KEY` = strong random secret (**16+ characters** — the server refuses to start in `production` if left as default or shorter than 16 chars)
   - `CRON_SECRET` = strong random secret (**16+ characters**) for Vercel Cron auth on `GET /api/v1/sync/cron`
   - `PUBLIC_SYNC_COOLDOWN_SEC` = `180` *(recommended cooldown in seconds between public UI sync triggers; admin key bypasses cooldown)*
   - `SCRAPER_TIMEOUT_MS` = `10000`
   - `GEMINI_API_KEY` = your primary Google Gemini API key *(optional, enables AI Circular Finder and Official PDF Reader on `/jobs` & `/jobs/[slug]`)*
   - `GEMINI_API_KEYS` = optional comma-separated backup Gemini API keys *(e.g. `key2,key3` — automatically switches to the next healthy key on `429` quota/rate limits or `401/403` errors; numbered `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` are also supported)*
   - `GEMINI_MODEL` = `gemini-4-hydrogen` *(optional; automatically falls back to `gemini-3.5-flash` / `gemini-3.5-flash-lite` / `gemini-3.1-flash-lite`)*
4. Click **Deploy**.
   - `server/vercel.json` routes all requests to `server/api/index.js` (`maxDuration: 60`) and schedules a daily **Vercel Cron Job** (`0 2 * * *` UTC / 08:00 AM BST — compatible with the Vercel Hobby plan).
   - For **automatic 30-minute syncing** on Vercel Hobby, this repo includes `.github/workflows/auto-sync.yml` (`*/30 * * * *`). In your GitHub repo **Settings → Secrets and variables → Actions**, add:
     - `CRON_SECRET` = the exact same `CRON_SECRET` value configured in your Vercel Backend project
     - `SYNC_API_URL` *(recommended)* = `https://<your-api-project>.vercel.app/api/v1/sync/cron` *(falls back to `https://sorkaripath.vercel.app/api/v1/sync/cron` if omitted)*
5. Verify your deployed API health URL in the browser:
   - `https://<your-api-project>.vercel.app/api/v1/health` -> should return `"dbState": "connected"`.

> **Database Seed Note:** If you haven't seeded MongoDB Atlas yet, run `npm --prefix server run seed` once locally with your Atlas `MONGODB_URI` set in `server/.env`.

---

## Step 3: Deploy Project 2 — Next.js Frontend (`frontend/`)

1. In the **Vercel Dashboard**, click **Add New → Project** and import the **same** GitHub repository again.
2. Under **Root Directory**, click **Edit** and select `frontend`.
3. Under **Environment Variables**, add:
   - `EXPRESS_API_ORIGIN` = `https://<your-api-project>.vercel.app` *(exact backend URL from Step 2, no trailing slash)*
   - `NEXT_PUBLIC_API_BASE_URL` = `/api/v1`
4. Click **Deploy**.

Because `frontend/next.config.ts` proxies `/api/v1/*` to `EXPRESS_API_ORIGIN`, all browser API calls remain same-origin and SSR server components read directly from your Express API with zero CORS headaches.

---

## Step 4: Final CORS Lock-In

1. Go back to your **Backend Project (`server`) -> Settings -> Environment Variables**.
2. Set `CORS_ORIGIN` to your production frontend URL (comma-separated if multiple):
   `https://<your-frontend-project>.vercel.app`
3. Redeploy the Backend project so the updated `CORS_ORIGIN` takes effect.

---

## Optional: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login

# Deploy backend
cd C:\Git\bd-govt-job-portal\server
vercel --prod

# Deploy frontend
cd C:\Git\bd-govt-job-portal\frontend
vercel --prod
```
