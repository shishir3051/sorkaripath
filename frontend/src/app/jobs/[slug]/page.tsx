import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import {
  apiFetch,
  formatBdDateTime,
  formatNoticeDate,
  formatReadableText,
  safeExternalHref,
} from "@/lib/api";
import type { JobCircular, LearningModule } from "@/lib/types";
import { OriginBadge, RecordTypeBadge } from "@/components/ui/Badges";
import { BookmarkButton } from "@/components/jobs/BookmarkButton";
import { AiPdfAnalyzer } from "@/components/jobs/AiPdfAnalyzer";

export const dynamic = "force-dynamic";

interface JobDetailResponse {
  job: JobCircular;
  relatedLessons: Array<
    Pick<LearningModule, "letter" | "stage" | "slug" | "title" | "titleBn" | "estimatedMinutes">
  >;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data: JobDetailResponse | null = null;
  try {
    data = await apiFetch<JobDetailResponse>(
      `/jobs/${encodeURIComponent(slug)}`,
      { revalidate: 20 }
    );
  } catch {
    data = null;
  }

  if (!data) {
    notFound();
  }

  const { job, relatedLessons } = data;
  const safePdfUrl = safeExternalHref(job.pdfUrl, "");
  const safeApplyUrl = safeExternalHref(job.applyUrl, "");

  return (
    <div className="app-container py-5 sm:py-6 space-y-5">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Circulars &amp; Notices</span>
      </Link>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <OriginBadge origin={job.origin} />
          <RecordTypeBadge type={job.recordType} />
          <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-700">
            {job.category}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
          {job.title}
        </h1>
        {job.titleBn && job.titleBn !== job.title && (
          <p className="text-sm sm:text-base font-semibold text-emerald-800">{job.titleBn}</p>
        )}

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {formatReadableText(job.summary)}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {safePdfUrl && (
            <a
              href={safePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Open Official PDF</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {safeApplyUrl && (
            <a
              href={safeApplyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
            >
              <span>Official Application / Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <BookmarkButton jobSlug={job.slug} />
        </div>
      </div>

      {/* Key Specs Grid */}
      <AiPdfAnalyzer
        slug={job.slug}
        hasPdf={Boolean(safePdfUrl)}
        initialExtraction={job.aiExtraction || null}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <Building2 className="h-4 w-4 text-emerald-700" />
            Organization
          </div>
          <p className="mt-1.5 text-sm font-bold text-slate-900">{job.organization}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <Wallet className="h-4 w-4 text-emerald-700" />
            Grade &amp; 2026 Pay Scale
          </div>
          <p className="mt-1.5 text-sm font-bold text-slate-900">{job.gradeRange}</p>
          <p className="text-xs text-slate-600">{job.payScale2026}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <Calendar className="h-4 w-4 text-rose-600" />
            Dates &amp; Deadline
          </div>
          <p className="mt-1.5 text-sm font-bold text-slate-900">
            Published: {formatNoticeDate(job.publishedDate, job.publishedDateRaw)}
          </p>
          <p className="text-xs font-semibold text-rose-700">
            Close:{" "}
            {formatNoticeDate(job.deadlineDate, job.deadlineRaw, "Check PDF")}
          </p>
          {(job.updatedAt || job.createdAt) && (
            <p className="mt-1 text-[11px] text-slate-500">
              Synced: {formatBdDateTime(job.updatedAt || job.createdAt)} BST
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            Age Limit &amp; Fee
          </div>
          <p className="mt-1.5 text-sm font-bold text-slate-900">{job.ageLimit}</p>
          <p className="text-xs text-slate-600">Fee: {job.applicationFee}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            Education &amp; Posts
          </div>
          <p className="mt-1.5 text-sm font-bold text-slate-900">
            {job.educationRequired}
          </p>
          <p className="text-xs text-slate-600">Vacancies: {job.vacancies}</p>
        </div>
      </div>

      {/* Highlights & Step-by-Step Guide */}
      <div className="grid gap-6 md:grid-cols-2">
        {job.highlights?.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Key Highlights &amp; Rules
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-700">
              {job.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{formatReadableText(h)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.applicationSteps?.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              How to Apply / Next Steps
            </h2>
            <ol className="space-y-2.5 text-sm text-slate-700 list-decimal list-inside">
              {job.applicationSteps.map((step) => (
                <li key={step} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Linked A-to-Z Learning Modules */}
      {relatedLessons.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-700" />
              Recommended A-to-Z Learning Modules for This Track
            </h2>
            <Link
              href="/learn"
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              All 26 Modules →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {relatedLessons.map((lesson) => (
              <Link
                key={lesson.slug}
                href={`/learn/${lesson.slug}`}
                className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-3.5 hover:border-emerald-500 transition-colors"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-sm font-extrabold text-white">
                  {lesson.letter}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{lesson.title}</p>
                  <p className="text-xs text-slate-500">
                    {lesson.stage} • {lesson.estimatedMinutes} min read
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
