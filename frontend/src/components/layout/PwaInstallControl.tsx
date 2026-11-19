"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Laptop,
  Share,
  Smartphone,
  X,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaWindow extends Window {
  __spDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
}

type DevicePlatform = "ios" | "android" | "desktop";

interface PwaSnapshot {
  canPrompt: boolean;
  isStandalone: boolean;
  platform: DevicePlatform;
  isInAppBrowser: boolean;
  isSecureOrigin: boolean;
}

const SERVER_SNAPSHOT: PwaSnapshot = {
  canPrompt: false,
  isStandalone: false,
  platform: "desktop",
  isInAppBrowser: false,
  isSecureOrigin: true,
};

let clientSnapshot: PwaSnapshot = { ...SERVER_SNAPSHOT };

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function detectDevicePlatform(): DevicePlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  if (/Android/i.test(ua)) {
    return "android";
  }
  return "desktop";
}

function detectInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|Messenger|WhatsApp|Line\/|LinkedInApp|; wv\)/i.test(
    ua
  );
}

function emitChange() {
  if (typeof window === "undefined") return;

  const pwaWindow = window as PwaWindow;
  if (!deferredPrompt && pwaWindow.__spDeferredInstallPrompt) {
    deferredPrompt = pwaWindow.__spDeferredInstallPrompt;
  }

  const nextStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone
    );
  const nextCanPrompt = Boolean(deferredPrompt) && !nextStandalone;
  const nextPlatform = detectDevicePlatform();
  const nextInApp = detectInAppBrowser();
  const nextSecure = Boolean(window.isSecureContext);

  if (
    clientSnapshot.canPrompt !== nextCanPrompt ||
    clientSnapshot.isStandalone !== nextStandalone ||
    clientSnapshot.platform !== nextPlatform ||
    clientSnapshot.isInAppBrowser !== nextInApp ||
    clientSnapshot.isSecureOrigin !== nextSecure
  ) {
    clientSnapshot = {
      canPrompt: nextCanPrompt,
      isStandalone: nextStandalone,
      platform: nextPlatform,
      isInAppBrowser: nextInApp,
      isSecureOrigin: nextSecure,
    };
  }
  for (const listener of listeners) {
    listener();
  }
}

function ensurePwaInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const pwaWindow = window as PwaWindow;
  if (pwaWindow.__spDeferredInstallPrompt) {
    deferredPrompt = pwaWindow.__spDeferredInstallPrompt;
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    pwaWindow.__spDeferredInstallPrompt = deferredPrompt;
    emitChange();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    pwaWindow.__spDeferredInstallPrompt = null;
    emitChange();
  });

  const standaloneMedia = window.matchMedia("(display-mode: standalone)");
  const overlayMedia = window.matchMedia(
    "(display-mode: window-controls-overlay)"
  );
  const handleMediaChange = () => emitChange();
  standaloneMedia.addEventListener("change", handleMediaChange);
  overlayMedia.addEventListener("change", handleMediaChange);
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

interface GuideCardSpec {
  id: DevicePlatform;
  title: string;
  body: React.ReactNode;
}

