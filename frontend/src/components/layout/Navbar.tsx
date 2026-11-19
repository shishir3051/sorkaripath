"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PwaInstallButton } from "@/components/layout/PwaInstallControl";
import { useAuth } from "@/components/auth/AuthContext";
import {
  BookOpen,
  Briefcase,
  Calculator,
  ChevronDown,
  Compass,
  Crown,
  GraduationCap,
  Lock,
  LogIn,
  LogOut,
  Menu,
  Radio,
  Sparkles,
  Target,
  User as UserIcon,
  X,
} from "lucide-react";

const PRIMARY_NAV_LINKS = [
  { href: "/", label: "Overview", icon: Compass, requiresAuth: false },
  { href: "/jobs", label: "Circulars", icon: Briefcase, requiresAuth: false },
  { href: "/learn", label: "A–Z Academy", icon: BookOpen, requiresAuth: true },
  { href: "/study", label: "Study Hub", icon: GraduationCap, requiresAuth: true },
  { href: "/practice", label: "MCQ Arena", icon: Target, requiresAuth: true },
  { href: "/tools", label: "2026 Tools", icon: Calculator, requiresAuth: false },
];

const ALL_MOBILE_LINKS = [
  ...PRIMARY_NAV_LINKS,
  { href: "/live-sync", label: "Live Web Sync", icon: Radio, requiresAuth: false },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading: authLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const activeTarget =
    pendingNav && pendingNav.from === pathname ? pendingNav.to : null;
  const currentPath = activeTarget ?? pathname;

  const isActive = (href: string) =>
    href === "/" ? currentPath === "/" : currentPath.startsWith(href);

  const liveSyncActive = currentPath.startsWith("/live-sync");
  const adminActive = currentPath.startsWith("/admin");
  const profileActive = currentPath.startsWith("/profile");

  useEffect(() => {
    if (!accountMenuOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (!accountMenuRef.current?.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  const handleLinkSelect = (href: string, closeMobile = false) => {
    if (href !== pathname) {
      setPendingNav({ from: pathname, to: href });
    }
    setAccountMenuOpen(false);
    if (closeMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="app-container flex h-16 items-center justify-between gap-2 xl:gap-3">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={() => handleLinkSelect("/")}
          className="flex shrink-0 items-center gap-2 group whitespace-nowrap"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base xl:text-lg font-bold tracking-tight text-slate-900">
                SorkariPath
              </span>
              <span className="hidden 2xl:inline-block shrink-0 whitespace-nowrap rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                BD A–Z
              </span>
            </div>
            <p className="hidden 2xl:block text-[11px] font-normal text-slate-500 leading-none mt-0.5 whitespace-nowrap">
              Govt Job Portal &amp; Academy
            </p>
          </div>
        </Link>

        {/* Desktop Primary Pill Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex shrink-0 items-center gap-0.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1"
        >
          {PRIMARY_NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isLocked = item.requiresAuth && !user;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={
                  !isLocked && (item.href === "/practice" || item.href === "/tools")
                    ? true
                    : false
                }
                title={isLocked ? "Sign in required to unlock study section" : undefined}
                onClick={() => handleLinkSelect(item.href)}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 2xl:px-2.5 py-1.5 text-xs 2xl:text-[13px] transition-all ${
                  active
                    ? "bg-emerald-700 font-semibold text-white shadow-sm"
                    : "font-medium text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Icon className="hidden xl:block h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
                {isLocked && (
                  <Lock className="h-2.5 w-2.5 shrink-0 text-amber-600" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Install App + Live Sync + Account Menu / Auth + Mobile Toggle */}
        <div className="flex shrink-0 items-center gap-1.5 xl:gap-2">
          <PwaInstallButton variant="navbar" />

          <Link
            href="/live-sync"
            prefetch={true}
            onClick={() => handleLinkSelect("/live-sync")}
            className={`hidden xl:inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-semibold transition-all ${
              liveSyncActive
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
            </span>
            <span>Live Sync</span>
          </Link>

          {user ? (
            <div ref={accountMenuRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className={`inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  accountMenuOpen || adminActive || profileActive
                    ? "border-emerald-300 bg-emerald-50/70 text-slate-900"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-[11px] font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[96px] truncate">
                  {user.name.split(/\s+/)[0]}
                </span>
                {user.role === "admin" && (
                  <Crown
                    className="h-3.5 w-3.5 shrink-0 text-amber-600"
                    aria-label="Admin"
                  />
                )}
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                    accountMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 z-50 space-y-1"
                >
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {user.name}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          user.role === "admin"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => handleLinkSelect("/profile")}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                      profileActive
                        ? "bg-emerald-50 text-emerald-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <UserIcon className="h-4 w-4 text-emerald-700" />
                    <span>My Profile &amp; Progress</span>
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => handleLinkSelect("/admin")}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                        adminActive
                          ? "bg-amber-100 text-amber-950 font-semibold"
                          : "text-slate-700 hover:bg-amber-50 hover:text-amber-950"
                      }`}
                    >
                      <Crown className="h-4 w-4 text-amber-600" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <Link
                    href="/live-sync"
                    role="menuitem"
                    onClick={() => handleLinkSelect("/live-sync")}
                    className={`xl:hidden flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                      liveSyncActive
                        ? "bg-emerald-50 text-emerald-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Radio className="h-4 w-4 text-emerald-600" />
                    <span>Live Web Sync</span>
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    disabled={authLoading}
                    onClick={() => {
                      setAccountMenuOpen(false);
                      void logout("/");
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center">
              <Link
                href="/login"
                onClick={() => handleLinkSelect("/login")}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors shadow-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 shadow-lg space-y-3">
          <div className="grid gap-1 sm:grid-cols-2">
            {ALL_MOBILE_LINKS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isLocked = item.requiresAuth && !user;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => handleLinkSelect(item.href, true)}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-emerald-700 font-semibold text-white"
                      : "font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {isLocked && <Lock className="h-3.5 w-3.5 text-amber-500" />}
                </Link>
              );
            })}
          </div>

          <div className="pt-2.5 border-t border-slate-100 space-y-2">
            {user ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user.email} • {user.role.toUpperCase()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/profile"
                    onClick={() => handleLinkSelect("/profile", true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>Profile</span>
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => handleLinkSelect("/admin", true)}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900"
                    >
                      <Crown className="h-3.5 w-3.5" />
                      <span>Admin</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      void logout("/");
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => handleLinkSelect("/login", true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            )}

            <PwaInstallButton
              variant="mobile"
              onActionComplete={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}
