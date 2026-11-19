"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bot,
  ChevronDown,
  ChevronUp,
  Cpu,
  Crown,
  Loader2,
  PlusCircle,
  Radio,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { apiFetch, formatBdDateTime, invalidateApiCache } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthContext";
import type { AuthUser, JobOrigin, RecordType } from "@/lib/types";

export interface AiSummaryStats {
  totalRequests: number;
  apiCalls: number;
  cacheHits: number;
  promptTokens: number;
  outputTokens: number;
  thoughtsTokens: number;
  cachedTokens: number;
  totalTokens: number;
  uniqueUsersCount: number;
}

export interface AiUserBreakdownItem {
  userId: string | null;
  userEmail: string;
  userName: string;
  role: "user" | "admin" | "guest";
  totalRequests: number;
  apiCalls: number;
  cacheHits: number;
  promptTokens: number;
  outputTokens: number;
  thoughtsTokens: number;
  totalTokens: number;
  lastUsedAt?: string | null;
  features: {
    study_tutor: number;
    generate_mcqs: number;
    circular_discover: number;
    circular_analyze: number;
  };
}

export interface AiUsageLogItem {
  id: string;
  userEmail: string;
  userName: string;
  feature:
    | "study_tutor"
    | "generate_mcqs"
    | "circular_discover"
    | "circular_analyze";
  modelUsed: string;
  keySlotUsed: number;
  promptTokens: number;
  outputTokens: number;
  thoughtsTokens: number;
  totalTokens: number;
  isCacheHit: boolean;
  label: string;
  createdAt: string;
}

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
  aiSummary?: AiSummaryStats;
  aiUserBreakdown?: AiUserBreakdownItem[];
  recentAiLogs?: AiUsageLogItem[];
}

type SectionTab = "all" | "users" | "ai" | "circulars";

const FEATURE_META: Record<
  AiUsageLogItem["feature"],
  { label: string; badgeClass: string }
