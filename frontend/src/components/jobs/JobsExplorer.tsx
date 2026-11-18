"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Globe,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import {
  apiFetch,
  cachedApiFetch,
  formatBdDateTime,
  formatNoticeDate,
  formatReadableText,
  getCachedApiData,
  invalidateApiCache,
  safeExternalHref,
  setCachedApiData,
} from "@/lib/api";
import type { JobCircular } from "@/lib/types";
import { OriginBadge, RecordTypeBadge } from "@/components/ui/Badges";
import { openAiAssistantChat } from "@/components/jobs/AiCircularAssistant";

export interface JobsResponse {
  items: JobCircular[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  categories: string[];
  searchFallback?: "broad" | null;
  syncMeta?: {
    lastSyncAt?: string | null;
    isStale?: boolean;
    syncRunning?: boolean;
  };
}

const CATEGORIES = [
  "All",
  "BCS",
  "Bank & Financial",
  "Ministry & Directorate",
  "Teaching (Primary/NTRCA)",
  "Defense & Police",
  "Engineering & Technical",
  "Judicial & Legal",
  "General Notice",
];

const RECORD_TYPES = [
  { value: "All", label: "All Types" },
  { value: "circular", label: "Circulars" },
  { value: "exam_schedule", label: "Exam / Viva" },
  { value: "result", label: "Results" },
  { value: "admit_card", label: "Admit Cards" },
  { value: "notice", label: "Notices" },
];

export function JobsExplorer({
  initialData = null,
  sourceCount = null,
}: {
  initialData?: JobsResponse | null;
  sourceCount?: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [recordType, setRecordType] = useState(
    searchParams.get("recordType") || "All"
  );
  const [origin, setOrigin] = useState(searchParams.get("origin") || "All");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<JobsResponse | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [fetching, setFetching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncNotice, setSyncNotice] = useState("");
  const skippedFirstEffect = useRef(Boolean(initialData));
  const autoSyncedRef = useRef(false);
  const mountedRef = useRef(true);
  const fetchJobsRef = useRef<() => Promise<void>>(async () => {});

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category !== "All") params.set("category", category);
    if (recordType !== "All") params.set("recordType", recordType);
    if (origin !== "All") params.set("origin", origin);
    params.set("page", String(page));
    params.set("limit", "25");
    return params.toString();
  }, [q, category, recordType, origin, page]);

  const fetchJobs = useCallback(
    async (forceFresh = false) => {
      const apiPath = `/jobs?${buildParams()}`;
      if (forceFresh) {
        invalidateApiCache("/jobs");
      } else {
        const cached = getCachedApiData<JobsResponse>(apiPath);
        if (cached) {
          setData(cached);
          setLoading(false);
          setError("");
          return;
        }
      }

      setFetching(true);
      setError("");
      try {
        const res = await cachedApiFetch<JobsResponse>(apiPath, 30_000);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load circulars");
      } finally {
        setLoading(false);
        setFetching(false);
      }
    },
    [buildParams]
  );

  useEffect(() => {
    const apiPath = `/jobs?${buildParams()}`;
    if (skippedFirstEffect.current) {
      skippedFirstEffect.current = false;
      if (initialData) {
        setCachedApiData(apiPath, initialData, 30_000);
      }
      return;
    }

    let active = true;
    const cached = getCachedApiData<JobsResponse>(apiPath);
    if (cached) {
      queueMicrotask(() => {
        if (!active) return;
        setData(cached);
        setError("");
        setLoading(false);
        setFetching(false);
      });
      return () => {
        active = false;
      };
    }

    queueMicrotask(() => {
      if (active) setFetching(true);
    });
    cachedApiFetch<JobsResponse>(apiPath, 30_000)
      .then((res) => {
        if (!active) return;
        setError("");
        setData(res);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load circulars");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setFetching(false);
        }
      });

    return () => {
      active = false;
    };
  }, [buildParams, initialData]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchJobsRef.current = () => fetchJobs(true);
  }, [fetchJobs]);

  useEffect(() => {
    if (autoSyncedRef.current || !data?.syncMeta?.isStale) return;
    autoSyncedRef.current = true;

    const timer = setTimeout(async () => {
      if (!mountedRef.current) return;
      setSyncing(true);
      try {
        const res = await apiFetch<{
          log?: { totalFetched: number; newInserted: number };
        }>("/sync/run", { method: "POST", body: JSON.stringify({}) });
        if (!mountedRef.current) return;
        const fresh = res.log?.newInserted ?? 0;
        if (fresh > 0) {
          setSyncNotice(
            `Auto-synced ${fresh} new live notice(s) from official portals.`
          );
          invalidateApiCache("/meta");
          router.refresh();
        }
        await fetchJobsRef.current();
      } catch {
        // Silently ignore cooldown (429) or transient background auto-sync errors
      } finally {
        if (mountedRef.current) setSyncing(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [data?.syncMeta?.isStale, router]);

  function resetAllFilters() {
    setQ("");
    setCategory("All");
    setRecordType("All");
    setOrigin("All");
    setPage(1);
  }

  async function handleQuickSync() {
    setSyncing(true);
    setSyncNotice("");
    try {
      const res = await apiFetch<{
        log?: { totalFetched: number; newInserted: number };
      }>("/sync/run", { method: "POST", body: JSON.stringify({}) });
      setSyncNotice(
        `Live sync finished: checked official portals, fetched ${
          res.log?.totalFetched ?? 0
        } items (${res.log?.newInserted ?? 0} new).`
      );
      setPage(1);
      invalidateApiCache("/jobs");
      invalidateApiCache("/meta");
      router.refresh();
      await fetchJobs(true);
    } catch (err) {
      setSyncNotice(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Live Sync Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search Bangla or English titles, BPSC, SPCBL, Bank, DGHS, Railway..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap sm:inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {[
                { val: "All", label: "All Sources" },
                { val: "web_sync", label: "Live Web Sync" },
                { val: "curated", label: "Curated Tracks" },
              ].map((tab) => (
                <button
                  key={tab.val}
                  type="button"
                  onClick={() => {
                    setOrigin(tab.val);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
                    origin === tab.val
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleQuickSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing Web..." : "Grab Latest from Web"}</span>
            </button>

            {q.trim().length >= 2 && (
              <button
                type="button"
                onClick={() => openAiAssistantChat(q.trim())}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Ask AI</span>
              </button>
            )}
          </div>
        </div>

        {syncNotice && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-semibold text-emerald-900">
            {syncNotice}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 mr-1">
              <Filter className="h-3.5 w-3.5" /> Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  category === cat
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Type:</span>
            {RECORD_TYPES.map((rt) => (
              <button
                key={rt.value}
                type="button"
                onClick={() => {
                  setRecordType(rt.value);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  recordType === rt.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 gap-2 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
          <span>Loading latest circulars &amp; official notices...</span>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          {error}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center space-y-4">
          <Briefcase className="mx-auto h-8 w-8 text-slate-400" />
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-800">
              No matching circulars or notices found
            </p>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Try shorter bilingual keywords (e.g. &ldquo;Post Office&rdquo;,
              &ldquo;DPE&rdquo;, &ldquo;Railway&rdquo;, &ldquo;ডাক&rdquo;),
              clear active filters, or check portals with browser-only access
              directly below.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {q.trim().length >= 2 && (
              <button
                type="button"
                onClick={() => openAiAssistantChat(q.trim())}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask Gemini AI Instead</span>
              </button>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Clear Search &amp; Filters
            </button>
            <a
              href={safeExternalHref("https://alljobs.teletalk.com.bd/")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
            >
              <span>AllJobs Teletalk</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={safeExternalHref("https://bdjobs.com/h/")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              <span>Bdjobs Govt Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                Showing{" "}
                {(data.pagination.page - 1) * data.pagination.limit + 1}–
                {(data.pagination.page - 1) * data.pagination.limit +
                  data.items.length}{" "}
                of {data.pagination.total} official records (newest first)
              </span>
              {data.syncMeta?.lastSyncAt && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  Last Auto-Sync: {formatBdDateTime(data.syncMeta.lastSyncAt)}
                </span>
              )}
              {data.searchFallback === "broad" && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                  Broad keyword matches shown
                </span>
              )}
            </div>
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
          </div>

          <div
            className={`grid gap-4 xl:grid-cols-2 transition-opacity duration-150 ${
              fetching ? "opacity-60" : "opacity-100"
            }`}
          >
            {data.items.map((job) => (
              <article
                key={job._id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-400 transition-all"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <OriginBadge origin={job.origin} />
                    <RecordTypeBadge type={job.recordType} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                      {job.category}
                    </span>
                    {job.gradeRange && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        {job.gradeRange}
                      </span>
                    )}
                    <div className="ml-auto flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                        Published: {formatNoticeDate(job.publishedDate, job.publishedDateRaw)}
                      </span>
                      {(job.updatedAt || job.createdAt) && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          Synced: {formatBdDateTime(job.updatedAt || job.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/jobs/${job.slug}`}
                    className="block text-base sm:text-lg font-extrabold text-slate-900 hover:text-emerald-700 leading-snug"
                  >
                    {job.title}
                  </Link>

                  <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">
                    {formatReadableText(job.summary)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex flex-wrap items-center gap-4 text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                      {job.organization}
                    </span>
                    {(job.deadlineDate || job.deadlineRaw) && (
                      <span className="font-semibold text-rose-700">
                        Deadline:{" "}
                        {formatNoticeDate(
                          job.deadlineDate,
                          job.deadlineRaw,
                          "Check official attachment"
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {safeExternalHref(job.pdfUrl, "") ? (
                      <a
                        href={safeExternalHref(job.pdfUrl, "")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Official PDF</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : safeExternalHref(job.applyUrl || job.detailUrl, "") ? (
                      <a
                        href={safeExternalHref(job.applyUrl || job.detailUrl, "")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-emerald-700 hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Official Portal</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                    <Link
                      href={`/jobs/${job.slug}`}
                      className="rounded-lg bg-slate-900 px-3.5 py-1.5 font-bold text-white hover:bg-emerald-700 transition-colors"
                    >
                      View A–Z Guide →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-600 px-2">
                {page} / {data.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.pagination.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}

          {/* Direct Links for Aggregators & External Boards */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="flex items-start gap-2.5">
              <Globe className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Official Application Portals &amp; Aggregators
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  We auto-sync {sourceCount ? `${sourceCount} ` : ""}official
                  ministries, boards &amp; application portals live (including BPSC,
                  Bangladesh Bank BSC, Teletalk Alljobs, BDPost, DPE, NTRCA, LGED,
                  PWD &amp; Railway). Open the central application portals below when
                  submitting forms:
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              {[
                { name: "AllJobs by Teletalk (Central Portal)", url: "https://alljobs.teletalk.com.bd/" },
                { name: "Bdjobs — Govt Jobs & Career Portal", url: "https://bdjobs.com/h/" },
                { name: "BPSC Teletalk Application Portal", url: "https://bpsc.teletalk.com.bd/" },
                { name: "Bangladesh Bank e-Recruitment", url: "https://erecruitment.bb.org.bd/" },
                { name: "BJSC — Judicial Service Commission", url: "https://bjsc.gov.bd/site/view/notices" },
                { name: "BMET — Manpower & Training Bureau", url: "https://bmet.gov.bd/site/view/notices" },
              ].map((ext) => (
                <a
                  key={ext.url}
                  href={safeExternalHref(ext.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-semibold text-slate-800 hover:border-emerald-500 hover:text-emerald-800 transition-colors"
                >
                  <span className="truncate">{ext.name}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
