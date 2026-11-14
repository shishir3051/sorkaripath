import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { JobCircular } from "../models/JobCircular.js";
import { WebSource } from "../models/WebSource.js";
import { syncSingleSource } from "../scrapers/index.js";
import { cleanText, fetchPublicBinary, fetchPublicHtml } from "../scrapers/utils.js";
import {
  buildJobSearchTokenSets,
  buildTokenCondition,
} from "../utils/jobSearchQuery.js";
import { capSearchQuery, sanitizeHttpUrl } from "../utils/security.js";

const DEFAULT_MODEL_FALLBACKS = [
  "gemini-4-hydrogen",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

const DISCOVERY_CACHE = new Map();
const DISCOVERY_CACHE_TTL_MS = 5 * 60_000;
const DISCOVERY_CACHE_MAX = 80;

const DETAIL_INTENT_REGEX =
  /deadline|last\s*date|fee|post|vacanc|eligib|qualif|education|age|apply|website|salary|grade|how\s*to|বেতন|যোগ্যতা|ফি|তারিখ|আবেদন|পদ|বয়স|বয়স|শূন্য/i;

export function getGeminiModelChain() {
  const seen = new Set();
  const chain = [];
  for (const m of [env.GEMINI_MODEL, ...DEFAULT_MODEL_FALLBACKS]) {
    const trimmed = String(m || "").trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      chain.push(trimmed);
    }
  }
  return chain;
}

export function getAiCapabilityStatus() {
  const chain = getGeminiModelChain();
  return {
    configured: Boolean(env.GEMINI_API_KEY),
    primaryModel: chain[0] || "gemini-4-hydrogen",
    fallbackModels: chain.slice(1),
  };
}

let cachedClient = null;
let cachedKey = "";

function getGeminiClient() {
  if (!env.GEMINI_API_KEY) {
    const err = new Error(
      "Gemini AI is not configured on the server yet. Set GEMINI_API_KEY in environment variables."
    );
    err.statusCode = 503;
    throw err;
  }
  if (!cachedClient || cachedKey !== env.GEMINI_API_KEY) {
    cachedClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    cachedKey = env.GEMINI_API_KEY;
  }
  return cachedClient;
}

