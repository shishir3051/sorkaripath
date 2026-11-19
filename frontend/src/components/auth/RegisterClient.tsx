"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";
import { apiFetch, sanitizeNextPath } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthContext";
import type { AuthUser } from "@/lib/types";

export function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"), "/study");
  const { setUser } = useAuth();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await apiFetch<{
        email: string;
        message: string;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      setEmail(res.email);
      setStep("verify");
      setOtp("");
      setCooldown(45);
      setNotice(res.message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create account."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch<{ user: AuthUser }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
        }),
      });
      setUser(res.user);
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid verification code."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await apiFetch<{ message: string }>("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          purpose: "verify_email",
        }),
      });
      setCooldown(45);
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setBusy(false);
    }
  }

  const loginHref = `/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          {step === "form"
            ? "Create Your Study Account"
            : "Confirm Your Gmail / Email"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {step === "form"
            ? "Register with your Gmail / email and password. We'll send a 6-digit verification code to confirm your inbox."
            : `Enter the 6-digit verification code sent to ${email}.`}
        </p>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-900">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-900">
          {error}
        </div>
      )}

      {step === "form" ? (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="reg-name"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="reg-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gaziur Rahman"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reg-email"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              Gmail / Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="reg-email"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="reg-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Password (min 6 chars)
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
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

            <div className="space-y-1.5">
              <label
                htmlFor="reg-confirm"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="reg-confirm"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            <span>{busy ? "Sending Verification Code..." : "Register & Verify Gmail"}</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="reg-otp"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              6-Digit Verification Code
            </label>
            <input
              id="reg-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-xl font-extrabold tracking-[0.35em] text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>{busy ? "Verifying..." : "Verify & Unlock Study Hub"}</span>
          </button>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError("");
                setNotice("");
              }}
              className="font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Edit registration info
            </button>
            <button
              type="button"
              disabled={busy || cooldown > 0}
              onClick={handleResend}
              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline disabled:opacity-50 cursor-pointer"
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
        <span>Already have an account?</span>
        <Link
          href={loginHref}
          className="font-extrabold text-emerald-700 hover:underline"
        >
          Sign in instead →
        </Link>
      </div>
    </div>
  );
}
