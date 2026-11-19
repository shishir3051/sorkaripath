import { Suspense } from "react";
import type { LearningModule } from "@/lib/types";
import { AcademyExplorer } from "@/components/learn/AcademyExplorer";
import { RouteLoadingShell } from "@/components/layout/RouteLoadingShell";
import { requireServerUser, serverApiFetch } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

async function loadModules(): Promise<LearningModule[]> {
  try {
    const res = await serverApiFetch<{ items: LearningModule[] }>("/learn");
    return res.items;
  } catch {
    return [];
  }
}

async function LearnContent() {
  const modules = await loadModules();
  if (modules.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
        Could not load modules from Express API. Ensure the backend server is
        running and seeded.
      </div>
    );
  }
  return <AcademyExplorer modules={modules} />;
}

export default async function LearnPage() {
  await requireServerUser("/learn");
  return (
    <div className="app-container py-8 space-y-6">
      <div>
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          Complete A-to-Z Career Encyclopedia
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
          Bangladesh Govt Job Academy (A to Z)
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-3xl">
          Every concept explained step by step from A (Architecture of Govt Jobs)
          through Z (Police Verification, Medical Board &amp; Gazette Joining)—updated
          for 2026 Pay Scale, 32-year age limit, and 93/7 quota rules.
        </p>
      </div>

      <Suspense
        fallback={<RouteLoadingShell variant="cards" includeHeader={false} />}
      >
        <LearnContent />
      </Suspense>
    </div>
  );
}