> = {
  study_tutor: {
    label: "Study Tutor",
    badgeClass: "bg-indigo-100 text-indigo-800",
  },
  generate_mcqs: {
    label: "5-MCQ Lab",
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  circular_discover: {
    label: "Circular AI",
    badgeClass: "bg-sky-100 text-sky-800",
  },
  circular_analyze: {
    label: "PDF Analyzer",
    badgeClass: "bg-amber-100 text-amber-900",
  },
};

function formatCount(n?: number | null): string {
  return (Number(n) || 0).toLocaleString("en-US");
}

export function AdminDashboard({
  initialData,
}: {
  initialData: AdminOverviewData | null;
}) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<AdminOverviewData | null>(initialData);

  const [activeTab, setActiveTab] = useState<SectionTab>("all");
  const [userSearch, setUserSearch] = useState("");
  const [showRecentAiLogs, setShowRecentAiLogs] = useState(false);

  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(
    null
  );
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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
    setConfirmDeleteUserId(null);
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

  async function handleDeleteUser(targetUser: AuthUser) {
    setDeletingUserId(targetUser.id);
    setMessage("");
    setError("");
    try {
      const res = await apiFetch<{
        deletedUser: { id: string; email: string; name: string };
        message: string;
      }>(`/admin/users/${encodeURIComponent(targetUser.id)}`, {
        method: "DELETE",
      });
      setConfirmDeleteUserId(null);
      setMessage(res.message || `Deleted user ${targetUser.email}.`);
      await reloadOverview();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete user account."
      );
    } finally {
      setDeletingUserId(null);
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
  const aiSummary = data?.aiSummary;
  const aiUserBreakdown = data?.aiUserBreakdown ?? [];
  const recentAiLogs = data?.recentAiLogs ?? [];

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const list = data?.users || [];
    if (!q) return list;
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [data?.users, userSearch]);

  const showUsers = activeTab === "all" || activeTab === "users";
  const showAi = activeTab === "all" || activeTab === "ai";
  const showCirculars = activeTab === "all" || activeTab === "circulars";

  return (
    <div className="space-y-4">
      {/* Compact Control Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 px-4 py-3.5 sm:px-5 sm:py-4 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-amber-300/30">
              <Crown className="h-3 w-3" />
              <span>Administrator Control Panel</span>
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">
              {currentUser?.name} ({currentUser?.email})
            </h2>
          </div>
          <p className="text-xs text-emerald-100/80">
            Manage registered accounts, role &amp; user deletion, Gemini AI
            token usage, curated circulars, and live sync.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/live-sync"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
          >
            <Radio className="h-3.5 w-3.5 text-emerald-300" />
            <span>Sync Console</span>
          </Link>
          <button
            type="button"
            disabled={syncing}
            onClick={handleAdminSync}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60 cursor-pointer"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Radio className="h-3.5 w-3.5" />
            )}
            <span>{syncing ? "Syncing..." : "Run Live Sync"}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs sm:text-sm font-medium text-emerald-900">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs sm:text-sm font-medium text-rose-900">
          {error}
        </div>
      )}

      {/* Compact KPI Strip */}
      {stats && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Users</span>
              <Users className="h-3.5 w-3.5 text-emerald-700" />
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-lg font-bold text-slate-900">
                {stats.totalUsers}
              </p>
              <span className="text-[11px] text-slate-500 truncate">
                {stats.verifiedUsers} ver • {stats.adminUsers} admin
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Gemini Tokens</span>
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-lg font-bold text-indigo-700">
                {formatCount(aiSummary?.totalTokens)}
              </p>
              <span className="text-[11px] text-slate-500 truncate">
                {formatCount(aiSummary?.promptTokens)} in /{" "}
                {formatCount(aiSummary?.outputTokens)} out
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>AI Assistant Calls</span>
              <Bot className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-lg font-bold text-slate-900">
                {formatCount(aiSummary?.totalRequests)}
              </p>
              <span className="text-[11px] text-slate-500 truncate">
                {formatCount(aiSummary?.apiCalls)} API •{" "}
                {formatCount(aiSummary?.uniqueUsersCount)} users
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Content Pool</span>
              <Shield className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-lg font-bold text-slate-900">
                {formatCount(stats.totalCirculars)}
              </p>
              <span className="text-[11px] text-slate-500 truncate">
                {stats.topicCount} sh • {stats.lessonCount} mod • {stats.mcqCount} MCQ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Compact Section Switcher */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs w-fit">
        {(
          [
            ["all", "All Overview"],
            ["users", `Users (${data?.users?.length ?? 0})`],
            ["ai", `Gemini AI (${aiUserBreakdown.length})`],
            ["circulars", `Circulars (${data?.recentCirculars?.length ?? 0})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === key
                ? "bg-emerald-700 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* User Management & Delete Controls */}
      {showUsers && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                User Accounts &amp; Role Permissions
              </h3>
              <p className="text-[11px] text-slate-500">
                Promote/demote roles or delete non-primary user accounts and clear their records.
              </p>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Filter users..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">AI Usage</th>
                  <th className="px-3 py-2">Last Login</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const lockedPrimary = Boolean(u.isPrimaryAdmin);
                  const userAiTokens = u.aiStats?.totalTokens ?? 0;
                  const userAiCalls = u.aiStats?.totalRequests ?? 0;
                  const isConfirmingDelete = confirmDeleteUserId === u.id;
                  const isDeletingThis = deletingUserId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2">
                        <p className="font-semibold text-slate-900 leading-tight">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {u.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                              <UserCheck className="h-2.5 w-2.5" /> Verified
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                              Unverified
                            </span>
                          )}
                          {u.passwordSetupPending && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              Setup
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                            <Crown className="h-2.5 w-2.5" />
                            {lockedPrimary ? "Primary Admin" : "Admin"}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {userAiCalls > 0 ? (
                          <span className="font-mono text-[11px] font-semibold text-indigo-700">
                            {formatCount(userAiTokens)} tok ({userAiCalls})
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">
                        {formatBdDateTime(u.lastLoginAt, "Not logged in")}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {lockedPrimary || isSelf ? (
                          <span className="text-[11px] font-medium text-slate-400">
                            {isSelf ? "Current session" : "Protected"}
                          </span>
                        ) : isConfirmingDelete ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isDeletingThis}
                              onClick={() => handleDeleteUser(u)}
                              className="inline-flex items-center gap-1 rounded-md bg-rose-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
                            >
                              {isDeletingThis ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                              <span>
                                {isDeletingThis ? "Deleting..." : "Confirm Delete"}
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={isDeletingThis}
                              onClick={() => setConfirmDeleteUserId(null)}
                              className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {u.role === "admin" ? (
                              <button
                                type="button"
                                disabled={busyUserId === u.id}
                                onClick={() => handleRoleChange(u, "user")}
                                className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                              >
                                {busyUserId === u.id ? "..." : "Set User"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busyUserId === u.id}
                                onClick={() => handleRoleChange(u, "admin")}
                                className="rounded-md bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                              >
                                {busyUserId === u.id ? "..." : "Make Admin"}
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busyUserId === u.id}
                              onClick={() => setConfirmDeleteUserId(u.id)}
                              title={`Delete ${u.email}`}
                              className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-xs text-slate-500"
                    >
                      No users match &ldquo;{userSearch}&rdquo;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Gemini AI Assistant Users & Token Usage */}
      {showAi && (
        <section className="rounded-xl border border-indigo-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-indigo-600" />
                <span>Gemini AI Assistant — Users &amp; Token Usage</span>
              </h3>
              <p className="text-[11px] text-slate-600">
                Per-user Gemini invocation count and prompt/output/total tokens.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 font-semibold text-indigo-900">
                {formatCount(aiSummary?.uniqueUsersCount)} Users
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-900">
                {formatCount(aiSummary?.totalTokens)} Tokens
              </span>
              {recentAiLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRecentAiLogs((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 font-semibold text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                >
                  <span>Logs ({recentAiLogs.length})</span>
                  {showRecentAiLogs ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </div>

          {aiUserBreakdown.length === 0 ? (
            <div className="px-4 py-5 text-center text-xs text-slate-500">
              No Gemini AI Assistant requests recorded yet. Token usage per user
              will appear here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">User</th>
                    <th className="px-3 py-2">Features</th>
                    <th className="px-3 py-2 text-right">Calls</th>
                    <th className="px-3 py-2 text-right">Prompt</th>
                    <th className="px-3 py-2 text-right">Output</th>
                    <th className="px-3 py-2 text-right">Total Tok</th>
                    <th className="px-4 py-2 text-right">Last Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aiUserBreakdown.map((entry) => (
                    <tr key={entry.userEmail} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">
                            {entry.userName}
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                              entry.role === "admin"
                                ? "bg-amber-100 text-amber-900"
                                : entry.role === "guest"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {entry.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {entry.userEmail}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {entry.features.study_tutor > 0 && (
                            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800">
                              Tutor:{entry.features.study_tutor}
                            </span>
                          )}
                          {entry.features.generate_mcqs > 0 && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                              MCQ:{entry.features.generate_mcqs}
                            </span>
                          )}
                          {entry.features.circular_discover > 0 && (
                            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">
                              Circ:{entry.features.circular_discover}
                            </span>
                          )}
                          {entry.features.circular_analyze > 0 && (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                              PDF:{entry.features.circular_analyze}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">
                        <span className="font-semibold text-slate-900">
                          {formatCount(entry.totalRequests)}
                        </span>
                        {entry.cacheHits > 0 && (
                          <span className="block text-[10px] text-emerald-700">
                            {entry.cacheHits} cached
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">
                        {formatCount(entry.promptTokens)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">
                        {formatCount(
                          entry.outputTokens + (entry.thoughtsTokens || 0)
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-indigo-700">
                        {formatCount(entry.totalTokens)}
                      </td>
                      <td className="px-4 py-2 text-right text-[11px] text-slate-500 whitespace-nowrap">
                        {formatBdDateTime(entry.lastUsedAt, "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {recentAiLogs.length > 0 && showRecentAiLogs && (
            <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-3 space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-indigo-600" />
                <span>Recent Gemini AI Requests (Latest 25)</span>
              </h4>
              <div className="divide-y divide-slate-200/80 rounded-lg border border-slate-200 bg-white max-h-56 overflow-y-auto">
                {recentAiLogs.map((log) => {
                  const feat = FEATURE_META[log.feature] || {
                    label: log.feature,
                    badgeClass: "bg-slate-100 text-slate-700",
                  };
                  return (
                    <div
                      key={log.id}
                      className="px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${feat.badgeClass}`}
                          >
                            {feat.label}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {log.userName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({log.userEmail})
                          </span>
                        </div>
                        {log.label && (
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            {log.label}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right font-mono text-[11px]">
                        {log.isCacheHit ? (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            Cache Hit (0)
                          </span>
                        ) : (
                          <span className="font-semibold text-indigo-700">
                            {formatCount(log.totalTokens)} tok{" "}
                            <span className="font-normal text-slate-500">
                              ({formatCount(log.promptTokens)}/
                              {formatCount(
                                log.outputTokens + (log.thoughtsTokens || 0)
                              )}
                              )
                            </span>
                          </span>
                        )}
                        <p className="text-[10px] text-slate-400 font-sans">
                          {formatBdDateTime(log.createdAt, "")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Compact Circular Publishing & Recent Circulars */}
      {showCirculars && (
        <div className="grid gap-4 lg:grid-cols-12">
          <form
            onSubmit={handlePublishCircular}
            className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Publish Curated Circular
                </h3>
              </div>
              <span className="text-[10px] font-medium text-slate-500">
                Admin Session
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Circular Title"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
              <input
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Organization (e.g. BPSC)"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs sm:text-sm"
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
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm"
              />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm"
              />
              <input
                type="url"
                value={applyUrl}
                onChange={(e) => setApplyUrl(e.target.value)}
                placeholder="Official Apply URL"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm"
              />
            </div>

            <textarea
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summary of vacancies, qualification & key dates..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm"
            />
            <button
              type="submit"
              disabled={publishing}
              className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              {publishing ? "Publishing..." : "Publish Circular"}
            </button>
          </form>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Recent Active Circulars
              </h3>
              <Link
                href="/jobs"
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                View Public Board →
              </Link>
            </div>
            <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
              {(data?.recentCirculars || []).map((c) => (
                <div
                  key={c._id}
                  className="px-4 py-2 flex items-center justify-between gap-2.5 hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/jobs/${c.slug}`}
                      className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-emerald-700 line-clamp-1"
                    >
                      {c.title}
                    </Link>
                    <p className="text-[11px] text-slate-500">
                      {c.organization} • {c.category} • {c.origin}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busyDeleteId === c._id}
                    onClick={() => handleDeleteCircular(c._id, c.title)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{busyDeleteId === c._id ? "..." : "Remove"}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