function getDhakaTodayString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function safeParseJsonText(rawText) {
  const cleaned = String(rawText || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function isRetryableModelError(err) {
  const status = Number(err?.status || err?.code || 0);
  if ([404, 429, 500, 502, 503, 504].includes(status)) return true;
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("quota") ||
    msg.includes("deadline") ||
    msg.includes("high demand") ||
    msg.includes("timed out") ||
    msg.includes("not found") ||
    msg.includes("not supported")
  );
}

async function generateJsonWithGemini({ contents, timeoutMs = 20000 }) {
  const ai = getGeminiClient();
  const models = getGeminiModelChain();
  let lastError = null;

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: "application/json",
          abortSignal: controller.signal,
        },
      });
      const data = safeParseJsonText(response.text);
      return { data, modelUsed: model };
    } catch (err) {
      lastError = err;
      if (!isRetryableModelError(err) && err?.name !== "AbortError") {
        break;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  const msg =
    lastError?.name === "AbortError"
      ? "Gemini AI request timed out. Please try again."
      : "Gemini AI service is temporarily busy or quota-limited. Please try again shortly.";
  const wrapped = new Error(msg);
  wrapped.statusCode = 502;
  throw wrapped;
}

function selectTargetSourcesForQuery(sources, tokens) {
  if (!sources.length) return [];
  if (!tokens.length) {
    return sources.slice(0, 4);
  }

  const tokenConditions = tokens.map(buildTokenCondition);
  const scored = sources
    .map((src) => {
      const hay = `${src.key} ${src.name} ${src.organization} ${src.organizationShort} ${src.defaultCategory}`;
      let score = 0;
      for (const cond of tokenConditions) {
        const regex = cond.$or[0].title;
        if (regex.test(hay)) score += 1;
      }
      return { src, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.src);

  return scored;
}

async function runTargetedLiveScrape(query, { liveRefresh = false } = {}) {
  const tokens = buildJobSearchTokenSets(query, 160);
  const allJobSources = await WebSource.find({
    enabled: true,
    targetType: "job",
  })
    .sort({ lastSyncAt: 1 })
    .lean();

  let selected = selectTargetSourcesForQuery(allJobSources, tokens);
  const priorityKeys = [
    "bpsc-notices",
    "bb-bsc-notices",
    "bdpost-notices",
    "dpe-notices",
    "ntrca-notices",
    "dgfood-notices",
  ];

  if (selected.length === 0 && liveRefresh) {
    selected = allJobSources
      .filter((s) => priorityKeys.includes(s.key))
      .slice(0, 5);
  }

  // Only re-scrape sources that aren't very fresh (< 5 min old unless explicitly requested)
  const freshnessCutoff = Date.now() - (liveRefresh ? 60_000 : 5 * 60_000);
  const staleTargets = selected.filter(
    (s) => !s.lastSyncAt || new Date(s.lastSyncAt).getTime() < freshnessCutoff
  );

  if (staleTargets.length === 0) {
    return { sourcesRefreshed: 0, liveItemsSynced: 0, checkedSourceNames: [] };
  }

  const results = await Promise.allSettled(
    staleTargets.map((src) => syncSingleSource(src))
  );

  let sourcesRefreshed = 0;
  let liveItemsSynced = 0;
  const checkedSourceNames = [];

  results.forEach((res, idx) => {
    if (res.status === "fulfilled") {
      sourcesRefreshed += 1;
      liveItemsSynced += (res.value.newInserted || 0) + (res.value.updatedCount || 0);
      checkedSourceNames.push(staleTargets[idx].organizationShort || staleTargets[idx].name);
    }
  });

  return { sourcesRefreshed, liveItemsSynced, checkedSourceNames };
}

function toCompactPromptCircular(doc) {
  return {
    slug: doc.slug,
    origin: doc.origin,
    recordType: doc.recordType,
    category: doc.category,
    organization: doc.organization,
    organizationShort: doc.organizationShort,
    title: doc.title,
    titleBn: doc.titleBn || "",
    publishedDate: doc.publishedDate
      ? new Date(doc.publishedDate).toISOString().slice(0, 10)
      : doc.publishedDateRaw || "",
    deadline: doc.deadlineDate
      ? new Date(doc.deadlineDate).toISOString().slice(0, 10)
      : doc.deadlineRaw || "See official PDF",
    vacancies: doc.vacancies,
    applicationFee: doc.applicationFee,
    gradeRange: doc.gradeRange,
    educationRequired: doc.educationRequired,
    applyUrl: doc.applyUrl || "",
    pdfUrl: doc.pdfUrl || "",
    summary: String(doc.summary || "").slice(0, 320),
    aiExtractedDetails: doc.aiExtraction?.extractedAt
      ? {
          totalVacancies: doc.aiExtraction.totalVacancies,
          positions: doc.aiExtraction.positions?.slice(0, 6),
          applyDeadline: doc.aiExtraction.applyDeadline,
          applicationFee: doc.aiExtraction.applicationFee,
          applyWebsite: doc.aiExtraction.applyWebsite,
          summaryEn: doc.aiExtraction.summaryEn,
        }
      : null,
  };
}

function toClientCircularSummary(doc) {
  return {
    _id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    titleBn: doc.titleBn || "",
    origin: doc.origin,
    recordType: doc.recordType,
    category: doc.category,
    organization: doc.organization,
    organizationShort: doc.organizationShort,
    publishedDate: doc.publishedDate,
    publishedDateRaw: doc.publishedDateRaw || "",
    deadlineDate: doc.deadlineDate || null,
    deadlineRaw: doc.deadlineRaw || "",
    vacancies: doc.vacancies,
    applicationFee: doc.applicationFee,
    applyUrl: doc.applyUrl || "",
    pdfUrl: doc.pdfUrl || "",
    aiExtracted: Boolean(doc.aiExtraction?.extractedAt),
  };
}

async function fetchCircularAttachmentParts(job) {
  const safePdfUrl = sanitizeHttpUrl(job.pdfUrl);
  if (safePdfUrl) {
    try {
      const { buffer, contentType } = await fetchPublicBinary(safePdfUrl, {
        maxBytes: 9 * 1024 * 1024,
        timeoutMs: 18000,
      });
      const isPdfMagic = buffer.subarray(0, 4).toString("latin1") === "%PDF";
      if (isPdfMagic || contentType.toLowerCase().includes("pdf")) {
        return {
          mode: "pdf",
          part: {
            inlineData: {
              mimeType: "application/pdf",
              data: buffer.toString("base64"),
            },
          },
          detailSnippet: "",
        };
      }
    } catch {
      // Fall back safely to detailUrl / metadata text below
    }
  }

  const safeDetailUrl = sanitizeHttpUrl(job.detailUrl);
  if (safeDetailUrl) {
    try {
      const html = await fetchPublicHtml(safeDetailUrl);
      const $ = cheerio.load(html);
      $("script, style, nav, header, footer").remove();
      const text = cleanText($("main, #content, .content, body").text()).slice(
        0,
        12000
      );
      if (text) {
        return { mode: "html", part: null, detailSnippet: text };
      }
    } catch {
      // Fallback cleanly to stored record metadata
    }
  }

  return { mode: "metadata", part: null, detailSnippet: "" };
}

function buildSafeApplyDeadline(isoStr) {
  if (!isoStr || typeof isoStr !== "string") return null;
  const trimmed = isoStr.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T17:00:00+06:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isPlaceholderValue(current, placeholders) {
  const clean = String(current || "").trim();
  if (!clean) return true;
  return placeholders.some((p) => clean.toLowerCase().includes(p));
}

export async function analyzeCircularPdfWithAi(slug, { forceRefresh = false } = {}) {
  const job = await JobCircular.findOne({ slug, isActive: true });
  if (!job) {
    const err = new Error("Job circular or notice not found");
    err.statusCode = 404;
    throw err;
  }

  if (job.aiExtraction?.extractedAt && !forceRefresh) {
    return {
      job: job.toObject(),
      aiExtraction: job.aiExtraction,
      cached: true,
      sourceMode: "cached",
      modelUsed: job.aiExtraction.modelUsed || getGeminiModelChain()[0],
    };
  }

  const attachment = await fetchCircularAttachmentParts(job);
  const promptText = `You are a strictly factual Bangladesh government recruitment analyst.
Extract details ONLY from the provided official attachment/notice context. NEVER guess or invent numbers, dates, or URLs that are not printed. If something is absent or unclear, return "".

Known Record Context:
- Organization: ${job.organization}
- Title: ${job.title}
- Published: ${job.publishedDateRaw || (job.publishedDate ? new Date(job.publishedDate).toISOString().slice(0, 10) : "")}
- Existing Summary: ${job.summary}
${attachment.detailSnippet ? `\nOfficial Notice Page Text:\n${attachment.detailSnippet}` : ""}

Return strictly valid JSON with these exact keys:
{
  "summaryEn": "2-4 clear sentences in English summarizing what this notice/circular announces (posts, apply window, fee, target candidates).",
  "summaryBn": "1-3 concise sentences in Bengali (বাংলা) summarizing this notice accurately.",
  "totalVacancies": "Exact total number of posts/vacancies if stated (e.g. '169 posts (36 categories)'), else ''",
  "positions": ["Up to 10 key post names with grade & vacancy count if printed"],
  "educationSummary": "Brief summary of educational qualifications required if stated, else ''",
  "ageRequirement": "Exact age limit / cutoff date rule if stated (e.g. '18-32 years as of 10 Dec 2026'), else ''",
  "applicationFee": "Teletalk / bank fee details by grade if stated, else ''",
  "applyStartDate": "Application start date/time if stated, else ''",
  "applyDeadline": "Application last date/time as human-readable text if stated, else ''",
  "applyDeadlineIso": "Deadline in YYYY-MM-DD format if a clear application end date exists, else ''",
  "applyWebsite": "Official online application URL printed in the notice (must start with http:// or https://), else ''",
  "keyInstructions": ["Up to 6 concise practical applicant rules / SMS / document instructions printed in the notice"]
}`;

  const contents = attachment.part
    ? [{ role: "user", parts: [attachment.part, { text: promptText }] }]
    : promptText;

  const { data: raw, modelUsed } = await generateJsonWithGemini({
    contents,
    timeoutMs: 32000,
  });

  const safeWebsite = sanitizeHttpUrl(raw?.applyWebsite || "");
  const cleanStr = (val, max = 600) =>
    String(val || "").replace(/\s+/g, " ").trim().slice(0, max);
  const cleanList = (arr, limit = 10, maxItem = 240) =>
    Array.isArray(arr)
      ? arr
          .map((item) => cleanStr(item, maxItem))
          .filter(Boolean)
          .slice(0, limit)
      : [];

  const extraction = {
    extractedAt: new Date(),
    modelUsed,
    summaryEn: cleanStr(raw?.summaryEn, 1500),
    summaryBn: cleanStr(raw?.summaryBn, 1500),
    totalVacancies: cleanStr(raw?.totalVacancies, 160),
    positions: cleanList(raw?.positions, 12, 200),
    educationSummary: cleanStr(raw?.educationSummary, 500),
    ageRequirement: cleanStr(raw?.ageRequirement, 240),
    applicationFee: cleanStr(raw?.applicationFee, 240),
    applyStartDate: cleanStr(raw?.applyStartDate, 120),
    applyDeadline: cleanStr(raw?.applyDeadline, 120),
    applyWebsite: safeWebsite,
    keyInstructions: cleanList(raw?.keyInstructions, 6, 280),
  };

  job.aiExtraction = extraction;

  // Backfill placeholder fields cleanly when official PDF reveals real details
  if (
    extraction.totalVacancies &&
    isPlaceholderValue(job.vacancies, [
      "see official circular",
      "see official pdf",
      "see circular",
      "check pdf",
    ])
  ) {
    job.vacancies = extraction.totalVacancies;
  }
  if (
    extraction.applicationFee &&
    isPlaceholderValue(job.applicationFee, ["as per official", "as per circular"])
  ) {
    job.applicationFee = extraction.applicationFee;
  }
  if (
    extraction.ageRequirement &&
    isPlaceholderValue(job.ageLimit, ["check pdf", "standard govt rules"])
  ) {
    job.ageLimit = extraction.ageRequirement;
  }
  if (
    extraction.educationSummary &&
    isPlaceholderValue(job.educationRequired, ["check official attachment"])
  ) {
    job.educationRequired = extraction.educationSummary;
  }
  if (
    safeWebsite &&
    (!job.applyUrl || (job.detailUrl && job.applyUrl === job.detailUrl))
  ) {
    job.applyUrl = safeWebsite;
  }
  if (
    extraction.applyDeadline &&
    isPlaceholderValue(job.deadlineRaw, [
      "check official",
      "see official",
      "see circular",
      "check pdf",
    ])
  ) {
    job.deadlineRaw = extraction.applyDeadline;
  }
  const parsedDeadline = buildSafeApplyDeadline(raw?.applyDeadlineIso);
  if (parsedDeadline && !job.deadlineDate) {
    job.deadlineDate = parsedDeadline;
  }
  if (
    extraction.summaryEn &&
    String(job.summary || "").startsWith("Official ")
  ) {
    job.summary = extraction.summaryEn;
  }
  if (
    extraction.keyInstructions.length > 0 &&
    job.origin === "web_sync"
  ) {
    job.highlights = extraction.keyInstructions;
  }

  await job.save();
  DISCOVERY_CACHE.clear();

  return {
    job: job.toObject(),
    aiExtraction: job.aiExtraction,
    cached: false,
    sourceMode: attachment.mode,
    modelUsed,
  };
}

function setDiscoveryCache(cacheKey, value) {
  if (DISCOVERY_CACHE.size >= DISCOVERY_CACHE_MAX) {
    const oldestKey = DISCOVERY_CACHE.keys().next().value;
    if (oldestKey) DISCOVERY_CACHE.delete(oldestKey);
  }
  DISCOVERY_CACHE.set(cacheKey, { expiresAt: Date.now() + DISCOVERY_CACHE_TTL_MS, value });
}

export async function discoverLatestCircularsWithAi({
  query,
  liveRefresh = false,
} = {}) {
  const cleanQuery = capSearchQuery(query, 240);
  if (!cleanQuery || cleanQuery.length < 2) {
    const err = new Error("Please enter a search question or keyword.");
    err.statusCode = 400;
    throw err;
  }

  const cacheKey = cleanQuery.toLowerCase();
  if (!liveRefresh) {
    const hit = DISCOVERY_CACHE.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) {
      return { ...hit.value, cached: true };
    }
  }

  // 1. Live scrape targeted matching official .gov.bd notice boards if stale or requested
  const liveSyncStats = await runTargetedLiveScrape(cleanQuery, { liveRefresh });

  // 2. Gather matching circulars + latest overall live circulars from MongoDB
  const tokens = buildJobSearchTokenSets(cleanQuery, 240);
  let matchedDocs = [];
  if (tokens.length > 0) {
    matchedDocs = await JobCircular.find({
      isActive: true,
      $and: tokens.map(buildTokenCondition),
    })
      .sort({ publishedDate: -1, updatedAt: -1 })
      .limit(14)
      .lean();

    if (matchedDocs.length === 0 && tokens.length > 1) {
      const perTokenResults = await Promise.all(
        tokens.map(async (tok) => {
          const exactOrgRegex = new RegExp(`^${tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
          const [directOrg, textMatch] = await Promise.all([
            JobCircular.find({ isActive: true, organizationShort: exactOrgRegex })
              .sort({ publishedDate: -1, updatedAt: -1 })
              .limit(3)
              .lean(),
            JobCircular.find({ isActive: true, ...buildTokenCondition(tok) })
              .sort({ publishedDate: -1, updatedAt: -1 })
              .limit(4)
              .lean(),
          ]);
          const seenTok = new Set();
          return [...directOrg, ...textMatch]
            .filter((d) => {
              const id = String(d._id);
              if (seenTok.has(id)) return false;
              seenTok.add(id);
              return true;
            })
            .slice(0, 4);
        })
      );
      const seenMatched = new Set();
      for (let round = 0; round < 4; round += 1) {
        for (const list of perTokenResults) {
          const item = list[round];
          if (!item) continue;
          const id = String(item._id);
          if (!seenMatched.has(id)) {
            seenMatched.add(id);
            matchedDocs.push(item);
          }
        }
      }
    }
  }

  // Prefer actual recruitment circulars when auto-inspecting PDF details
  const circularIdx = matchedDocs.findIndex(
    (d) => d.recordType === "circular" && sanitizeHttpUrl(d.pdfUrl)
  );
  const targetIdx =
    circularIdx >= 0
      ? circularIdx
      : matchedDocs.findIndex((d) => sanitizeHttpUrl(d.pdfUrl));

  if (
    DETAIL_INTENT_REGEX.test(cleanQuery) &&
    targetIdx >= 0 &&
    !matchedDocs[targetIdx].aiExtraction?.extractedAt
  ) {
    try {
      const enriched = await analyzeCircularPdfWithAi(matchedDocs[targetIdx].slug);
      matchedDocs[targetIdx] = enriched.job;
    } catch {
      // Non-fatal: still answer with available notice metadata
    }
  }

  const recentWebDocs = await JobCircular.find({
    isActive: true,
    origin: "web_sync",
  })
    .sort({ publishedDate: -1, updatedAt: -1 })
    .limit(14)
    .lean();

  const seenIds = new Set();
  const groundedDocs = [];
  for (const doc of [...matchedDocs, ...recentWebDocs]) {
    const id = String(doc._id);
    if (!seenIds.has(id)) {
      seenIds.add(id);
      groundedDocs.push(doc);
    }
    if (groundedDocs.length >= 24) break;
  }

  const bySlug = new Map(groundedDocs.map((d) => [d.slug, d]));
  const totalLiveCount = await JobCircular.countDocuments({
    isActive: true,
    origin: "web_sync",
  });

  const prompt = `You are SorkariPath AI — an official Bangladesh Government Job Circular & Notice Research Assistant.
Today's date in Dhaka (BST): ${getDhakaTodayString()}.
Total active live web-synced circulars currently indexed across official .gov.bd & Bangladesh Bank portals: ${totalLiveCount}.

User Request: "${cleanQuery}"

STRICT RULES:
1. Base all facts, dates, organizations, deadlines, fees, and post counts ONLY on the "Grounded Live Official Records" JSON below.
2. NEVER fabricate deadlines, vacancy counts, salary grades, or URLs not present in the records below.
3. If an official circular only shows a notice title/PDF and hasn't had its PDF parsed yet, clearly mention that full details are in the attached PDF and recommend clicking "Read Official PDF with Gemini AI" on that circular's detail page.
4. Select up to 6 most relevant circular slugs strictly copied from the "slug" field in the grounded list.

Grounded Live Official Records:
${JSON.stringify(groundedDocs.map(toCompactPromptCircular))}

Return strictly valid JSON with these exact keys:
{
  "answerEn": "Clear, helpful direct answer in English citing real circulars, organizations, and dates from the records above.",
  "answerBn": "Concise 1-2 sentence Bengali summary matching answerEn.",
  "highlights": ["Up to 5 short bullet insights (latest dates, open circulars, portal tips)"],
  "selectedSlugs": ["Exact slug strings from the grounded list ordered by relevance (max 6)"],
  "followUpQueries": ["3 useful next questions a Bangladeshi govt job candidate might ask"]
}`;

  const { data: raw, modelUsed } = await generateJsonWithGemini({
    contents: prompt,
    timeoutMs: 22000,
  });

  const cleanStr = (val, max = 1600) =>
    String(val || "").replace(/\s+/g, " ").trim().slice(0, max);

  const selectedSlugs = Array.isArray(raw?.selectedSlugs)
    ? raw.selectedSlugs.filter((s) => typeof s === "string" && bySlug.has(s)).slice(0, 6)
    : [];

  const matchedCirculars = (
    selectedSlugs.length > 0
      ? selectedSlugs.map((s) => bySlug.get(s))
      : matchedDocs.length > 0
      ? matchedDocs.slice(0, 5)
      : recentWebDocs.slice(0, 5)
  ).map(toClientCircularSummary);

  const payload = {
    query: cleanQuery,
    answerEn: cleanStr(raw?.answerEn, 2000),
    answerBn: cleanStr(raw?.answerBn, 1500),
    highlights: Array.isArray(raw?.highlights)
      ? raw.highlights.map((h) => cleanStr(h, 260)).filter(Boolean).slice(0, 5)
      : [],
    matchedCirculars,
    followUpQueries: Array.isArray(raw?.followUpQueries)
      ? raw.followUpQueries.map((q) => cleanStr(q, 140)).filter(Boolean).slice(0, 3)
      : [],
    meta: {
      modelUsed,
      groundedCount: groundedDocs.length,
      sourcesRefreshed: liveSyncStats.sourcesRefreshed,
      checkedSourceNames: liveSyncStats.checkedSourceNames,
      generatedAt: new Date().toISOString(),
    },
    cached: false,
  };

  setDiscoveryCache(cacheKey, payload);
  return payload;
}
