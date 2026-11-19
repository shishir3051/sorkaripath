"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PwaInstallButton } from "@/components/layout/PwaInstallControl";
import { useAuth } from "@/components/auth/AuthContext";
import {
  BookOpen,
  Briefcase,
  Calculator,
  Compass,
  Crown,
  GraduationCap,
  Lock,
  LogIn,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Sparkles,
  Target,
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const activeTarget =
    pendingNav && pendingNav.from === pathname ? pendingNav.to : null;
  const currentPath = activeTarget ?? pathname;

  const isActive = (href: string) =>
    href === "/" ? currentPath === "/" : currentPath.startsWith(href);

  const liveSyncActive = currentPath.startsWith("/live-sync");
  const adminActive = currentPath.startsWith("/admin");
  const profileActive = currentPath.startsWith("/profile");

  const handleLinkSelect = (href: string, closeMobile = false) => {
    if (href !== pathname) {
      setPendingNav({ from: pathname, to: href });
    }
    if (closeMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside
        aria-label="Primary sidebar navigation"
        className={`hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen shrink-0 border-r border-slate-200/80 bg-[#f8faf9] transition-[width] duration-200 z-40 ${
          collapsed ? "w-[72px]" : "w-60"
        }`}
      >
        {/* Brand + Collapse Toggle */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-slate-200/70 ${
            collapsed ? "justify-center px-2" : "justify-between px-3.5"
          }`}
        >
          <Link
            href="/"
            onClick={() => handleLinkSelect("/")}
            title="SorkariPath — BD Govt Job Portal & Academy"
            className="flex min-w-0 items-center gap-2.5 group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-slate-900 truncate">
                    SorkariPath
                  </span>
                  <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                    BD
                  </span>
                </div>
                <p className="text-[11px] font-normal text-slate-500 leading-none mt-0.5 truncate">
                  Govt Job &amp; Academy
                </p>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4"
        >
          <div className="space-y-1">
            {!collapsed ? (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Portal &amp; Academy
              </p>
            ) : (
              <div className="flex justify-center pb-1">
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </div>
            )}

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
                  title={
                    collapsed
                      ? `${item.label}${isLocked ? " (Sign in required)" : ""}`
                      : isLocked
                      ? "Sign in required to unlock study section"
                      : undefined
                  }
                  onClick={() => handleLinkSelect(item.href)}
                  className={`relative flex items-center ${
                    collapsed ? "justify-center px-2" : "justify-between px-3"
                  } rounded-xl py-2 text-xs transition-all ${
                    active
                      ? "bg-slate-900 font-semibold text-white shadow-xs"
                      : "font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-2xs"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </span>
                  {isLocked &&
                    (collapsed ? (
                      <span
                        className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <Lock
                        className={`h-3 w-3 shrink-0 ${
                          active ? "text-amber-200" : "text-amber-600"
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Tools &amp; Sync
              </p>
            )}

            <Link
              href="/live-sync"
              prefetch={true}
              title={collapsed ? "Live Web Sync" : undefined}
              onClick={() => handleLinkSelect("/live-sync")}
              className={`flex items-center ${
                collapsed ? "justify-center px-2" : "justify-between px-3"
              } rounded-xl py-2 text-xs font-medium transition-all ${
                liveSyncActive
                  ? "bg-slate-900 font-semibold text-white shadow-xs"
                  : "text-emerald-800 bg-emerald-50/90 ring-1 ring-emerald-200/70 hover:bg-emerald-100/80"
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Radio className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">Live Web Sync</span>}
              </span>
              {!collapsed && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                </span>
              )}
            </Link>

            <PwaInstallButton variant="sidebar" collapsed={collapsed} />
          </div>
        </nav>

        {/* Bottom Account & Admin Footer */}
        <div className="shrink-0 border-t border-slate-200/80 bg-slate-50/70 p-2.5 space-y-1.5">
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => handleLinkSelect("/profile")}
                title={collapsed ? `${user.name} — My Profile` : undefined}
                className={`flex items-center ${
                  collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-2"
                } rounded-xl border transition-colors ${
                  profileActive
                    ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100/70"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {user.name}
                      </p>
                      {user.role === "admin" && (
                        <Crown
                          className="h-3 w-3 shrink-0 text-amber-600"
                          aria-label="Admin"
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                )}
              </Link>

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => handleLinkSelect("/admin")}
                  title={collapsed ? "Admin Dashboard" : undefined}
                  className={`flex items-center ${
                    collapsed ? "justify-center px-2" : "gap-2.5 px-3"
                  } rounded-xl py-2 text-xs transition-colors ${
                    adminActive
                      ? "bg-amber-100 font-semibold text-amber-950 border border-amber-300"
                      : "font-medium text-amber-900 bg-amber-50/70 hover:bg-amber-100"
                  }`}
                >
                  <Crown className="h-4 w-4 shrink-0 text-amber-600" />
                  {!collapsed && <span className="truncate">Admin Dashboard</span>}
                </Link>
              )}

              <button
                type="button"
                disabled={authLoading}
                onClick={() => void logout("/")}
                title={collapsed ? "Sign Out" : undefined}
                className={`flex w-full items-center ${
                  collapsed ? "justify-center px-2" : "gap-2.5 px-3"
                } rounded-xl py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer`}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Sign Out</span>}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => handleLinkSelect("/login")}
              title={collapsed ? "Sign In" : undefined}
              className={`flex items-center justify-center gap-2 rounded-xl bg-slate-900 ${
                collapsed ? "px-2 py-2.5" : "px-3.5 py-2.5"
              } text-xs font-semibold text-white hover:bg-emerald-800 transition-colors shadow-xs`}
            >
              <LogIn className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sign In</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile / Tablet Sticky Header (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="app-container flex h-14 items-center justify-between gap-2">
          <Link
            href="/"
            onClick={() => handleLinkSelect("/")}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              SorkariPath
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <PwaInstallButton variant="navbar" />

            {user ? (
              <Link
                href="/profile"
                onClick={() => handleLinkSelect("/profile")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-700 text-[10px] font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[90px] truncate">
                  {user.name.split(/\s+/)[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => handleLinkSelect("/login")}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? (
                <X className="h-4.5 w-4.5" />
              ) : (
                <Menu className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Slide Drawer */}
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg space-y-3">
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
                        ? "bg-slate-900 font-semibold text-white"
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
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
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
    </>
  );
}
