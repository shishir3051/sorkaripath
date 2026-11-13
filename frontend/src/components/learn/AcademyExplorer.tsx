"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Search,
  Sparkles,
} from "lucide-react";
import { apiFetch, getOrCreateSessionId } from "@/lib/api";
import type { LearnerProgress, LearningModule } from "@/lib/types";

const STAGES = [
  "All",
  "Foundations (A-E)",
  "Rules & Pay Scale (F-J)",
  "Applications & Exams (K-O)",
  "Major Tracks (P-T)",
  "Subject & Viva Mastery (U-Z)",
];

export function AcademyExplorer({ modules }: { modules: LearningModule[] }) {
  const [stage, setStage] = useState("All");
  const [query, setQuery] = useState("");
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);

  useEffect(() => {
    const sid = getOrCreateSessionId();
    apiFetch<LearnerProgress>(`/progress/${encodeURIComponent(sid)}`)
      .then((p) => setCompletedSlugs(p.completedLessonSlugs || []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return modules.filter((m) => {
      if (stage !== "All" && m.stage !== stage) return false;
      if (!q) return true;
      return (
        m.letter.toLowerCase() === q ||
        m.title.toLowerCase().includes(q) ||
        (m.titleBn || "").toLowerCase().includes(q) ||
        (m.subtitle || "").toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q)
      );
    });
  }, [modules, stage, query]);

  const progressPercent =
    modules.length > 0
      ? Math.round((completedSlugs.length / modules.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Progress & Filter Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="inline-flex items-center gap-1.5 text-emerald-800">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Your A-to-Z Mastery Progress
              </span>
              <span>
                {completedSlugs.length} / {modules.length} Modules ({progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="relative md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topic (e.g. Teletalk, Quota, Viva, 2026)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Alphabet Quick Jump */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {modules.map((m) => {
            const done = completedSlugs.includes(m.slug);
            return (
              <Link
                key={m.slug}
                href={`/learn/${m.slug}`}
                title={`${m.letter}: ${m.title}`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold transition-colors ${
                  done
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-900"
                }`}
              >
                {m.letter}
              </Link>
            );
          })}
        </div>

        {/* Stage Tabs */}
        <div className="flex flex-wrap gap-2">
          {STAGES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStage(st)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                stage === st
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mod) => {
          const isDone = completedSlugs.includes(mod.slug);
          return (
            <Link
              key={mod.slug}
              href={`/learn/${mod.slug}`}
              className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                isDone
                  ? "border-emerald-300 bg-emerald-50/40"
                  : "border-slate-200 bg-white hover:border-emerald-400"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-lg font-extrabold text-white shadow-sm">
                    {mod.letter}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isDone && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      {mod.difficulty}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  {mod.stage}
                </p>
                <h2 className="mt-1 text-base font-extrabold text-slate-900 group-hover:text-emerald-700 leading-snug">
                  {mod.title}
                </h2>
                {mod.titleBn && (
                  <p className="mt-0.5 text-xs font-semibold text-slate-600">
                    {mod.titleBn}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {mod.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {mod.estimatedMinutes} min
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                  <BookOpen className="h-3.5 w-3.5" />
                  Read Module →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
