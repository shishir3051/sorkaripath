"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Award,
  Bookmark,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Cpu,
  Crown,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  Save,
  Sparkles,
  Target,
  UserCheck,
} from "lucide-react";
import { apiFetch, formatBdDateTime, formatNoticeDate } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthContext";
import type { AuthUser, QuizAttempt } from "@/lib/types";

export interface ProfileData {
  user: AuthUser;
  studyStats: {
    completedLessonsCount: number;
    totalLessonsCount: number;
    completedTopicsCount: number;
    totalTopicsCount: number;
    completedRoutineDaysCount: number;
    routineTrack: string;
    wrongQuestionsCount: number;
    bookmarkedQuestionsCount: number;
    bookmarkedJobsCount: number;
    highlightsCount: number;
  };
  bookmarkedJobs: Array<{
    _id: string;
    title: string;
    slug: string;
    organization: string;
    deadlineDate?: string | null;
    deadlineRaw?: string;
    category: string;
  }>;
  recentAttempts: QuizAttempt[];
  recentAiLogs: Array<{
    id: string;
    feature:
      | "study_tutor"
      | "generate_mcqs"
      | "circular_discover"
      | "circular_analyze";
    modelUsed: string;
    promptTokens: number;
    outputTokens: number;
    thoughtsTokens: number;
    totalTokens: number;
    isCacheHit: boolean;
    label: string;
    createdAt: string;
  }>;
}

const TARGET_TRACKS = [
  "BCS & General Govt",
  "BCS Preliminary",
  "Bank & Financial",
  "Primary & NTRCA",
  "Grade 11-20",
];

const FEATURE_LABELS: Record<
  ProfileData["recentAiLogs"][number]["feature"],
  string
> = {
  study_tutor: "Study Tutor",
  generate_mcqs: "5-MCQ Lab",
  circular_discover: "Circular AI",
  circular_analyze: "PDF Analyzer",
};

function formatCount(n?: number | null): string {
  return (Number(n) || 0).toLocaleString("en-US");
}

