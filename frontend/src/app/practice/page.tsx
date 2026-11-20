import { Suspense } from "react";
import { PracticeArena } from "@/components/practice/PracticeArena";
import { requireServerUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  await requireServerUser("/practice");
  return (
    <div className="app-container py-5 sm:py-6 space-y-5">
      <div>
        <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-800">
          Interactive Exam Simulator
        </span>
        <h1 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          MCQ Practice &amp; BCS Mock Arena
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Drill BCS Preliminary, Bank Combined, Primary Teacher, Grade 11–20, and
          2026 Govt Rules questions with real -0.50 negative marking and instant
          explanations.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading MCQ Practice Arena...
          </div>
        }
      >
        <PracticeArena />
      </Suspense>
    </div>
  );
}
