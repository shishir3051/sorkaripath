const isServer = typeof window === "undefined";

interface ApiCacheEntry {
  data: unknown;
  expiresAt: number;
}

const CLIENT_CACHE_LIMIT = 80;
const clientResponseCache = new Map<string, ApiCacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function normalizeUrl(value?: string | null): string {
  return (value || "").trim().replace(/\/+$/, "");
}

function getApiBaseUrl() {
  if (isServer) {
    const expressOrigin = normalizeUrl(process.env.EXPRESS_API_ORIGIN);
    if (expressOrigin) return `${expressOrigin}/api/v1`;

    const publicBase = normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
    if (/^https?:\/\//i.test(publicBase)) return publicBase;

    const vercelUrl = normalizeUrl(process.env.VERCEL_URL);
    if (vercelUrl) return `https://${vercelUrl}/api/v1`;

    return "http://localhost:5050/api/v1";
  }

  return normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL) || "/api/v1";
}

export interface ApiFetchOptions extends RequestInit {
  revalidate?: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: unknown;

  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export function sanitizeNextPath(
  rawNext?: string | null,
  fallback = "/study"
): string {
  if (!rawNext || typeof rawNext !== "string") return fallback;
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }
  if (trimmed.includes("://") || /[\r\n]/.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

export function getCachedApiData<T>(path: string): T | null {
  if (isServer) return null;
  const hit = clientResponseCache.get(path);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    clientResponseCache.delete(path);
    return null;
  }
  return hit.data as T;
}

export function setCachedApiData<T>(
  path: string,
  data: T,
  ttlMs = 60_000
): void {
  if (isServer || ttlMs <= 0) return;
  if (clientResponseCache.has(path)) {
    clientResponseCache.delete(path);
  } else if (clientResponseCache.size >= CLIENT_CACHE_LIMIT) {
    const oldestKey = clientResponseCache.keys().next().value;
    if (oldestKey !== undefined) {
      clientResponseCache.delete(oldestKey);
    }
  }
  clientResponseCache.set(path, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateApiCache(prefix?: string): void {
  if (isServer) return;
  if (!prefix) {
    clientResponseCache.clear();
    return;
  }
  for (const key of clientResponseCache.keys()) {
    if (key.startsWith(prefix)) {
      clientResponseCache.delete(key);
    }
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { revalidate, ...fetchOptions } = options;
  const url = `${getApiBaseUrl()}${path}`;
  const serverCacheInit: RequestInit & { next?: { revalidate: number } } =
    isServer && typeof revalidate === "number"
      ? { next: { revalidate } }
      : { cache: "no-store" };

  const res = await fetch(url, {
    ...fetchOptions,
    credentials: fetchOptions.credentials ?? "include",
    headers: {
      "Content-Type": "application/json",
      ...(fetchOptions.headers || {}),
    },
    ...serverCacheInit,
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.success === false) {
    throw new ApiError(
      payload?.message || `API Error (${res.status})`,
      res.status,
      payload?.code,
      payload
    );
  }

  return payload.data as T;
}

export async function cachedApiFetch<T>(
  path: string,
  ttlMs = 60_000,
  options: ApiFetchOptions = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  if (isServer || method !== "GET" || ttlMs <= 0) {
    return apiFetch<T>(path, options);
  }

  const cached = getCachedApiData<T>(path);
  if (cached !== null) {
    return cached;
  }

  const pending = inFlightRequests.get(path);
  if (pending) {
    return pending as Promise<T>;
  }

  const req = apiFetch<T>(path, options)
    .then((data) => {
      setCachedApiData(path, data, ttlMs);
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(path);
    });

  inFlightRequests.set(path, req);
  return req;
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr-guest";
  const key = "bd_govt_portal_session_id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `learner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(key, id);
  }
  return id;
}

const BN_TO_EN_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

export function toEnglishDigits(input?: string | null): string {
  if (!input) return "";
  return String(input).replace(/[০-৯]/g, (d) => BN_TO_EN_DIGITS[d] ?? d);
}

export function formatBdDate(dateInput?: string | null, fallback = "See Notice") {
  if (!dateInput) return fallback;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(d);
}

export function formatBdDateTime(
  dateInput?: string | null,
  fallback = "Not synced yet"
) {
  if (!dateInput) return fallback;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  }).format(d);
}

export function formatBdTime(dateInput?: string | null, fallback = "") {
  if (!dateInput) return fallback;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  }).format(d);
}

export function formatNoticeDate(
  isoDate?: string | null,
  rawDate?: string | null,
  fallback = "See Notice"
) {
  if (isoDate) {
    const parsed = new Date(isoDate);
    if (!Number.isNaN(parsed.getTime())) {
      return formatBdDate(isoDate, fallback);
    }
  }

  const asciiRaw = toEnglishDigits(rawDate).trim();
  if (!asciiRaw) return fallback;

  const dmyMatch = asciiRaw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const utc = new Date(Date.UTC(year, month - 1, day, 6, 0, 0));
      return formatBdDate(utc.toISOString(), fallback);
    }
  }

  return asciiRaw;
}

export function formatReadableText(input?: string | null): string {
  if (!input) return "";
  return toEnglishDigits(input).replace(
    /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/g,
    (full, dStr, mStr, yStr) => {
      const day = Number(dStr);
      const month = Number(mStr);
      const year = Number(yStr);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const utc = new Date(Date.UTC(year, month - 1, day, 6, 0, 0));
        return formatBdDate(utc.toISOString(), full);
      }
      return full;
    }
  );
}

export function safeExternalHref(
  url?: string | null,
  fallback = "#"
): string {
  if (!url) return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
}
