"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PlusCircle,
  Radio,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  apiFetch,
  cachedApiFetch,
  formatBdDateTime,
  getCachedApiData,
  invalidateApiCache,
  safeExternalHref,
} from "@/lib/api";
import type { SyncLog, WebSource } from "@/lib/types";

interface SyncStatusResponse {
  syncRunning: boolean;
  sources: WebSource[];
  logs: SyncLog[];
}

export function LiveSyncConsole() {
  const router = useRouter();
  const [status, setStatus] = useState<SyncStatusResponse | null>(() =>
    getCachedApiData<SyncStatusResponse>("/sync/status")
  );
  const [loading, setLoading] = useState(
    () => getCachedApiData<SyncStatusResponse>("/sync/status") === null
  );
  const [syncingKey, setSyncingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Admin publish circular state
  const [showPublisher, setShowPublisher] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [category, setCategory] = useState("Ministry & Directorate");
  const [gradeRange, setGradeRange] = useState("Grade 9-16");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [applyUrl, setApplyUrl] = useState("https://alljobs.teletalk.com.bd/");
  const [summary, setSummary] = useState("");
  const [publishing, setPublishing] = useState(false);

  const loadStatus = useCallback(async (forceFresh = false) => {
    if (forceFresh) {
      invalidateApiCache("/sync/status");
    } else if (!getCachedApiData<SyncStatusResponse>("/sync/status")) {
      setLoading(true);
    }
    try {
      const data = forceFresh
        ? await apiFetch<SyncStatusResponse>("/sync/status")
        : await cachedApiFetch<SyncStatusResponse>("/sync/status", 20_000);
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sync status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    cachedApiFetch<SyncStatusResponse>("/sync/status", 20_000)
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load sync status");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function triggerSync(sourceKey: string | null) {
    setSyncingKey(sourceKey || "ALL");
    setMessage("");
    setError("");
    try {
      const res = await apiFetch<{
        status: string;
        log: SyncLog;
      }>("/sync/run", {
        method: "POST",
        body: JSON.stringify(sourceKey ? { sourceKey } : {}),
      });
      setMessage(
        `Sync (${res.status}) completed in ${res.log.durationMs}ms — checked ${res.log.sourcesChecked} source(s), fetched ${res.log.totalFetched} notices, inserted ${res.log.newInserted} new.`
      );
      invalidateApiCache("/jobs");
      invalidateApiCache("/meta");
      await loadStatus(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Live sync failed");
    } finally {
      setSyncingKey(null);
    }
  }

  async function handlePublishCircular(e: React.FormEvent) {
    e.preventDefault();
    setPublishing(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/jobs", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: JSON.stringify({
          title,
          organization,
          category,
          gradeRange,
          deadlineDate: deadlineDate || null,
          deadlineRaw: deadlineDate || "Check Circular",
          applyUrl,
          summary,
          recordType: "circular",
          isFeatured: true,
        }),
      });
      setMessage("Custom circular published to MongoDB successfully!");
      invalidateApiCache("/jobs");
      invalidateApiCache("/meta");
      router.refresh();
      setTitle("");
      setOrganization("");
      setSummary("");
      setShowPublisher(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish circular");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Control Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-950 to-teal-900 p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <Radio className="h-4 w-4 animate-pulse" />
            Automated Live Web Ingestion Engine (Cron + Manual)
          </div>
          <h2 className="text-xl font-extrabold">
            Official Bangladesh Government &amp; Bank Sources
          </h2>
          <p className="text-xs text-emerald-100/80">
            Politely fetches public HTML notice tables, normalizes Bangla &amp;
            English dates, deduplicates via SHA-256 hash, and stores in MongoDB.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setShowPublisher((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/25 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{showPublisher ? "Close Publisher" : "Publish Circular"}</span>
          </button>
          <button
            type="button"
            onClick={() => triggerSync(null)}
            disabled={syncingKey !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-300 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw
              className={`h-4 w-4 ${syncingKey === "ALL" ? "animate-spin" : ""}`}
            />
            <span>{syncingKey === "ALL" ? "Syncing All..." : "Sync All Sources Now"}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
          {error}
        </div>
      )}

      {/* Optional Admin Circular Publisher */}
      {showPublisher && (
        <form
          onSubmit={handlePublishCircular}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Admin: Publish Curated Circular
            </h3>
            <span className="text-xs text-slate-500">
              Protected by <code className="font-mono">x-admin-key</code> header
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="password"
              required
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin API Key (configured in server/.env)"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            />
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Circular Title (e.g., 51st BCS Recruitment Circular)"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            />
            <input
              type="text"
              required
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Organization (e.g., Bangladesh Public Service Commission)"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            >
              <option value="BCS">BCS</option>
              <option value="Bank & Financial">Bank &amp; Financial</option>
              <option value="Ministry & Directorate">Ministry &amp; Directorate</option>
              <option value="Teaching (Primary/NTRCA)">Teaching (Primary/NTRCA)</option>
              <option value="Defense & Police">Defense &amp; Police</option>
              <option value="Engineering & Technical">Engineering &amp; Technical</option>
            </select>
            <input
              type="text"
              value={gradeRange}
              onChange={(e) => setGradeRange(e.target.value)}
              placeholder="Grade Range (e.g., Grade 9)"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            />
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            />
          </div>

          <input
            type="url"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            placeholder="Official Apply URL"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
          />
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summary of vacancies, qualification & key dates..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={publishing}
            className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 cursor-pointer"
          >
            {publishing ? "Publishing..." : "Save Circular to MongoDB"}
          </button>
        </form>
      )}

      {/* Configured Sources Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-slate-500 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
          <span>Loading source health monitors...</span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(status?.sources || []).map((src) => (
            <div
              key={src._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                      {src.adapterType}
                    </span>
                    <h3 className="mt-1.5 text-base font-extrabold text-slate-900">
                      {src.name}
                    </h3>
                    <p className="text-xs text-slate-500">{src.organization}</p>
                  </div>
                  {src.lastStatus === "success" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
                    </span>
                  ) : src.lastStatus === "error" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                      <XCircle className="h-3.5 w-3.5" /> Error
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                      Idle
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5">
                  {src.lastMessage}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="text-slate-500">
                  Last Sync: <strong>{formatBdDateTime(src.lastSyncAt, "Never")}</strong>{" "}
                  • Total: <strong>{src.totalItemsSynced}</strong>
                </div>
                <div className="flex items-center gap-3">
                  {safeExternalHref(src.url, "") && (
                    <a
                      href={safeExternalHref(src.url, "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-emerald-700"
                    >
                      <span>Portal</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => triggerSync(src.key)}
                    disabled={syncingKey !== null}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${
                        syncingKey === src.key ? "animate-spin" : ""
                      }`}
                    />
                    <span>Sync</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Sync Audit Logs */}
      {status && status.logs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-700" />
            Sync Audit Logs
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-2 pr-4">Finished</th>
                  <th className="py-2 pr-4">Trigger</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Sources</th>
                  <th className="py-2 pr-4">Fetched</th>
                  <th className="py-2 pr-4">New</th>
                  <th className="py-2">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {status.logs.map((log) => (
                  <tr key={log._id}>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {formatBdDateTime(log.finishedAt)}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold uppercase text-slate-700">
                      {log.triggeredBy}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${
                          log.status === "success"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">{log.sourcesChecked}</td>
                    <td className="py-2.5 pr-4">{log.totalFetched}</td>
                    <td className="py-2.5 pr-4 font-bold text-emerald-700">
                      +{log.newInserted}
                    </td>
                    <td className="py-2.5 font-mono text-slate-500">
                      {(log.durationMs / 1000).toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
