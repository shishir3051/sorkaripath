# SorkariPath — Bangladesh Govt Job Portal & A–Z Learning Academy

A full-stack **Bangladesh Government Job Portal, Live Official Notice Aggregator, Study Hub, and Timed MCQ Practice Arena** built with **Next.js 16 (App Router, TypeScript)**, **Tailwind CSS v4**, **Node.js**, **Express**, and **MongoDB Atlas**.

---

## Key Features

- **Live Official Job Circulars & Gemini AI Intelligence (`/`, `/jobs`, `/jobs/[slug]`)**
  - Concurrently syncs circulars, exam schedules, admit card notices, and results from **41 configured official sources** — 40 enabled by default, covering 36 `.gov.bd`/`bb.org.bd` job & notice pages (BPSC, Bangladesh Bank BSC, Bangladesh Post Office, DPE, NTRCA, DG Food, DSS, LGED, PWD, Railway, and ministries) plus 5 news RSS current-affairs feeds.
  - **Gemini AI Circular Finder & Multimodal Official PDF Reader** (`GEMINI_API_KEY` + optional backup pool via `GEMINI_API_KEYS`, defaulting to `gemini-4-hydrogen` with automatic key failover & model fallbacks) lets users ask live questions across `.gov.bd` notices and extract total vacancies, post grades, Teletalk fees, eligibility, and apply links directly from official circular PDFs.
  - **Floating Gemini Assistant** mounted on every route with **two-way voice**: English & Bangla speech input plus spoken replies, answering live circular questions on job pages and switching to **Study Tutor** mode on `/study`, `/learn`, and `/practice`.
  - Clean **Asia/Dhaka (BST)** date & time display, live header clock, bilingual search normalization (Bangla & English), persistent session bookmarks, and direct portal links (`AllJobs Teletalk`, `Bdjobs`, `BJSC`, `BMET`).
- **A–Z Career Learning Academy (`/learn`, `/learn/[slug]`)**
  - **26 structured modules (A–Z)** covering BCS, Bangladesh Bank, Primary/NTRCA, Defense, Technical, and Ministry recruitment processes—updated for **2026 rules** (32-year age limit, 93/7 quota distribution, National Pay Scale 2026).
- **Topic Guru Study Hub & Live Current Affairs (`/study`)**
  - **30 multi-chapter Topic Guru lecture sheets** across Bangla, English, Bangladesh Affairs, International Affairs, Math & Mental Ability, and Science & ICT.
  - **4 Course Batches** (BCS Cadre Foundation, Bangladesh Bank AD & Combined Bank, Primary & NTRCA Rapid, Ministry Grade 11–20) that map Topic Guru sheets and past-paper archives onto each exam track.
  - **30-Day Guided Study Routine** with persisted daily progress check-offs.
  - **Live RSS Current Affairs Digest** pulled from official/major news feeds (`BSS National News`, `Prothom Alo`, `The Daily Star`).
  - **20 Curated Books, Digests & Official Syllabus Portals** plus **Model Test presets**.
- **Timed MCQ Arena, Past Papers & Mistake Vault (`/practice`)**
  - **216 MCQ questions** including **8 Past Paper Job Solution archives** (BCS, Bank, Primary/NTRCA, Ministry Grade 11–20), server-graded scoring with optional **-0.50 BPSC negative marking**, Smart Search across questions and lecture sheets, Question Bookmarks, and an automatic **Mistake Vault** for wrong answers.
  - **Gemini MCQ Generator** for on-demand practice sets by subject, exam track, and difficulty, available in the Practice Arena and inside the Topic Guru AI Lab on `/study`.
- **2026 Preparation Calculators (`/tools`)**
  - Age Eligibility Calculator (32-year cutoff), National Pay Scale 2026 Estimator, and BCS Preliminary/Written/Viva Marks Simulator.
