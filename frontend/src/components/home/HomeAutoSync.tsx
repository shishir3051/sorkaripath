"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, invalidateApiCache } from "@/lib/api";
import type { SyncMeta } from "@/lib/types";

const AUTO_SYNC_ATTEMPT_KEY = "sp_last_auto_sync_attempt_ms";
const CLIENT_ATTEMPT_THROTTLE_MS = 60_000;

export function claimAutoSyncAttemptWindow(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(AUTO_SYNC_ATTEMPT_KEY);
    const lastAttempt = raw ? Number(raw) : 0;
    const now = Date.now();
    if (lastAttempt && now - lastAttempt < CLIENT_ATTEMPT_THROTTLE_MS) {
      return false;
    }
    window.sessionStorage.setItem(AUTO_SYNC_ATTEMPT_KEY, String(now));
    return true;
  } catch {
    return true;
  }
}

export function HomeAutoSync({ syncMeta }: { syncMeta?: SyncMeta | null }) {
  const router = useRouter();
  const initialTriggeredRef = useRef(false);
  const mountedRef = useRef(true);
  const staleMinutes = Math.max(5, syncMeta?.staleMinutes ?? 30);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const runAutoSync = async () => {
      if (!mountedRef.current) return;
      if (!claimAutoSyncAttemptWindow()) return;
      try {
        const res = await apiFetch<{
          skipped?: boolean;
          log?: { totalFetched: number; newInserted: number };
        }>("/sync/run", {
          method: "POST",
          body: JSON.stringify({ triggeredBy: "auto" }),
        });
        if (!mountedRef.current) return;
        if (!res.skipped) {
          invalidateApiCache("/meta");
          invalidateApiCache("/jobs");
          invalidateApiCache("/sync/status");
          router.refresh();
        }
      } catch {
        // Keep home page uninterrupted if a transient auto-sync check fails.
      }
    };

    let initTimer: ReturnType<typeof setTimeout> | null = null;
    if (!initialTriggeredRef.current && syncMeta?.isStale && !syncMeta?.syncRunning) {
      initialTriggeredRef.current = true;
      initTimer = setTimeout(() => {
        runAutoSync();
      }, 400);
    }

    const intervalMs = staleMinutes * 60_000;
    const periodicTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      runAutoSync();
    }, intervalMs);

    return () => {
      if (initTimer) clearTimeout(initTimer);
      clearInterval(periodicTimer);
    };
  }, [syncMeta?.isStale, syncMeta?.syncRunning, staleMinutes, router]);

  return null;
}
