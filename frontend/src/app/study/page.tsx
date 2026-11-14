import { Suspense } from "react";
import { apiFetch } from "@/lib/api";
import type { StudyOverviewData } from "@/lib/types";
import { StudyHub } from "@/components/study/StudyHub";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  let initialData: StudyOverviewData | null = null;
  try {
    initialData = await apiFetch<StudyOverviewData>("/study/overview");
  } catch {
    initialData = null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          Study Hub: 30 Lecture Sheets, Course Batches, AI Tutor &amp; 216+ MCQs
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
          BD Govt Exam Study Hub — Batches, Topic Guru, AI Mentor &amp; Mocks
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-3xl">
          Study complete 9-subject lecture sheets, follow structured Course Batches &amp;
          30-day routines, ask Gemini AI for instant explanations or fresh MCQs, browse free
          official PDFs &amp; current affairs, and launch timed model tests.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading Study Hub...
          </div>
        }
      >
        <StudyHub initialData={initialData} />
      </Suspense>
    </div>
  );
}