export function ProfileClient({
  initialData,
}: {
  initialData: ProfileData | null;
}) {
  const router = useRouter();
  const { user: authUser, setUser } = useAuth();
  const user = initialData?.user ?? authUser;

  const [name, setName] = useState(user?.name || "");
  const [targetTrack, setTargetTrack] = useState(
    user?.targetTrack || "BCS & General Govt"
  );
  const [bio, setBio] = useState(user?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage("");
    setProfileError("");
    if (name.trim().length < 2) {
      setProfileError("Full name must be at least 2 characters.");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await apiFetch<{ user: AuthUser; message: string }>(
        "/auth/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: name.trim(),
            targetTrack,
            bio: bio.trim(),
          }),
        }
      );
      setUser(res.user);
      setProfileMessage(res.message || "Profile updated.");
      router.refresh();
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Could not update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiFetch<{ user: AuthUser; message: string }>(
        "/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );
      setUser(res.user);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(res.message || "Password updated.");
      router.refresh();
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Could not update password."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  const stats = initialData?.studyStats;
  const aiStats = user?.aiStats;
  const recentAttempts = initialData?.recentAttempts ?? [];
  const bookmarkedJobs = initialData?.bookmarkedJobs ?? [];
  const recentAiLogs = initialData?.recentAiLogs ?? [];

  const needsInitialPassword = Boolean(user?.passwordSetupPending);

  return (
    <div className="space-y-8">
      {/* Identity Overview Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-6 sm:p-8 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold text-white ring-1 ring-white/25">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                {user?.name}
              </h2>
              {user?.role === "admin" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-200 ring-1 ring-amber-300/30">
                  <Crown className="h-3.5 w-3.5" />
                  <span>{user.isPrimaryAdmin ? "Primary Admin" : "Admin"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-100">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Learner</span>
                </span>
              )}
              {user?.isEmailVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verified Gmail</span>
                </span>
              )}
            </div>

            <p className="text-sm text-emerald-100/90 break-all">{user?.email}</p>

            {user?.bio && (
              <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
                {user.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs text-emerald-100/90">
              <span className="rounded-md bg-white/10 px-2.5 py-1">
                Target: {user?.targetTrack || "BCS & General Govt"}
              </span>
              <span className="rounded-md bg-white/10 px-2.5 py-1">
                Joined: {formatBdDateTime(user?.createdAt, "—")}
              </span>
              <span className="rounded-md bg-white/10 px-2.5 py-1">
                Last Login: {formatBdDateTime(user?.lastLoginAt, "Active now")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            href="/study"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
          >
            <GraduationCap className="h-4 w-4 text-emerald-300" />
            <span>Study Hub</span>
          </Link>
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-emerald-300" />
            <span>A–Z Academy</span>
          </Link>
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
          >
            <Target className="h-4 w-4 text-emerald-300" />
            <span>MCQ Arena</span>
          </Link>
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 transition-colors"
            >
              <Crown className="h-4 w-4" />
              <span>Admin Panel</span>
            </Link>
          )}
        </div>
      </div>

      {/* Study & AI Progress KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>A–Z Academy</span>
            <BookOpen className="h-4 w-4 text-emerald-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats?.completedLessonsCount ?? 0} / {stats?.totalLessonsCount ?? 26}
          </p>
          <p className="mt-1 text-xs text-slate-500">Modules completed</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Topic Guru Sheets</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats?.completedTopicsCount ?? 0} / {stats?.totalTopicsCount ?? 50}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stats?.highlightsCount ?? 0} study highlights saved
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>30-Day Routine</span>
            <CalendarCheck className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats?.completedRoutineDaysCount ?? 0} / 30 Days
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stats?.wrongQuestionsCount ?? 0} items in Mistake Vault
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Gemini AI Tokens</span>
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-700">
            {formatCount(aiStats?.totalTokens)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatCount(aiStats?.totalRequests)} requests ({formatCount(aiStats?.apiCalls)} API)
          </p>
        </div>
      </div>

      {/* Edit Profile & Password Security Forms */}
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSaveProfile}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
        >
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Profile Information &amp; Study Goal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your display name, primary Bangladesh govt exam track, and personal goal note.
            </p>
          </div>

          {profileMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900">
              {profileMessage}
            </div>
          )}
          {profileError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-900">
              {profileError}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="profile-name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-track"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Target Exam Track
            </label>
            <select
              id="profile-track"
              value={targetTrack}
              onChange={(e) => setTargetTrack(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            >
              {TARGET_TRACKS.map((tr) => (
                <option key={tr} value={tr}>
                  {tr}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-bio"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Study Goal / Bio (Optional)
            </label>
            <textarea
              id="profile-bio"
              rows={3}
              maxLength={240}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Targeting 47th BCS Cadre & Bangladesh Bank AD..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {savingProfile ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{savingProfile ? "Saving..." : "Save Profile"}</span>
          </button>
        </form>

        <form
          onSubmit={handlePasswordUpdate}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-emerald-700" />
                <span>
                  {needsInitialPassword ? "Set Account Password" : "Change Password"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {needsInitialPassword
                  ? "You signed in with Gmail OTP. Set a password so you can also sign in with Gmail & Password."
                  : "Update your password to keep your study workspace secure."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              {showPasswords ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              <span>{showPasswords ? "Hide" : "Show"}</span>
            </button>
          </div>

          {passwordMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900">
              {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-900">
              {passwordError}
            </div>
          )}

          {!needsInitialPassword && (
            <div className="space-y-1.5">
              <label
                htmlFor="current-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Current Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="current-password"
                  type={showPasswords ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              New Password (min 6 chars)
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="new-password"
                type={showPasswords ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-new-password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="confirm-new-password"
                type={showPasswords ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {savingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            <span>
              {savingPassword
                ? "Updating..."
                : needsInitialPassword
                ? "Save Password"
                : "Update Password"}
            </span>
          </button>
        </form>
      </div>

      {/* Bookmarked Jobs & Recent Quiz Attempts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-amber-600" />
              <span>Bookmarked Job Circulars ({bookmarkedJobs.length})</span>
            </h3>
            <Link
              href="/jobs"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Browse Jobs →
            </Link>
          </div>
          {bookmarkedJobs.length === 0 ? (
            <div className="p-6 text-xs sm:text-sm text-slate-500">
              No job circulars bookmarked yet. Save notices from{" "}
              <Link href="/jobs" className="text-emerald-700 font-semibold underline">
                Circulars
              </Link>{" "}
              to track deadlines here.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {bookmarkedJobs.map((job) => (
                <Link
                  key={job._id}
                  href={`/jobs/${job.slug}`}
                  className="block px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {job.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {job.organization} • Deadline:{" "}
                    {formatNoticeDate(job.deadlineDate, job.deadlineRaw)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-700" />
              <span>Recent MCQ Mock Attempts</span>
            </h3>
            <Link
              href="/practice"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Practice Arena →
            </Link>
          </div>
          {recentAttempts.length === 0 ? (
            <div className="p-6 text-xs sm:text-sm text-slate-500">
              No mock attempts submitted yet. Take a timed quiz in{" "}
              <Link href="/practice" className="text-emerald-700 font-semibold underline">
                MCQ Arena
              </Link>{" "}
              to record scores here.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {recentAttempts.map((att) => (
                <div
                  key={att._id}
                  className="px-6 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {att.examTrack} — {att.subject}
                    </p>
                    <p className="text-xs text-slate-500">
                      {att.correctCount} correct, {att.wrongCount} wrong •{" "}
                      {formatBdDateTime(att.createdAt, "")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-sm font-bold text-emerald-700">
                      {att.netScore}/{att.maxScore}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {att.accuracyPercent}% acc
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Personal Gemini AI Usage & Token History */}
      <section className="rounded-2xl border border-indigo-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-indigo-100 bg-indigo-50/40 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-600" />
              <span>My Gemini AI Assistant Usage &amp; Tokens</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Prompt: {formatCount(aiStats?.promptTokens)} • Output:{" "}
              {formatCount(
                (aiStats?.outputTokens || 0) + (aiStats?.thoughtsTokens || 0)
              )}{" "}
              • Total: {formatCount(aiStats?.totalTokens)} tokens
            </p>
          </div>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-900">
            {formatCount(aiStats?.totalRequests)} Total Calls
          </span>
        </div>

        {recentAiLogs.length === 0 ? (
          <div className="p-6 text-xs sm:text-sm text-slate-500 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <span>
              You have not used the Gemini AI Study Tutor or Circular Assistant yet.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {recentAiLogs.map((log) => (
              <div
                key={log.id}
                className="px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-800">
                      {FEATURE_LABELS[log.feature] || log.feature}
                    </span>
                    <span className="text-slate-500">
                      {log.modelUsed || "gemini"}
                    </span>
                  </div>
                  {log.label && (
                    <p className="text-slate-700 font-medium truncate">{log.label}</p>
                  )}
                </div>

                <div className="shrink-0 text-right font-mono">
                  {log.isCacheHit ? (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Cache Hit (0 tok)
                    </span>
                  ) : (
                    <span className="font-bold text-indigo-700">
                      {formatCount(log.totalTokens)} tok
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                    {formatBdDateTime(log.createdAt, "")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