function getOrderedGuideCards(platform: DevicePlatform): GuideCardSpec[] {
  const androidCard: GuideCardSpec = {
    id: "android",
    title: "Android (Chrome / Edge / Samsung Internet)",
    body: (
      <p>
        Open in <strong>Chrome</strong> (not Messenger/WhatsApp), tap{" "}
        <strong>&#8942;</strong> in the top-right corner &rarr;{" "}
        <strong>Add to home screen</strong> &rarr; <strong>Install</strong>{" "}
        (or tap <strong>Install app</strong> when shown). No install option in
        the menu? SorkariPath is probably already installed &mdash; check your
        home screen and app drawer.
      </p>
    ),
  };

  const iosCard: GuideCardSpec = {
    id: "ios",
    title: "iPhone & iPad (Safari)",
    body: (
      <p className="flex flex-wrap items-center gap-1">
        <span>
          Open in <strong>Safari</strong>, tap the <strong>Share</strong>
        </span>
        <Share className="inline h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
        <span>
          button &rarr; <strong>Add to Home Screen</strong> &rarr;{" "}
          <strong>Add</strong>.
        </span>
      </p>
    ),
  };

  const desktopCard: GuideCardSpec = {
    id: "desktop",
    title: "Desktop (Chrome / Edge / Mac Safari)",
    body: (
      <p>
        Click the <strong>Install icon</strong> in the right side of the address
        bar, or menu <strong>&#8942; &rarr; Cast, save, and share &rarr; Install
        SorkariPath</strong> (Mac Safari: <strong>File &rarr; Add to Dock</strong>).
      </p>
    ),
  };

  if (platform === "ios") return [iosCard, androidCard, desktopCard];
  if (platform === "android") return [androidCard, iosCard, desktopCard];
  return [desktopCard, androidCard, iosCard];
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
 * Adaptive Install Mobile/Desktop App button with native prompt support and device-aware install guidance.
 */
export function PwaInstallButton({
  variant = "navbar",
  onActionComplete,
}: {
  variant?: "navbar" | "mobile" | "footer";
  onActionComplete?: () => void;
}) {
  const { canPrompt, isStandalone, platform, isInAppBrowser, isSecureOrigin } =
    useSyncExternalStore(
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
    const pwaWindow =
      typeof window !== "undefined" ? (window as PwaWindow) : undefined;
    const activePrompt =
      deferredPrompt ?? pwaWindow?.__spDeferredInstallPrompt ?? null;

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        await activePrompt.userChoice;
      } catch {
        setGuideOpen(true);
      } finally {
        deferredPrompt = null;
        if (pwaWindow) {
          pwaWindow.__spDeferredInstallPrompt = null;
        }
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
          <span>Running as Installed App</span>
        </span>
      );
    }
    return null;
  }

  const isMobilePlatform = platform === "ios" || platform === "android";

  const buttonClass =
    variant === "navbar"
      ? "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-emerald-900 transition-all cursor-pointer"
      : variant === "mobile"
      ? "flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
      : "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition-colors cursor-pointer";

  const fullLabel = canPrompt
    ? "Install App"
    : isMobilePlatform
    ? platform === "ios"
      ? "Install on iPhone"
      : "Install Mobile App"
    : "Desktop App";

  const orderedCards = getOrderedGuideCards(platform);

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Install SorkariPath as a standalone Mobile / Desktop App"
        className={buttonClass}
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        {variant === "navbar" ? (
          <>
            <span className="sm:hidden">Install</span>
            <span className="hidden lg:inline 2xl:hidden">App</span>
            <span className="hidden sm:inline lg:hidden 2xl:inline">{fullLabel}</span>
          </>
        ) : variant === "footer" ? (
          <span>{canPrompt ? "Download & Install App" : fullLabel}</span>
        ) : (
          <span>{canPrompt ? "Install App (1-Tap)" : fullLabel}</span>
        )}
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
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 text-slate-900 max-h-[90dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    id="pwa-guide-title"
                    className="text-base font-extrabold text-slate-900 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4 text-emerald-700" />
                    <span>
                      {isMobilePlatform
                        ? "Install SorkariPath Mobile App"
                        : "Install SorkariPath App"}
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Runs in its own standalone app window from your phone Home
                    Screen or Windows/Mac dock — always synced automatically.
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

              {!isSecureOrigin && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    <span>Local HTTP Origin Blocked Mobile Install</span>
                  </p>
                  <p className="leading-relaxed">
                    Phones block PWA installation on plain{" "}
                    <code>http://192.168.x.x</code> Wi-Fi URLs even though{" "}
                    <code>http://localhost</code> works on your PC. Open the{" "}
                    <strong>https://</strong> production site, use an HTTPS
                    tunnel, or connect Android via USB (
                    <code>adb reverse tcp:3000 tcp:3000</code> and open{" "}
                    <code>http://localhost:3000</code>).
                  </p>
                </div>
              )}

              {isSecureOrigin && isInAppBrowser && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    <span>In-App Browser Detected</span>
                  </p>
                  <p className="leading-relaxed">
                    Messenger, WhatsApp, and Facebook built-in browsers block
                    app installation. Tap the menu icon and choose{" "}
                    <strong>
                      {platform === "ios"
                        ? "Open in Safari"
                        : "Open in Chrome"}
                    </strong>{" "}
                    first.
                  </p>
                </div>
              )}

              <div className="space-y-2.5 text-xs text-slate-700">
                {orderedCards.map((card) => {
                  const isCurrentDevice = card.id === platform;
                  return (
                    <div
                      key={card.id}
                      className={`rounded-xl border p-3 space-y-1 ${
                        isCurrentDevice
                          ? "border-emerald-300 bg-emerald-50/60"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          {card.id === "desktop" ? (
                            <Laptop className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          ) : (
                            <Smartphone className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          )}
                          <span>{card.title}</span>
                        </p>
                        {isCurrentDevice && (
                          <span className="shrink-0 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">
                            Your Device
                          </span>
                        )}
                      </div>
                      {card.body}
                    </div>
                  );
                })}
              </div>

              {/* Chrome often fires beforeinstallprompt a few seconds after load,
                  i.e. after this guide has already opened. canPrompt is live, so
                  surface the one-tap install the moment it becomes available
                  instead of leaving "Got it" as the only way out. */}
              <div className="flex items-center justify-end gap-2">
                {canPrompt && (
                  <button
                    type="button"
                    onClick={() => {
                      setGuideOpen(false);
                      void handleInstallClick();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Install now
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  className={
                    canPrompt
                      ? "rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      : "rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                  }
                >
                  {canPrompt ? "Not now" : "Got it"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
