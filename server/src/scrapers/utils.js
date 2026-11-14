import crypto from "crypto";
import https from "https";
import tls from "tls";
import { env } from "../config/env.js";
import { sanitizeHttpUrl } from "../utils/security.js";
import { PUBLIC_INTERMEDIATE_CAS } from "./intermediateCas.js";

const BN_DIGITS = {
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

export function bnToEnDigits(str = "") {
  return String(str).replace(/[০-৯]/g, (d) => BN_DIGITS[d] ?? d);
}

export function formatReadableBdDate(dateInput) {
  if (!dateInput) return "";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(d);
}

export function cleanText(str = "") {
  return String(str).replace(/\s+/g, " ").trim();
}

export function resolveUrl(baseUrl, maybeRelative) {
  return sanitizeHttpUrl(maybeRelative, baseUrl);
}

/**
 * Parse Bangladesh portal dates like "১৭-১০-২০২৬" (DD-MM-YYYY) or "13/11/2026" (DD/MM/YYYY)
 */
export function parseBdDate(raw = "", mode = "dmy") {
  const ascii = bnToEnDigits(cleanText(raw));
  if (!ascii) return null;

  const match = ascii.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (match) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    const year = Number(match[3]);
    let day = a;
    let month = b;

    if (mode === "mdy" && b <= 12 && a <= 12) {
      month = a;
      day = b;
    } else if (b > 12 && a <= 12) {
      month = a;
      day = b;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month - 1, day, 6, 0, 0));
    }
  }

  const parsed = new Date(ascii);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function createSourceHash(sourceKey, title, link = "") {
  const normalized = `${sourceKey}|${cleanText(title).toLowerCase()}|${cleanText(link)}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function makeSafeSlug(title, prefix, hash) {
  const asciiPart = cleanText(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const shortHash = hash.slice(0, 8);
  const cleanPrefix = String(prefix || "notice")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  return asciiPart
    ? `${cleanPrefix}-${asciiPart}-${shortHash}`
    : `${cleanPrefix}-notice-${shortHash}`;
}

function normalizeBengaliForMatch(str = "") {
  return String(str)
    .normalize("NFC")
    .replace(/\u09AF\u09BC/g, "\u09DF")
    .replace(/\u09A1\u09BC/g, "\u09DC")
    .replace(/\u09A2\u09BC/g, "\u09DD")
    .replace(/\u09C7\u09BE/g, "\u09CB")
    .replace(/\u09C7\u09D7/g, "\u09CC");
}

export function classifyRecord(title = "", defaultCategory = "General Notice", extraHint = "") {
  const hay = normalizeBengaliForMatch(`${title} ${extraHint}`).toLowerCase();

  let recordType = "notice";
  if (/result|ফলাফল|selected|সুপারিশ|মনোনীত|উত্তীর্ণ/.test(hay)) {
    recordType = "result";
  } else if (/admit|প্রবেশপত্র/.test(hay)) {
    recordType = "admit_card";
  } else if (/viva|মৌখিক|schedule|সময়সূচি|seat|আসন|written|লিখিত|mcq|preliminary|পরীক্ষার/.test(hay)) {
    recordType = "exam_schedule";
  } else if (/নিয়োগ বিজ্ঞপ্তি|নিয়োগ বিজ্ঞপ্তি|নিয়োগ সংক্রান্ত|নিয়োগ সংক্রান্ত|পদে নিয়োগ|পদে নিয়োগ|জনবল নিয়োগ|জনবল নিয়োগ|শূন্য\s*পদ|circular|recruitment|vacancy|vacancies|career opportunity|applications are invited|আবেদন আহ্বান/.test(hay)) {
    recordType = "circular";
  }

  let category = defaultCategory;
  if (/বিসিএস|\bbcs\b/.test(hay)) {
    category = "BCS";
  } else if (/bank|ব্যাংক|spcbl|financial|আর্থিক/.test(hay)) {
    category = "Bank & Financial";
  } else if (/শিক্ষক|teacher|ntrca|প্রাথমিক|primary|অধ্যক্ষ|প্রভাষক/.test(hay)) {
    category = "Teaching (Primary/NTRCA)";
  } else if (/পুলিশ|police|আনসার|bgb|র‍্যাব|সেনা|প্রতিরক্ষা/.test(hay)) {
    category = "Defense & Police";
  } else if (/প্রকৌশলী|engineer|কম্পিউটার|ict|কারিগরি|টেকনিক্যাল/.test(hay)) {
    category = "Engineering & Technical";
  } else if (/বিচার|judge|judicial|আইন|ম্যাজিস্ট্রেট/.test(hay)) {
    category = "Judicial & Legal";
  }

  return { recordType, category };
}

const SCRAPER_REQUEST_HEADERS = {
  "User-Agent":
    "BDGovtJobAcademyBot/1.0 (+educational-public-notice-aggregator)",
  Accept:
    "application/rss+xml,application/xml,text/xml,text/html,application/xhtml+xml",
  "Accept-Language": "bn,en;q=0.9",
};

const HUMAN_VERIFICATION_REGEX =
  /cf-turnstile|g-recaptcha|hcaptcha|verify you are human/i;

// Public Sectigo AIA intermediate CAs (strict TLS still enforced via rejectUnauthorized: true)
const intermediateCaAgent = new https.Agent({
  ca: [...tls.rootCertificates, ...PUBLIC_INTERMEDIATE_CAS],
  rejectUnauthorized: true,
  keepAlive: false,
});

function requestHttpsOnce(targetUrl, timeoutMs, maxBytes = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      targetUrl,
      {
        agent: intermediateCaAgent,
        headers: SCRAPER_REQUEST_HEADERS,
        timeout: timeoutMs,
      },
      (res) => {
        const statusCode = res.statusCode || 0;
        if (
          [301, 302, 303, 307, 308].includes(statusCode) &&
          res.headers.location
        ) {
          const nextLocation = res.headers.location;
          res.resume();
          resolve({ redirectLocation: nextLocation });
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          res.resume();
          reject(
            new Error(`HTTP ${statusCode} ${res.statusMessage || ""}`.trim())
          );
          return;
        }

        const chunks = [];
        let totalBytes = 0;

        res.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > maxBytes) {
            req.destroy(
              new Error(`Response exceeded ${Math.round(maxBytes / (1024 * 1024))}MB safety limit`)
            );
            return;
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: String(res.headers["content-type"] || ""),
          });
        });

        res.on("error", reject);
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Request timed out"));
    });
    req.on("error", reject);
  });
}

async function fetchHttpsWithIntermediateCas(
  startUrl,
  { maxRedirects = 4, timeoutMs = env.SCRAPER_TIMEOUT_MS, maxBytes = 8 * 1024 * 1024 } = {}
) {
  let currentUrl = startUrl;
  const deadline = Date.now() + timeoutMs;

  for (let step = 0; step <= maxRedirects; step += 1) {
    const safeUrl = sanitizeHttpUrl(currentUrl);
    if (!safeUrl || new URL(safeUrl).protocol !== "https:") {
      throw new Error("Blocked non-HTTPS redirect during strict TLS fetch");
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new Error("Request timed out");
    }

    const result = await requestHttpsOnce(safeUrl, remainingMs, maxBytes);
    if (result.redirectLocation) {
      if (step === maxRedirects) {
        throw new Error("Too many HTTPS redirects");
      }
      currentUrl = new URL(result.redirectLocation, safeUrl).toString();
      continue;
    }

    return result;
  }

  throw new Error("Too many HTTPS redirects");
}

function isMissingIntermediateError(err) {
  return (
    err?.cause?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    err?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
  );
}

/**
 * Fetches binary assets (such as official .gov.bd circular PDFs) with strict TLS + size limits.
 */
export async function fetchPublicBinary(
  url,
  { maxBytes = 9 * 1024 * 1024, timeoutMs = 15000 } = {}
) {
  const safeUrl = sanitizeHttpUrl(url);
  if (!safeUrl) {
    throw new Error("Invalid binary target URL");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(safeUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": SCRAPER_REQUEST_HEADERS["User-Agent"],
        Accept: "application/pdf,application/octet-stream,*/*",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const contentLength = Number(res.headers.get("content-length") || 0);
    if (contentLength > maxBytes) {
      throw new Error(
        `Attachment exceeds ${Math.round(maxBytes / (1024 * 1024))}MB safety limit`
      );
    }

    const arrayBuf = await res.arrayBuffer();
    if (arrayBuf.byteLength > maxBytes) {
      throw new Error(
        `Attachment exceeds ${Math.round(maxBytes / (1024 * 1024))}MB safety limit`
      );
    }

    return {
      buffer: Buffer.from(arrayBuf),
      contentType: String(res.headers.get("content-type") || ""),
    };
  } catch (err) {
    if (isMissingIntermediateError(err) && safeUrl.startsWith("https://")) {
      return await fetchHttpsWithIntermediateCas(safeUrl, { maxBytes, timeoutMs });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPublicHtml(url) {
  const safeUrl = sanitizeHttpUrl(url);
  if (!safeUrl) {
    throw new Error("Invalid scraper target URL");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.SCRAPER_TIMEOUT_MS);

  try {
    const res = await fetch(safeUrl, {
      signal: controller.signal,
      headers: SCRAPER_REQUEST_HEADERS,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    // Respect anti-bot/CAPTCHA gates if ever encountered: abort cleanly instead of bypassing
    if (HUMAN_VERIFICATION_REGEX.test(html)) {
      throw new Error("Source presented a human-verification challenge; skipped");
    }

    return html;
  } catch (err) {
    // Some valid .gov.bd nginx hosts omit public Sectigo intermediate CA certs in their TLS handshake.
    // Retry using strict TLS (rejectUnauthorized: true) augmented with those verified public intermediate CAs.
    if (isMissingIntermediateError(err) && safeUrl.startsWith("https://")) {
      const { buffer } = await fetchHttpsWithIntermediateCas(safeUrl);
      const html = buffer.toString("utf8");
      if (HUMAN_VERIFICATION_REGEX.test(html)) {
        throw new Error("Source presented a human-verification challenge; skipped");
      }
      return html;
    }

    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
