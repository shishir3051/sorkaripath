"use client";

import Link from "next/link";
import { useCallback, useImperativeHandle, useState, type Ref } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  apiFetch,
  formatNoticeDate,
  safeExternalHref,
} from "@/lib/api";
import { OriginBadge, RecordTypeBadge } from "@/components/ui/Badges";
import type { JobOrigin, RecordType } from "@/lib/types";

interface MatchedAiCircular {
  _id: string;
  slug: string;
  title: string;
  titleBn?: string;
  origin: JobOrigin;
  recordType: RecordType;
  category: string;
  organization: string;
  organizationShort: string;
  publishedDate: string;
  publishedDateRaw?: string;
  deadlineDate?: string | null;
  deadlineRaw?: string;
  vacancies: string;
  applicationFee: string;
  applyUrl?: string;
  pdfUrl?: string;
  aiExtracted?: boolean;
}

interface AiDiscoverResponse {
  query: string;
  answerEn: string;
  answerBn?: string;
  highlights: string[];
  matchedCirculars: MatchedAiCircular[];
  followUpQueries: string[];
  meta: {
    modelUsed: string;
    keySlotUsed?: number;
    totalKeys?: number;
    groundedCount: number;
    sourcesRefreshed: number;
    checkedSourceNames: string[];
    generatedAt: string;
  };
  cached?: boolean;
}

const PRESET_PROMPTS = [
  "Bangladesh Post Office circular fee, posts & deadline",
  "Latest BD govt job circulars published right now",
  "Primary Assistant Teacher / NTRCA latest notices",
  "DG Food, LGED & Bangladesh Railway recent circulars",
];

export interface AiCircularAssistantHandle {
  ask: (query: string) => void;
}

export function AiCircularAssistant({
  ref,
}: {
  ref?: Ref<AiCircularAssistantHandle>;
}) {
  const [aiQuery, setAiQuery] = useState("");
  const [liveRefresh, setLiveRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiDiscoverResponse | null>(null);

  const runDiscover = useCallback(
    async (text: string, refresh = liveRefresh) => {
      const clean = text.trim();
      if (clean.length < 2) {
        setError("Enter at least 2 characters to ask Gemini AI.");
        return;
      }

      setAiQuery(clean);
      setLoading(true);
      setError("");

      try {
        const res = await apiFetch<AiDiscoverResponse>("/ai/discover", {
          method: "POST",
          body: JSON.stringify({ query: clean, liveRefresh: refresh }),
        });
        setResult(res);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to run Gemini AI search"
        );
      } finally {
        setLoading(false);
      }
    },
    [liveRefresh]
  );

  useImperativeHandle(
    ref,
    () => ({
      ask: (queryText: string) => {
        void runDiscover(queryText, true);
      },
    }),
    [runDiscover]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runDiscover(aiQuery, liveRefresh);
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Gemini AI Live Circular Assistant
              </h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                Gemini 4 + Live .gov.bd Web
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Ask anything about Bangladesh govt circulars — AI refreshes matching{" "}
              <code>.gov.bd</code> notice boards live and reads attached circular PDFs when needed.
            </p>
          </div>
        </div>

        <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={liveRefresh}
            onChange={(e) => setLiveRefresh(e.target.checked)}
            className="accent-emerald-700"
          />
          <Globe className="h-3.5 w-3.5 text-emerald-700" />
          <span>Check Live Web First</span>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          placeholder="Ask e.g. 'Bangladesh Post Office circular fee, posts & deadline' or 'Latest circulars this week'"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching Live Web &amp; AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Find with Gemini AI</span>
            </>
          )}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-500 mr-1">Try asking:</span>
        {PRESET_PROMPTS.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={loading}
            onClick={() => runDiscover(preset, liveRefresh)}
            className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100/70 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {preset}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-white">
                Model: {result.meta.modelUsed}
              </span>
              {(result.meta.totalKeys ?? 0) > 1 && result.meta.keySlotUsed && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-indigo-800">
                  Key #{result.meta.keySlotUsed}/{result.meta.totalKeys}
                </span>
              )}
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800">
                Grounded on {result.meta.groundedCount} live records
              </span>
              {result.meta.sourcesRefreshed > 0 && (
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-teal-800">
                  Freshly checked: {result.meta.checkedSourceNames.join(", ")}
                </span>
              )}
              {result.cached && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                  Cached
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {result.answerEn}
            </p>
            {result.answerBn && (
              <p className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-3.5 py-2.5 text-xs sm:text-sm text-emerald-950 leading-relaxed">
                {result.answerBn}
              </p>
            )}
          </div>

          {result.highlights?.length > 0 && (
            <ul className="space-y-1.5 text-xs text-slate-700">
              {result.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}

          {result.matchedCirculars?.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Matched Official Circulars &amp; Notices
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {result.matchedCirculars.map((item) => {
                  const safePdf = safeExternalHref(item.pdfUrl, "");
                  return (
                    <div
                      key={item._id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex flex-col justify-between gap-2.5"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <OriginBadge origin={item.origin} />
                          <RecordTypeBadge type={item.recordType} />
                          {item.organizationShort && (
                            <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {item.organizationShort}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/jobs/${item.slug}`}
                          className="block text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        <p className="text-[11px] text-slate-500">
                          Published:{" "}
                          {formatNoticeDate(item.publishedDate, item.publishedDateRaw)}
                          {item.vacancies &&
                          item.vacancies !== "See Official Circular"
                            ? ` • Posts: ${item.vacancies}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Link
                          href={`/jobs/${item.slug}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800"
                        >
                          <span>
                            {item.aiExtracted ? "View AI Details" : "Read PDF with AI"}
                          </span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                        {safePdf && (
                          <a
                            href={safePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                          >
                            <FileText className="h-3 w-3 text-rose-600" />
                            <span>Official PDF</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.followUpQueries?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 mr-1">
                Follow-up:
              </span>
              {result.followUpQueries.map((fq) => (
                <button
                  key={fq}
                  type="button"
                  disabled={loading}
                  onClick={() => runDiscover(fq, false)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 cursor-pointer"
                >
                  {fq}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
