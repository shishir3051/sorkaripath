import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, sanitizeNextPath } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

const AUTH_COOKIE_NAME = "sp_auth_token";

function normalizeUrl(value?: string | null): string {
  return (value || "").trim().replace(/\/+$/, "");
}

function getExpressApiBaseUrl(): string {
  const expressOrigin = normalizeUrl(process.env.EXPRESS_API_ORIGIN);
  if (expressOrigin) return `${expressOrigin}/api/v1`;

  const publicBase = normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (/^https?:\/\//i.test(publicBase)) return publicBase;

  const vercelUrl = normalizeUrl(process.env.VERCEL_URL);
  if (vercelUrl) return `https://${vercelUrl}/api/v1`;

  return "http://localhost:5050/api/v1";
}

export async function getAuthCookieValue(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value?.trim() || "";
}

export async function serverApiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAuthCookieValue();
  const url = `${getExpressApiBaseUrl()}${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    const existingCookie = headers.get("Cookie");
    headers.set(
      "Cookie",
      existingCookie
        ? `${existingCookie}; ${AUTH_COOKIE_NAME}=${token}`
        : `${AUTH_COOKIE_NAME}=${token}`
    );
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
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

export async function getServerSession(): Promise<AuthUser | null> {
  const token = await getAuthCookieValue();
  if (!token) return null;

  try {
    const data = await serverApiFetch<{
      authenticated: boolean;
      user: AuthUser | null;
    }>("/auth/me");
    return data?.authenticated ? data.user : null;
  } catch {
    return null;
  }
}

export async function requireServerUser(returnTo = "/study"): Promise<AuthUser> {
  const user = await getServerSession();
  if (!user) {
    const safeNext = sanitizeNextPath(returnTo, "/study");
    redirect(`/login?next=${encodeURIComponent(safeNext)}`);
  }
  return user;
}
