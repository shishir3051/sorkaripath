import { Suspense } from "react";
import { apiFetch } from "@/lib/api";
import {
  JobsExplorer,
  type JobsResponse,
} from "@/components/jobs/JobsExplorer";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    recordType?: string;
    origin?: string;
  }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams({ page: "1", limit: "25" });
  if (sp.q?.trim()) params.set("q", sp.q.trim());
  if (sp.category && sp.category !== "All") params.set("category", sp.category);
  if (sp.recordType && sp.recordType !== "All") params.set("recordType", sp.recordType);
  if (sp.origin && sp.origin !== "All") params.set("origin", sp.origin);

  const [jobsResult, overviewResult] = await Promise.allSettled([
    apiFetch<JobsResponse>(`/jobs?${params.toString()}`),
    apiFetch<{ stats?: { enabledSources?: number } }>("/meta/overview"),
  ]);

  const initialData: JobsResponse | null =
    jobsResult.status === "fulfilled" ? jobsResult.value : null;
  // Read the portal count from the live sync config rather than hardcoding it,
  // so this copy cannot drift as sources are added or disabled.
  const sourceCount: number | null =
    overviewResult.status === "fulfilled"
      ? (overviewResult.value?.stats?.enabledSources ?? null)
      : null;

  return (
    <div className="app-container py-8 space-y-6">
      <div>
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          Live Circulars &amp; Official Notice Board
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
          Bangladesh Government Jobs &amp; Live Web Notices
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-3xl">
          Browse curated track blueprints alongside live circulars, exam schedules,
          and results pulled directly from{" "}
          {sourceCount ? `${sourceCount} ` : ""}official ministries, boards &amp;
          application portals (including BPSC, Bangladesh Bank BSC, Teletalk
          Alljobs, BDPost, DPE, NTRCA &amp; Railway) — enhanced with Gemini AI
          PDF extraction.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            Loading job explorer...
          </div>
        }
      >
        <JobsExplorer initialData={initialData} sourceCount={sourceCount} />
      </Suspense>
    </div>
  );
}
