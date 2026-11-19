"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { ApiError, apiFetch, sanitizeNextPath } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthContext";
import type { AuthUser } from "@/lib/types";

type LoginMode = "password" | "otp" | "verify_pending";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"), "/study");
  const { setUser } = useAuth();

  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  function finishSignIn(user: AuthUser) {
    setUser(user);
    const target =
      user.role === "admin" && nextPath === "/admin" ? "/admin" : nextPath;
    router.push(target);
    router.refresh();
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await apiFetch<{ user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      finishSignIn(res.user);
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setMode("verify_pending");
        setOtp("");
        setCooldown(45);
        setNotice(err.message);
      } else if (
        err instanceof ApiError &&
        err.code === "PASSWORD_SETUP_REQUIRED"
      ) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to sign in.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestLoginOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await apiFetch<{ message: string }>("/auth/login-otp/request", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setOtpSent(true);
      setCooldown(45);
      setNotice(res.message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send sign-in code."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyLoginOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch<{ user: AuthUser }>("/auth/login-otp/verify", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      finishSignIn(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyPendingEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch<{ user: AuthUser }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      finishSignIn(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend(purpose: "verify_email" | "login_otp") {
    if (cooldown > 0) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await apiFetch<{ message: string }>("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), purpose }),
      });
      setCooldown(45);
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setBusy(false);
    }
  }

  const registerHref = `/register${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {mode === "verify_pending"
            ? "Verify Your Gmail / Email"
            : "Sign In to SorkariPath"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {mode === "verify_pending"
            ? "Enter the 6-digit verification code sent to your inbox."
            : "Use your Gmail / email and password, or request a one-time Gmail sign-in code."}
        </p>
      </div>

      {mode !== "verify_pending" && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError("");
              setNotice("");
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              mode === "password"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Gmail &amp; Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("otp");
              setError("");
              setNotice("");
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              mode === "otp"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Gmail OTP Code</span>
          </button>
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-medium text-emerald-900">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-medium text-rose-900">
          {error}
        </div>
      )}

      {mode === "password" && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Gmail / Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            <span>{busy ? "Signing In..." : "Sign In & Unlock Study"}</span>
          </button>
        </form>
      )}

      {mode === "otp" && (
        <form
          onSubmit={otpSent ? handleVerifyLoginOtp : handleRequestLoginOtp}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="otp-email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Gmail / Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="otp-email"
                type="email"
                required
                disabled={otpSent}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 disabled:opacity-70 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {otpSent && (
            <div className="space-y-1.5">
              <label
                htmlFor="login-otp-code"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                6-Digit Gmail Sign-In Code
              </label>
              <input
                id="login-otp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.35em] text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>
              {otpSent
                ? busy
                  ? "Verifying..."
                  : "Verify Code & Sign In"
                : busy
                ? "Sending Code..."
                : "Send 6-Digit Sign-In Code"}
            </span>
          </button>

          {otpSent && (
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setNotice("");
                }}
                className="font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Change email
              </button>
              <button
                type="button"
                disabled={busy || cooldown > 0}
                onClick={() => handleResend("login_otp")}
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                </span>
              </button>
            </div>
          )}
        </form>
      )}

      {mode === "verify_pending" && (
        <form onSubmit={handleVerifyPendingEmail} className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
            Account: <strong className="text-slate-900">{email}</strong>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="verify-pending-otp"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              6-Digit Verification Code
            </label>
            <input
              id="verify-pending-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.35em] text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>{busy ? "Verifying..." : "Verify Gmail & Sign In"}</span>
          </button>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError("");
                setNotice("");
              }}
              className="font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Back to password login
            </button>
            <button
              type="button"
              disabled={busy || cooldown > 0}
              onClick={() => handleResend("verify_email")}
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
              </span>
            </button>
          </div>
        </form>
      )}

      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>New to SorkariPath?</span>
        <Link
          href={registerHref}
          className="font-semibold text-emerald-700 hover:underline"
        >
          Create free account →
        </Link>
      </div>
    </div>
  );
}