- **Live Web Sync & Admin Console (`/live-sync`)**
  - Monitor scraper status and recent sync logs, trigger per-source syncs (cooldown-protected for public visitors), or publish curated circulars with `x-admin-key`.

---

## Project Structure

```text
sorkaripath/
├── package.json                  # Root orchestrator (dev:full, build, lint, seed, sync)
├── DEPLOY_VERCEL.md              # Two-project Vercel monorepo deployment guide
├── frontend/                     # Next.js 16 + Tailwind CSS v4 frontend (Port 3000)
│   ├── next.config.ts            # Same-origin /api/v1/* rewrite + HTTP security headers
│   ├── vercel.json
│   └── src/
│       ├── app/                  # /, /jobs, /jobs/[slug], /learn, /learn/[slug], /study, /practice, /tools, /live-sync
│       │                         # icon.svg & apple-icon.tsx (browser tab & touch icons)
│       ├── components/           # Navigation, live clock, StudyHub, PracticeArena, JobsExplorer, calculators
│       └── lib/                  # Typed API client, safeExternalHref, BST formatters, Pay Scale data
└── server/                       # Express 4 ESM + Mongoose 8 + Cheerio API (Port 5050)
    ├── api/index.js              # Vercel serverless handler entrypoint
    ├── vercel.json               # Serverless routing + daily Vercel Cron (/api/v1/sync/cron)
    ├── .env.example
    └── src/
        ├── config/               # Zod v4 env validation (fail-closed in production) & MongoDB connector
        ├── controllers/          # jobs, learn, study, practice, progress, sync, meta
        ├── middleware/           # timing-safe adminAuth, bounded rateLimiter, errorHandler, validate
        ├── models/               # JobCircular, LearningModule, StudyTopic, StudyResource,
        │                         # CurrentAffairsItem, McqQuestion, QuizAttempt, LearnerProgress, WebSource, SyncLog
        ├── routes/               # /api/v1/* REST endpoints
        ├── scrapers/             # Concurrent worker pool + Cheerio & RSS adapters
        ├── seed/                 # Seed datasets (A–Z modules, Topic Guru sheets, books, MCQs, web sources)
        └── utils/security.js     # Timing-safe comparison, http(s) URL sanitizer, regex/query/session guards
```

---

## Quick Start (Local Development)

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure environment files:**
   - Copy `server/.env.example` -> `server/.env` and set `MONGODB_URI`.
   - Copy `frontend/.env.example` -> `frontend/.env.local` (`EXPRESS_API_ORIGIN=http://localhost:5050`, `NEXT_PUBLIC_API_BASE_URL=/api/v1`).

3. **Seed database & run initial live sync:**
   ```bash
   npm run seed
   ```

4. **Start both Express API (`:5050`) and Next.js (`:3000`) together:**
   ```bash
   npm run dev:full
   ```
   - Web App: `http://localhost:3000`
   - API Health: `http://localhost:5050/api/v1/health`

5. **Run standalone scraper sync anytime:**
   ```bash
   npm run sync
   ```

---

## Security & Vercel Deployment

- **Production Secrets & Auth:** Startup fails closed when `NODE_ENV=production` unless `ADMIN_API_KEY` and `CRON_SECRET` are strong random secrets (`16+` characters), checked with constant-time comparison (`crypto.timingSafeEqual`).
- **Abuse & Privacy Guardrails:** DB-backed `PUBLIC_SYNC_COOLDOWN_SEC` (`180s` default) prevents unauthenticated sync spamming, session IDs are validated, quiz history never returns records without a valid `sessionId`, and route rate limiters protect write/search endpoints.
- **XSS / Header Hardening:** External URLs (`pdfUrl`, `applyUrl`, scraped/RSS links, frontend buttons) only allow `http:` and `https:`, and Next.js serves `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` headers on every route.

See **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** for step-by-step instructions to deploy `server/` and `frontend/` to Vercel.

---

## License

Licensed under the [MIT License](./LICENSE).
