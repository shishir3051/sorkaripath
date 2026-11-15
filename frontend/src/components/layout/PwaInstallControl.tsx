"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Download, Laptop, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaSnapshot {
  canPrompt: boolean;
  isStandalone: boolean;
}

const SERVER_SNAPSHOT: PwaSnapshot = {
  canPrompt: false,
  isStandalone: false,
};

let clientSnapshot: PwaSnapshot = {
  canPrompt: false,
  isStandalone: false,
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function emitChange() {
  const nextStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone
      ));
  const nextCanPrompt = Boolean(deferredPrompt) && !nextStandalone;

  if (
    clientSnapshot.canPrompt !== nextCanPrompt ||
    clientSnapshot.isStandalone !== nextStandalone
  ) {
    clientSnapshot = {
      canPrompt: nextCanPrompt,
      isStandalone: nextStandalone,
    };
  }
  for (const listener of listeners) {
    listener();
  }
}

function ensurePwaInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    emitChange();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emitChange();
  });

  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  const handleMediaChange = () => emitChange();
  mediaQuery.addEventListener("change", handleMediaChange);
  emitChange();
}

function subscribePwaStore(listener: () => void) {
  ensurePwaInitialized();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getPwaSnapshot(): PwaSnapshot {
  return clientSnapshot;
}

function getPwaServerSnapshot(): PwaSnapshot {
  return SERVER_SNAPSHOT;
}

/**
 * Registers the PWA Service Worker once at layout root so desktop & mobile installability works across all pages.
 */
export function PwaServiceWorkerRegistrar() {
  useEffect(() => {
    ensurePwaInitialized();
  }, []);
  return null;
}

/**
 * Adaptive Install Desktop/Mobile App button with native prompt support and cross-browser install guide fallback.
 */
export function PwaInstallButton({
  variant = "navbar",
  onActionComplete,
}: {
  variant?: "navbar" | "mobile" | "footer";
  onActionComplete?: () => void;
}) {
  const { canPrompt, isStandalone } = useSyncExternalStore(
    subscribePwaStore,
    getPwaSnapshot,
    getPwaServerSnapshot
  );
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (!guideOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGuideOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [guideOpen]);

  async function handleInstallClick() {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } catch {
        setGuideOpen(true);
      } finally {
        deferredPrompt = null;
        emitChange();
      }
      onActionComplete?.();
      return;
    }
    setGuideOpen(true);
  }

  if (isStandalone) {
    if (variant === "footer") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/70 bg-emerald-950/60 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Running as Installed Desktop App</span>
        </span>
      );
    }
    return null;
  }

  const buttonClass =
    variant === "navbar"
      ? "hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-emerald-900 transition-all cursor-pointer"
      : variant === "mobile"
      ? "flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
      : "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition-colors cursor-pointer";

  const label = canPrompt ? "Install App" : "Desktop App";

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Install SorkariPath as a standalone Desktop / Mobile App"
        className={buttonClass}
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span>{variant === "footer" ? `Download ${label}` : label}</span>
      </button>

      {guideOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
            onClick={() => setGuideOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 text-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    id="pwa-guide-title"
                    className="text-base font-extrabold text-slate-900 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4 text-emerald-700" />
                    <span>Install SorkariPath Desktop App</span>
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Runs in its own standalone window with a Windows Taskbar,
                    Start Menu, or macOS Dock icon — always synced automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  aria-label="Close install instructions"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Laptop className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Google Chrome / Microsoft Edge (Windows &amp; Mac)</span>
                  </p>
                  <p>
                    Click the <strong>Install icon</strong> in the right side of
                    the address bar, or open the browser menu:{" "}
                    <strong>
                      &#8942; &rarr; Cast, save, and share &rarr; Install
                      SorkariPath
                    </strong>{" "}
                    (Edge: <strong>&hellip; &rarr; Apps &rarr; Install</strong>).
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Safari (Mac / iPhone) &amp; Android Chrome</span>
                  </p>
                  <p>
                    Mac Safari: <strong>File &rarr; Add to Dock</strong>. Phone:
                    tap <strong>Share / &#8942; &rarr; Add to Home screen</strong>.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Note: 1-click browser install prompts require{" "}
                <code>https://</code> in production or{" "}
                <code>http://localhost</code> locally.
              </p>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
