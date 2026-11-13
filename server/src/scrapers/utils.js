import crypto from "crypto";
import { env } from "../config/env.js";
import { sanitizeHttpUrl } from "../utils/security.js";

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

export function classifyRecord(title = "", defaultCategory = "General Notice", extraHint = "") {
  const hay = `${title} ${extraHint}`.toLowerCase();

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

export async function fetchPublicHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.SCRAPER_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "BDGovtJobAcademyBot/1.0 (+educational-public-notice-aggregator)",
        Accept:
          "application/rss+xml,application/xml,text/xml,text/html,application/xhtml+xml",
        "Accept-Language": "bn,en;q=0.9",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    // Respect anti-bot/CAPTCHA gates if ever encountered: abort cleanly instead of bypassing
    if (/cf-turnstile|g-recaptcha|hcaptcha|verify you are human/i.test(html)) {
      throw new Error("Source presented a human-verification challenge; skipped");
    }

    return html;
  } finally {
    clearTimeout(timeout);
  }
}
