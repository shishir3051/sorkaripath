# SorkariPath — Bangladesh Government Job Portal & A-to-Z Learning Academy

A full-stack **Bangladesh Government Job Portal, Live Web Aggregator, and A-to-Z Career Learning Academy** built with **Next.js (App Router, TypeScript)**, **Tailwind CSS v4**, **Node.js**, **Express**, and **MongoDB Atlas**.

---

## Project Structure

```text
bd-govt-job-portal/
├── package.json              # Root orchestrator (dev:full, build, lint, seed, sync)
├── frontend/                 # Next.js 16 + Tailwind CSS v4 frontend (Port 3000)
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── .env.local            # EXPRESS_API_ORIGIN & NEXT_PUBLIC_API_BASE_URL
│   └── src/
│       ├── app/              # /, /jobs, /jobs/[slug], /learn, /learn/[slug], /practice, /tools, /live-sync
│       ├── components/       # UI & interactive domain modules
│       └── lib/              # Typed API client, DTO types, 2026 Pay Scale calculator
└── server/                   # Node.js + Express + MongoDB backend (Port 5050)
    ├── package.json
    ├── .env                  # MONGODB_URI (bd_govt_job_portal), PORT, ADMIN_API_KEY, SYNC_CRON_SCHEDULE
    └── src/
        ├── config/           # env.js, db.js
        ├── controllers/      # jobs, learn, meta, practice, progress, sync
        ├── middleware/       # adminAuth, errorHandler, rateLimiter, validate
        ├── models/           # JobCircular, LearningModule, McqQuestion, QuizAttempt, LearnerProgress, WebSource, SyncLog
        ├── routes/           # /api/v1/* endpoints
        ├── scrapers/         # Cheerio live web sync + npfTable & bbErecruitment adapters
        ├── seed/             # seedDatabase.js, runSyncOnce.js & A-Z / MCQ / WebSource datasets
        └── index.js
```

---

## Quick Start

1. **Install dependencies** (if starting fresh):
   ```bash
   npm run install:all
   ```

2. **Configure Environment**:
   - Frontend: `frontend/.env.local` (see `frontend/.env.example`)
   - Backend: `server/.env` (see `server/.env.example`)

3. **Seed A-to-Z Curriculum, MCQs & Run Initial Live Web Sync**:
   ```bash
   npm run seed
   ```

4. **Run Both Backend API & Frontend Dev Server Together**:
   ```bash
   npm run dev:full
   ```
   - Frontend: `http://localhost:3000`
   - Express API Health: `http://localhost:5050/api/v1/health`

5. **Run Standalone Web Sync Anytime**:
   ```bash
   npm run sync
   ```
