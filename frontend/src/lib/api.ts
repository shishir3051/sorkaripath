const isServer = typeof window === "undefined";

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

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.message || `API Error (${res.status})`);
  }

  return payload.data as T;
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
