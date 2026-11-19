"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Crown,
  Loader2,
  PlusCircle,
  Radio,
  Shield,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { apiFetch, formatBdDateTime, invalidateApiCache } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthContext";
import type { AuthUser, JobOrigin, RecordType } from "@/lib/types";

export interface AdminOverviewData {
  stats: {
    totalUsers: number;
    verifiedUsers: number;
    adminUsers: number;
    totalCirculars: number;
    lessonCount: number;
    topicCount: number;
    mcqCount: number;
  };
  users: AuthUser[];
  recentCirculars: Array<{
    _id: string;
    title: string;
    slug: string;
    organization: string;
    category: string;
    origin: JobOrigin;
    recordType: RecordType;
    publishedDate: string;
    isFeatured: boolean;
  }>;
}

export function AdminDashboard({
  initialData,
}: {
  initialData: AdminOverviewData | null;
}) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<AdminOverviewData | null>(initialData);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Publish circular form
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [category, setCategory] = useState("Ministry & Directorate");
  const [gradeRange, setGradeRange] = useState("Grade 9-16");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [applyUrl, setApplyUrl] = useState("https://alljobs.teletalk.com.bd/");
  const [summary, setSummary] = useState("");
  const [publishing, setPublishing] = useState(false);

  async function reloadOverview() {
    const fresh = await apiFetch<AdminOverviewData>("/admin/overview");
    setData(fresh);
  }

  async function handleRoleChange(targetUser: AuthUser, nextRole: "user" | "admin") {
    setBusyUserId(targetUser.id);
    setMessage("");
    setError("");
    try {
      const res = await apiFetch<{ user: AuthUser }>(
        `/admin/users/${encodeURIComponent(targetUser.id)}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ role: nextRole }),
        }
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map((u) =>
                u.id === res.user.id ? res.user : u
              ),
            }
          : prev
      );
      setMessage(
        `Updated ${res.user.email} role to ${res.user.role.toUpperCase()}.`
      );
      await reloadOverview();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user role."
      );
    } finally {
      setBusyUserId(null);
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
      setTitle("");
      setOrganization("");
      setDeadlineDate("");
      setSummary("");
      invalidateApiCache("/jobs");
      invalidateApiCache("/meta");
      setMessage("Circular published directly as Admin!");
      await reloadOverview();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to publish circular."
      );
    } finally {
      setPublishing(false);
    }
  }

  async function handleDeleteCircular(id: string, circularTitle: string) {
    setBusyDeleteId(id);
    setMessage("");
    setError("");
    try {
      await apiFetch(`/jobs/${encodeURIComponent(id)}`, { method: "DELETE" });
      invalidateApiCache("/jobs");
      invalidateApiCache("/meta");
      setMessage(`Removed circular "${circularTitle}".`);
      await reloadOverview();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove circular."
      );
    } finally {
      setBusyDeleteId(null);
    }
  }

  async function handleAdminSync() {
    setSyncing(true);
    setMessage("");
    setError("");
    try {
      const res = await apiFetch<{
        status: string;
        log: { sourcesChecked: number; totalFetched: number; newInserted: number };
      }>("/sync/run", {
        method: "POST",
        body: JSON.stringify({}),
      });
      invalidateApiCache("/jobs");
      invalidateApiCache("/meta");
      setMessage(
        `Admin Live Sync (${res.status}): checked ${res.log.sourcesChecked} sources, fetched ${res.log.totalFetched} items (${res.log.newInserted} new).`
      );
      await reloadOverview();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Live sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  const stats = data?.stats;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-300 ring-1 ring-amber-300/30">
            <Crown className="h-3.5 w-3.5" />
            <span>Administrator Control Panel</span>
          </div>
          <h2 className="text-xl font-extrabold">
            Signed in as {currentUser?.name} ({currentUser?.email})
          </h2>
          <p className="text-xs text-emerald-100/80">
            Manage registered users, admin privileges, curated job circulars, and
            cooldown-free live web scraping.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/live-sync"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20"
          >
            <Radio className="h-4 w-4 text-emerald-300" />
            <span>Live Sync Console</span>
          </Link>
          <button
            type="button"
            disabled={syncing}
            onClick={handleAdminSync}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-300 disabled:opacity-60 cursor-pointer"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Radio className="h-4 w-4" />
            )}
            <span>{syncing ? "Syncing..." : "Run Admin Live Sync"}</span>
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

      {/* KPI Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Registered Users</span>
              <Users className="h-4 w-4 text-emerald-700" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {stats.totalUsers}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.verifiedUsers} email-verified
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Admin Accounts</span>
              <Crown className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {stats.adminUsers}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Full platform access
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Active Circulars</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {stats.totalCirculars}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Public job &amp; notice records
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Locked Study Content</span>
              <Shield className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {stats.topicCount} Sheets
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.lessonCount} A–Z modules • {stats.mcqCount} MCQs
            </p>
          </div>
        </div>
      )}

      {/* User Management */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              User Accounts &amp; Role Permissions
            </h3>
            <p className="text-xs text-slate-500">
              View signed-up learners and promote or revoke admin permissions.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Last Login</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.users || []).map((u) => {
                const isSelf = u.id === currentUser?.id;
                const lockedPrimary = Boolean(u.isPrimaryAdmin);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {u.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <UserCheck className="h-3 w-3" /> Verified
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                            Unverified
                          </span>
                        )}
                        {u.passwordSetupPending && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            Setup Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900">
                          <Crown className="h-3 w-3" />
                          {lockedPrimary ? "Primary Admin" : "Admin"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">
                      {formatBdDateTime(u.lastLoginAt, "Not logged in yet")}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {lockedPrimary || isSelf ? (
                        <span className="text-[11px] font-semibold text-slate-400">
                          {isSelf ? "Current session" : "Protected"}
                        </span>
                      ) : u.role === "admin" ? (
                        <button
                          type="button"
                          disabled={busyUserId === u.id}
                          onClick={() => handleRoleChange(u, "user")}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                        >
                          {busyUserId === u.id ? "Updating..." : "Set as User"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyUserId === u.id}
                          onClick={() => handleRoleChange(u, "admin")}
                          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                        >
                          {busyUserId === u.id ? "Updating..." : "Make Admin"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Publish Circular + Manage Recent Circulars */}
      <div className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handlePublishCircular}
          className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-emerald-700" />
            <h3 className="text-base font-extrabold text-slate-900">
              Publish Curated Circular
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Authenticated via your Admin session (no API key input needed).
          </p>

          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Circular Title (e.g., 51st BCS Circular)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
          />
          <input
            type="text"
            required
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Organization (e.g., BPSC)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
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
              placeholder="Grade Range"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            />
            <input
              type="url"
              value={applyUrl}
              onChange={(e) => setApplyUrl(e.target.value)}
              placeholder="Official Apply URL"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            />
          </div>
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
            className="w-full rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
          >
            {publishing ? "Publishing..." : "Publish Circular"}
          </button>
        </form>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">
              Recent Active Circulars
            </h3>
            <Link
              href="/jobs"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              View Public Board →
            </Link>
          </div>
          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
            {(data?.recentCirculars || []).map((c) => (
              <div
                key={c._id}
                className="px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70"
              >
                <div className="min-w-0">
                  <Link
                    href={`/jobs/${c.slug}`}
                    className="text-sm font-bold text-slate-900 hover:text-emerald-700 line-clamp-1"
                  >
                    {c.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {c.organization} • {c.category} • {c.origin}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyDeleteId === c._id}
                  onClick={() => handleDeleteCircular(c._id, c.title)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{busyDeleteId === c._id ? "..." : "Remove"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
