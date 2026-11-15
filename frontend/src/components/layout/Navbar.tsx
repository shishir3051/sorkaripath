"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PwaInstallButton } from "@/components/layout/PwaInstallControl";
import {
  BookOpen,
  Briefcase,
  Calculator,
  Compass,
  GraduationCap,
  Menu,
  Radio,
  Sparkles,
  Target,
  X,
} from "lucide-react";

const PRIMARY_NAV_LINKS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/jobs", label: "Circulars", icon: Briefcase },
  { href: "/learn", label: "A–Z Academy", icon: BookOpen },
  { href: "/study", label: "Study Hub", icon: GraduationCap },
  { href: "/practice", label: "MCQ Arena", icon: Target },
  { href: "/tools", label: "2026 Tools", icon: Calculator },
];

const ALL_MOBILE_LINKS = [
  ...PRIMARY_NAV_LINKS,
  { href: "/live-sync", label: "Live Web Sync", icon: Radio },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const liveSyncActive = pathname.startsWith("/live-sync");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 group whitespace-nowrap"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
                SorkariPath
              </span>
              <span className="shrink-0 whitespace-nowrap rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                BD A–Z
              </span>
            </div>
            <p className="hidden sm:block text-[11px] font-medium text-slate-500 leading-none mt-0.5 whitespace-nowrap">
              Govt Job Portal &amp; Academy
            </p>
          </div>
        </Link>

        {/* Desktop Primary Pill Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1"
        >
          {PRIMARY_NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all ${
                  active
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status / Install App + Live Sync CTA + Mobile Toggle */}
        <div className="flex shrink-0 items-center gap-2">
          <PwaInstallButton variant="navbar" />
          <Link
            href="/live-sync"
            className={`hidden sm:inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              liveSyncActive
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
            </span>
            <span>Live Web Sync</span>
          </Link>

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
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 shadow-lg">
          <div className="grid gap-1 sm:grid-cols-2">
            {ALL_MOBILE_LINKS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-emerald-700 text-white"
                      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100">
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
