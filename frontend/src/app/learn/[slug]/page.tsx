import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  Clock,
  ExternalLink,
  Lightbulb,
  Target,
} from "lucide-react";
import type { LearningModule } from "@/lib/types";
import { LessonCompleteButton } from "@/components/learn/LessonCompleteButton";
import { requireServerUser, serverApiFetch } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

interface LessonDetailResponse {
  lesson: LearningModule;
  prevLesson: { letter: string; slug: string; title: string } | null;
  nextLesson: { letter: string; slug: string; title: string } | null;
  relatedMcqCount: number;
}

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireServerUser(`/learn/${slug}`);

  let data: LessonDetailResponse | null = null;
  try {
    data = await serverApiFetch<LessonDetailResponse>(
      `/learn/${encodeURIComponent(slug)}`
    );
  } catch {
    data = null;
  }

  if (!data) {
    notFound();
  }

  const { lesson, prevLesson, nextLesson, relatedMcqCount } = data;

  return (
    <div className="app-container py-8 space-y-8">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to A-to-Z Academy</span>
      </Link>

      {/* Module Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-xl font-extrabold text-white">
            {lesson.letter}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              {lesson.stage} • Updated {lesson.updatedForYear}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {lesson.estimatedMinutes} min read
              </span>
              <span>•</span>
              <span>{lesson.difficulty}</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {lesson.title}
        </h1>
        {lesson.titleBn && (
          <p className="text-base font-bold text-emerald-800">{lesson.titleBn}</p>
        )}
        {lesson.subtitle && (
          <p className="text-sm font-medium text-slate-500">{lesson.subtitle}</p>
        )}
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
          {lesson.summary}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <LessonCompleteButton lessonSlug={lesson.slug} />
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
          >
            <Target className="h-4 w-4" />
            <span>
              Practice Related MCQs ({relatedMcqCount > 0 ? relatedMcqCount : "Arena"})
            </span>
          </Link>
        </div>
      </div>

      {/* Sections */}
      <div className="grid gap-5 xl:grid-cols-2">
        {(lesson.sections || []).map((sec) => (
          <section
            key={sec.heading}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3"
          >
            <h2 className="text-lg font-extrabold text-slate-900">
              {sec.heading}
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {sec.body}
            </p>

            {sec.bullets?.length > 0 && (
              <ul className="space-y-2 pt-1 text-sm text-slate-700">
                {sec.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {sec.tip && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs sm:text-sm text-amber-950">
                <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Senior Mentor Tip:</strong> {sec.tip}
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Action Checklist & Official Links */}
      <div className="grid gap-5 md:grid-cols-2">
        {lesson.checklist?.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-emerald-700" />
              Action Checklist
            </h3>
            <ul className="space-y-2 text-sm text-slate-800">
              {lesson.checklist.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lesson.officialLinks && lesson.officialLinks.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Official Reference Portals
            </h3>
            <div className="space-y-2">
              {lesson.officialLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Prev / Next Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
        {prevLesson ? (
          <Link
            href={`/learn/${prevLesson.slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-emerald-400"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-700" />
            <span>
              {prevLesson.letter}: {prevLesson.title}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {nextLesson && (
          <Link
            href={`/learn/${nextLesson.slug}`}
            className="inline-flex items-center justify-end gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-emerald-400"
          >
            <span>
              {nextLesson.letter}: {nextLesson.title}
            </span>
            <ArrowRight className="h-4 w-4 text-emerald-700" />
          </Link>
        )}
      </div>
    </div>
  );
}
