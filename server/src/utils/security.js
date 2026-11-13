import crypto from "crypto";

export function safeSecretEqual(provided, expected) {
  if (typeof provided !== "string" || typeof expected !== "string") return false;
  if (!provided || !expected) return false;
  const a = crypto.createHash("sha256").update(provided, "utf8").digest();
  const b = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(a, b);
}

export function sanitizeHttpUrl(rawUrl, baseUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    const parsed = baseUrl
      ? new URL(rawUrl.trim(), baseUrl)
      : new URL(rawUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

export function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function capSearchQuery(rawQuery = "", maxLen = 100) {
  return String(rawQuery || "").trim().slice(0, maxLen);
}

const SESSION_ID_RX = /^[a-zA-Z0-9_-]{4,120}$/;
export function isValidSessionId(rawId = "") {
  return SESSION_ID_RX.test(String(rawId || "").trim());
}
