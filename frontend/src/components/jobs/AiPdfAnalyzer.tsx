"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  apiFetch,
  formatBdDateTime,
  safeExternalHref,
} from "@/lib/api";
import type { AiCircularExtraction } from "@/lib/types";

interface AnalyzeResponse {
  aiExtraction: AiCircularExtraction;
  cached: boolean;
  sourceMode: string;
  modelUsed: string;
  keySlotUsed?: number;
  totalKeys?: number;
}

export function AiPdfAnalyzer({
  slug,
  hasPdf,
  initialExtraction,
}: {
  slug: string;
  hasPdf: boolean;
  initialExtraction?: AiCircularExtraction | null;
}) {
  const router = useRouter();
  const [extraction, setExtraction] = useState<AiCircularExtraction | null>(
    initialExtraction?.extractedAt ? initialExtraction : null
  );
  const [keyMeta, setKeyMeta] = useState<{ slot: number; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAnalyze(forceRefresh = false) {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<AnalyzeResponse>(
        `/ai/circulars/${encodeURIComponent(slug)}/analyze`,
        {
          method: "POST",
          body: JSON.stringify({ forceRefresh }),
        }
      );
      setExtraction(res.aiExtraction);
      if ((res.totalKeys ?? 0) > 1 && res.keySlotUsed) {
        setKeyMeta({ slot: res.keySlotUsed, total: res.totalKeys ?? 1 });
      } else {
        setKeyMeta(null);
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not analyze circular with Gemini AI"
      );
    } finally {
      setLoading(false);
    }
  }

  const safeApplyPortal = safeExternalHref(extraction?.applyWebsite, "");

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <FileSearch className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                Gemini AI Circular &amp; PDF Extractor
              </h2>
              {extraction?.modelUsed && (
                <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  {extraction.modelUsed}
                </span>
              )}
              {keyMeta && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
                  Key #{keyMeta.slot}/{keyMeta.total}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {extraction?.extractedAt
                ? `Extracted details on ${formatBdDateTime(extraction.extractedAt)} BST directly from official attachment/notice.`
                : hasPdf
                ? "Let Gemini AI read the official PDF to extract total vacancies, post names, age rules, application fee, deadline & apply website."
                : "Let Gemini AI summarize the official notice and verify available application guidelines."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => runAnalyze(Boolean(extraction?.extractedAt))}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Reading Official PDF...</span>
            </>
          ) : extraction?.extractedAt ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Re-analyze Official PDF</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>
                {hasPdf ? "Read Official PDF with AI" : "Summarize Notice with AI"}
              </span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {extraction?.extractedAt && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          {extraction.summaryEn && (
            <p className="text-sm text-slate-800 leading-relaxed">
              {extraction.summaryEn}
            </p>
          )}
          {extraction.summaryBn && (
            <p className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-3.5 py-2.5 text-xs sm:text-sm text-emerald-950 leading-relaxed">
              {extraction.summaryBn}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            {extraction.totalVacancies && (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="font-bold uppercase text-slate-500">Total Posts</p>
                <p className="mt-1 font-extrabold text-slate-900 text-sm">
                  {extraction.totalVacancies}
                </p>
              </div>
            )}
            {(extraction.applyStartDate || extraction.applyDeadline) && (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="font-bold uppercase text-slate-500">Apply Window</p>
                <p className="mt-1 font-bold text-slate-900">
                  {extraction.applyStartDate ? `Starts: ${extraction.applyStartDate}` : ""}
                </p>
                {extraction.applyDeadline && (
                  <p className="font-bold text-rose-700">
                    Deadline: {extraction.applyDeadline}
                  </p>
                )}
              </div>
            )}
            {extraction.applicationFee && (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="font-bold uppercase text-slate-500">Application Fee</p>
                <p className="mt-1 font-bold text-slate-900">
                  {extraction.applicationFee}
                </p>
              </div>
            )}
            {extraction.ageRequirement && (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="font-bold uppercase text-slate-500">Age Requirement</p>
                <p className="mt-1 font-bold text-slate-900">
                  {extraction.ageRequirement}
                </p>
              </div>
            )}
            {extraction.educationSummary && (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 sm:col-span-2">
                <p className="font-bold uppercase text-slate-500">Education</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {extraction.educationSummary}
                </p>
              </div>
            )}
          </div>

          {safeApplyPortal && (
            <div>
              <a
                href={safeApplyPortal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <span>Open Extracted Apply Portal ({safeApplyPortal})</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {extraction.positions && extraction.positions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase text-slate-500">
                Key Positions Mentioned
              </p>
              <div className="flex flex-wrap gap-1.5">
                {extraction.positions.map((pos) => (
                  <span
                    key={pos}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800"
                  >
                    {pos}
                  </span>
                ))}
              </div>
            </div>
          )}

          {extraction.keyInstructions && extraction.keyInstructions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase text-slate-500">
                Extracted Official Instructions
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {extraction.keyInstructions.map((inst) => (
                  <li key={inst} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
