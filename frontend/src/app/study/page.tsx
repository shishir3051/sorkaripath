import { Suspense } from "react";
import type { StudyOverviewData } from "@/lib/types";
import { StudyHub } from "@/components/study/StudyHub";
import { requireServerUser, serverApiFetch } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  await requireServerUser("/study");

  let initialData: StudyOverviewData | null = null;
  try {
    initialData = await serverApiFetch<StudyOverviewData>("/study/overview");
  } catch {
    initialData = null;
  }

  return (
    <div className="app-container py-8 space-y-6">
      <div>
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          Study Hub: {initialData?.stats?.topicsCount ?? 50} Lecture Sheets, Written &amp; Typing Lab, AI Tutor &amp; {initialData?.stats?.mcqCount ?? 814}+ Solved MCQs
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
          BD Govt Exam Study Hub — Batches, Topic Guru, Written/Viva &amp; Mocks
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-3xl">
          Study complete 9-subject lecture sheets, practice Written reports/translations,
          live EN/বাংলা Typing WPM tests &amp; Viva Voce Q&amp;A, follow 30-day routines,
          and launch timed model tests.
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
