import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { requireServerUser, serverApiFetch } from "@/lib/serverAuth";
import {
  AdminDashboard,
  type AdminOverviewData,
} from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireServerUser("/admin");

  if (user.role !== "admin") {
    return (
      <div className="app-container py-14">
        <div className="mx-auto max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Admin Access Required
          </h1>
          <p className="text-sm text-slate-600">
            You are signed in as <strong>{user.email}</strong> ({user.role}),
            which does not have administrator permissions.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/study"
              className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Go to Study Hub
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let initialData: AdminOverviewData | null = null;
  try {
    initialData = await serverApiFetch<AdminOverviewData>("/admin/overview");
  } catch {
    initialData = null;
  }

  return (
    <div className="app-container py-4 sm:py-5 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-900">
              Platform Administration
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              SorkariPath Admin Dashboard
            </h1>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-600">
            Manage learner accounts, role permissions, Gemini AI usage, job circulars, and live sync operations.
          </p>
        </div>
      </div>

      <AdminDashboard initialData={initialData} />
    </div>
  );
}
