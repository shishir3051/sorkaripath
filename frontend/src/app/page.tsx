import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Calculator,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Radio,
  ShieldCheck,
  Target,
} from "lucide-react";
import {
  apiFetch,
  formatBdDateTime,
  formatNoticeDate,
  safeExternalHref,
} from "@/lib/api";
import type { OverviewData } from "@/lib/types";
import { HeroSearch } from "@/components/home/HeroSearch";
import { HomeAutoSync } from "@/components/home/HomeAutoSync";
import { OriginBadge, RecordTypeBadge } from "@/components/ui/Badges";
import { DhakaClockBadge } from "@/components/layout/DhakaClockBadge";

export const dynamic = "force-dynamic";

async function loadOverview(): Promise<OverviewData | null> {
  try {
    return await apiFetch<OverviewData>("/meta/overview");
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const overview = await loadOverview();

  // If the overview API is unreachable, every label below drops its number
  // instead of falling back to a placeholder. A stale count still reads as
  // fact: the previous fallback claimed 8 portals, 40 MCQs and "View All 0".
  const stats = overview?.stats ?? null;

  return (
    <div className="space-y-10 pb-8">
      <HomeAutoSync syncMeta={overview?.syncMeta} />
      {/* Hero Banner */}
      <div className="app-container pt-4 sm:pt-5 lg:pt-6">
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-[#0d2421] to-[#0b382d] text-white shadow-xl shadow-slate-900/10">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "radial-gradient(circle at 18% 22%, #10b981 0, transparent 48%), radial-gradient(circle at 84% 78%, #0f766e 0, transparent 42%)",
            }}
          />
          <div className="relative px-4 py-7 sm:px-9 sm:py-12 lg:px-12 lg:py-14">
          <div className="grid gap-8 lg:gap-10 lg:grid-cols-12 lg:items-center">
            <div className="min-w-0 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-white/20">
                  <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  <span>
                    Live Synced from {stats ? `${stats.enabledSources} ` : ""}Official .gov.bd &amp; Bank Portals
                  </span>
                </div>
                <DhakaClockBadge variant="hero" />
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl leading-[1.15]">
                Master Bangladesh Govt Jobs{" "}
                <span className="text-emerald-300">from A to Z</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-emerald-50/90 leading-relaxed">
                Track live official circulars, exam schedules, and results directly
                from BPSC, Bangladesh Bank, MOPA &amp; ministries—while learning
                every rule, syllabus, 2026 Pay Scale, and MCQ strategy in one
                unified academy.
              </p>

              <HeroSearch />

              <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold">
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-2 text-white hover:bg-white/25 transition-colors"
                >
                  <BookOpen className="h-4 w-4 text-emerald-300" />
                  Start A-to-Z Roadmap{stats ? ` (${stats.lessonCount} Modules)` : ""}
                </Link>
                <Link
                  href="/practice"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-2 text-white hover:bg-white/25 transition-colors"
                >
                  <Target className="h-4 w-4 text-rose-300" />
                  Take MCQ Mock{stats ? ` (${stats.mcqCount}+ Questions)` : ""}
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-2 text-white hover:bg-white/25 transition-colors"
                >
                  <Calculator className="h-4 w-4 text-amber-300" />
                  Age &amp; 2026 Pay Calculator
                </Link>
              </div>
            </div>

            {/* Live Policy Snapshot Card */}
            <div className="min-w-0 lg:col-span-5">
              <div className="rounded-2xl bg-white/10 p-4 sm:p-6 backdrop-blur-md ring-1 ring-white/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    2026 Regulatory Snapshot
                  </span>
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-black/20 p-3.5">
                    <p className="text-xs text-emerald-200">Entry Age Limit</p>
                    <p className="mt-1 text-lg font-extrabold text-white">21–32 Yrs</p>
                    <p className="text-[11px] text-emerald-100/75">
                      Unlimited BCS attempts
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3.5">
                    <p className="text-xs text-emerald-200">Merit vs Quota</p>
                    <p className="mt-1 text-lg font-extrabold text-white">93% / 7%</p>
                    <p className="text-[11px] text-emerald-100/75">
                      July 2024 Gazette Reform
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3.5">
                    <p className="text-xs text-emerald-200">Grade 9 Basic (2026)</p>
                    <p className="mt-1 text-lg font-extrabold text-white">৳44,000</p>
                    <p className="text-[11px] text-emerald-100/75">
                      9th Pay Scale (Phased)
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3.5">
                    <p className="text-xs text-emerald-200">Live Web Records</p>
                    <p className="mt-1 text-lg font-extrabold text-white">
                      {stats ? stats.liveSyncedCount.toLocaleString("en-US") : "—"}
                    </p>
                    <p className="text-[11px] text-emerald-100/75">
                      {overview?.lastSyncLog
                        ? `Synced ${formatBdDateTime(overview.lastSyncLog.finishedAt)} BST`
                        : "Real-time MongoDB"}
                    </p>
                  </div>
                </div>

                <Link
                  href="/live-sync"
                  className="flex items-center justify-between rounded-xl bg-emerald-500/20 px-4 py-2.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30 transition-colors"
                >
                  <span>Inspect Live Scraper Health &amp; Trigger Sync</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        </section>
      </div>

      {/* Main Content Container */}
      <div className="app-container space-y-10">
        {!overview && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
            <strong>Backend API Offline Notice:</strong> Start the Express backend (
            <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">
              npm run dev:full
            </code>
            ) to load live MongoDB Atlas notices and interactive modules.
          </div>
        )}

        {/* Quick Value Pillars */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/jobs"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Briefcase className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900 group-hover:text-emerald-700">
              {stats ? `${stats.totalCirculars} ` : ""}Active Feeds &amp; Guides
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Filter live BPSC, Bank BSC, DGHS, MOPA &amp; Railway updates with direct PDFs.
            </p>
          </Link>

          <Link
            href="/learn"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900 group-hover:text-emerald-700">
              A-to-Z Curriculum{stats ? ` (${stats.lessonCount})` : ""}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              26 step-by-step modules from Teletalk setup to Viva Voce &amp; Gazette joining.
            </p>
          </Link>

          <Link
            href="/practice"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900 group-hover:text-emerald-700">
              BCS / Bank MCQ Arena
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Practice with real -0.50 negative marking, timer &amp; instant explanations.
            </p>
          </Link>

          <Link
            href="/tools"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Calculator className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900 group-hover:text-emerald-700">
              2026 Calculators Suite
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Exact govt age calculator, 9th Pay Scale salary estimator &amp; BCS target tool.
            </p>
          </Link>
        </section>

        {/* Latest Web-Synced Official Notices + Featured Career Tracks */}
        <section className="grid gap-8 lg:grid-cols-12">
          {/* Live Grabbed Official Notices */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Latest Live Official Circulars &amp; Notices
                </h2>
                <p className="text-sm text-slate-500">
                  Diverse latest feed across {stats ? `${stats.enabledSources} ` : ""}connected govt ministries, BPSC &amp; Bangladesh Bank
                </p>
              </div>
              <Link
                href="/jobs?origin=web_sync"
                className="shrink-0 text-sm font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                <span>View All{stats ? ` ${stats.liveSyncedCount}` : ""}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {overview?.latestRecruitmentCirculars &&
              overview.latestRecruitmentCirculars.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                      Direct Hiring Circulars ({overview.latestRecruitmentCirculars.length} Recent)
                    </span>
                    <Link
                      href="/jobs?recordType=circular"
                      className="text-xs font-bold text-emerald-800 hover:underline"
                    >
                      All Job Circulars →
                    </Link>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {overview.latestRecruitmentCirculars.slice(0, 4).map((c) => (
                      <Link
                        key={c._id}
                        href={`/jobs/${c.slug}`}
                        className="rounded-xl border border-emerald-200/80 bg-white p-3 hover:border-emerald-500 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-emerald-800">
                          <span>{c.organizationShort || c.category}</span>
                          <span className="text-slate-500 font-medium">
                            {formatNoticeDate(c.publishedDate, c.publishedDateRaw)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                          {c.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
              {(overview?.latestLiveNotices || []).map((item) => (
                <div
                  key={item._id}
                  className="p-4 sm:p-5 hover:bg-emerald-50/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <OriginBadge origin={item.origin} />
                    <RecordTypeBadge type={item.recordType} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                      {item.organizationShort || item.category}
                    </span>
                    <div className="ml-auto text-right">
                      <span className="block text-xs font-semibold text-slate-700">
                        {formatNoticeDate(item.publishedDate, item.publishedDateRaw)}
                      </span>
                      {(item.updatedAt || item.createdAt) && (
                        <span className="block text-[10px] text-slate-400">
                          Synced {formatBdDateTime(item.updatedAt || item.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/jobs/${item.slug}`}
                    className="block text-sm sm:text-base font-bold text-slate-900 hover:text-emerald-700 leading-snug"
                  >
                    {item.title}
                  </Link>

                  <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>{item.organization}</span>
                    {safeExternalHref(item.pdfUrl, "") && (
                      <a
                        href={safeExternalHref(item.pdfUrl, "")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Official PDF</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {overview && overview.latestLiveNotices.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  No live notices synced yet. Visit{" "}
                  <Link href="/live-sync" className="text-emerald-700 font-semibold underline">
                    Live Web Sync
                  </Link>{" "}
                  to pull the latest updates.
                </div>
              )}
            </div>
          </div>

          {/* Curated Career Tracks & 2026 Quota Card */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Featured Career Tracks
                </h2>
                <Link
                  href="/jobs?origin=curated"
                  className="text-sm font-bold text-emerald-700 hover:text-emerald-800"
                >
                  All Tracks →
                </Link>
              </div>
              <div className="space-y-3">
                {(overview?.featuredCirculars || []).slice(0, 4).map((track) => (
                  <Link
                    key={track._id}
                    href={`/jobs/${track.slug}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-400 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        {track.category} • {track.gradeRange}
                      </span>
                      <OriginBadge origin={track.origin} />
                    </div>
                    <h3 className="mt-1.5 text-sm font-bold text-slate-900">
                      {track.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                      {track.payScale2026}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* 2026 Quota Quick Reference */}
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                Current Quota Allocation (93 / 7 Rule)
              </h3>
              <div className="mt-4 space-y-3">
                {(overview?.highlights2026?.quotaBreakdown || [
                  { label: "Merit (Open Competition)", percent: 93 },
                  { label: "Children of Freedom Fighters / Biranganas", percent: 5 },
                  { label: "Ethnic Minorities", percent: 1 },
                  { label: "Persons with Disabilities & Third Gender", percent: 1 },
                ]).map((q) => (
                  <div key={q.label}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{q.label}</span>
                      <span>{q.percent}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-700"
                        style={{ width: `${q.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/learn/f-age-quota-2026-rules"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
              >
                Read full Age &amp; Quota Module F →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
