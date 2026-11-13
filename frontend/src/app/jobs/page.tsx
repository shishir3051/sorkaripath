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

  let initialData: JobsResponse | null = null;
  try {
    initialData = await apiFetch<JobsResponse>(`/jobs?${params.toString()}`);
  } catch {
    initialData = null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          Live Circulars &amp; Official Notice Board
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
          Bangladesh Government Jobs &amp; Live Web Notices
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-3xl">
          Browse curated track blueprints alongside live circulars, exam schedules,
          and results pulled directly from 20+ official ministries &amp; boards (BPSC,
          Bangladesh Bank BSC, MOPA, MoF, DSHE, MoHA, MoD, DGHS &amp; Railway).
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            Loading job explorer...
          </div>
        }
      >
        <JobsExplorer initialData={initialData} />
      </Suspense>
    </div>
  );
}
