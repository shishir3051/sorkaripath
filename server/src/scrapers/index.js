import mongoose from "mongoose";
import { JobCircular } from "../models/JobCircular.js";
import { CurrentAffairsItem } from "../models/CurrentAffairsItem.js";
import { WebSource } from "../models/WebSource.js";
import { SyncLog } from "../models/SyncLog.js";
import { env } from "../config/env.js";
import { webSourcesData } from "../seed/data/webSources.js";
import { fetchPublicHtml } from "./utils.js";
import { parseNpfTable } from "./adapters/npfTableAdapter.js";
import { parseTeletalkJobs } from "./adapters/teletalkApiAdapter.js";
import { parseBbErecruitment } from "./adapters/bbErecruitmentAdapter.js";
import { parseRssCurrentAffairs } from "./adapters/rssCurrentAffairsAdapter.js";

let syncInProgress = false;
let sourcesEnsuredPromise = null;

const SYNC_LOCK_COLLECTION = "synclocks";
const SYNC_LOCK_ID = "live-web-sync";
const SYNC_LOCK_LEASE_MS = process.env.VERCEL ? 65_000 : 130_000;

export function isSyncRunning() {
  return syncInProgress;
}

export async function ensureWebSourcesUpserted() {
  if (!webSourcesData.length) return;
  const ops = webSourcesData.map((src) => ({
    updateOne: {
      filter: { key: src.key },
      update: {
        $set: {
          name: src.name,
          organization: src.organization,
          organizationShort: src.organizationShort,
          url: src.url,
          adapterType: src.adapterType,
          targetType: src.targetType || "job",
          defaultCategory: src.defaultCategory,
        },
        $setOnInsert: {
          key: src.key,
          enabled: src.enabled ?? true,
        },
      },
      upsert: true,
    },
  }));
  await WebSource.bulkWrite(ops, { ordered: false });
}

async function ensureWebSourcesOnce() {
  if (!sourcesEnsuredPromise) {
    sourcesEnsuredPromise = ensureWebSourcesUpserted().catch((err) => {
      sourcesEnsuredPromise = null;
      throw err;
    });
  }
  return sourcesEnsuredPromise;
}

async function acquireDistributedSyncLock(ownerId) {
  try {
    const db = mongoose.connection?.db;
    if (!db) return true;
    const col = db.collection(SYNC_LOCK_COLLECTION);
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + SYNC_LOCK_LEASE_MS);

    await col.findOneAndUpdate(
      {
        _id: SYNC_LOCK_ID,
        $or: [{ lockedUntil: { $lte: now } }, { lockedUntil: null }],
      },
      {
        $set: {
          ownerId,
          lockedAt: now,
          lockedUntil,
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    return true;
  } catch (err) {
    // Duplicate key error (11000) means another active instance holds an unexpired lease.
    if (err?.code === 11000) {
      return false;
    }
    // Never block sync on unexpected lock-collection issues.
    return true;
  }
}

async function releaseDistributedSyncLock(ownerId) {
  try {
    const db = mongoose.connection?.db;
    if (!db) return;
    await db
      .collection(SYNC_LOCK_COLLECTION)
      .updateOne(
        { _id: SYNC_LOCK_ID, ownerId },
        { $set: { lockedUntil: new Date(0) } }
      );
  } catch {
    // Lease will expire automatically after SYNC_LOCK_LEASE_MS.
  }
}

async function isDistributedSyncLocked() {
  try {
    const db = mongoose.connection?.db;
    if (!db) return false;
    const doc = await db
      .collection(SYNC_LOCK_COLLECTION)
      .findOne({ _id: SYNC_LOCK_ID });
    return Boolean(doc?.lockedUntil && new Date(doc.lockedUntil) > new Date());
  } catch {
    return false;
  }
}

export async function getSyncFreshness() {
  const [lastLog, distributedLocked] = await Promise.all([
    SyncLog.findOne()
      .sort({ finishedAt: -1 })
      .select("finishedAt status triggeredBy")
      .lean(),
    isDistributedSyncLocked(),
  ]);

  const lastSyncAt = lastLog?.finishedAt || null;
  const staleMs = env.AUTO_SYNC_STALE_MINUTES * 60_000;
  const isStale =
    !lastSyncAt || Date.now() - new Date(lastSyncAt).getTime() >= staleMs;

  return {
    lastSyncAt,
    isStale,
    syncRunning: syncInProgress || distributedLocked,
    staleMinutes: env.AUTO_SYNC_STALE_MINUTES,
  };
}

let lastAutoTriggerMs = 0;

export async function triggerStaleSyncInBackground(triggeredBy = "auto") {
  if (syncInProgress) return false;
  const now = Date.now();
  const minCooldownMs = env.PUBLIC_SYNC_COOLDOWN_SEC * 1000;
  if (now - lastAutoTriggerMs < minCooldownMs) return false;

  const { isStale, syncRunning } = await getSyncFreshness();
  if (!isStale || syncRunning) return false;

  lastAutoTriggerMs = now;
  setTimeout(() => {
    runLiveWebSync({ triggeredBy }).catch((err) => {
      console.error("[AutoSync] Background sync error:", err?.message || err);
    });
  }, 0);
  return true;
}

async function getExistingJobDocs(hashes = []) {
  const uniqueHashes = Array.from(new Set(hashes.filter(Boolean)));
  if (uniqueHashes.length === 0) return new Map();

  const docs = await JobCircular.find({ sourceHash: { $in: uniqueHashes } })
    .select("sourceHash pdfUrl")
    .lean();

  const map = new Map();
  for (const doc of docs) {
    if (doc.sourceHash) {
      map.set(doc.sourceHash, doc);
    }
  }
  return map;
}

function dedupeBySourceHash(items = []) {
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    if (!item?.sourceHash || seen.has(item.sourceHash)) continue;
    seen.add(item.sourceHash);
    unique.push(item);
  }
  return unique;
}

async function upsertCurrentAffairsBatch(parsedItems = []) {
  const uniqueItems = dedupeBySourceHash(parsedItems);
  if (uniqueItems.length === 0) {
    return { newInserted: 0, updatedCount: 0 };
  }

  const bulkOps = uniqueItems.map((item) => ({
    updateOne: {
      filter: { sourceHash: item.sourceHash },
      update: {
        $set: {
          title: item.title,
          summary: item.summary,
          topic: item.topic,
        },
        $setOnInsert: {
          language: item.language,
          sourceKey: item.sourceKey,
          sourceName: item.sourceName,
          url: item.url,
          publishedDate: item.publishedDate,
          examRelevanceNote: item.examRelevanceNote,
        },
      },
      upsert: true,
    },
  }));

  const res = await CurrentAffairsItem.bulkWrite(bulkOps, { ordered: false });
  return {
    newInserted: res.upsertedCount || 0,
    updatedCount: res.matchedCount || 0,
  };
}

async function upsertJobCircularsBatch(parsedItems = []) {
  const uniqueItems = dedupeBySourceHash(parsedItems);
  if (uniqueItems.length === 0) {
    return { newInserted: 0, updatedCount: 0 };
  }

  const bulkOps = uniqueItems.map((item) => {
    const setFields = {
      title: item.title,
      recordType: item.recordType,
      category: item.category,
      detailUrl: item.detailUrl,
      deadlineDate: item.deadlineDate,
      deadlineRaw: item.deadlineRaw,
      publishedDate: item.publishedDate,
      publishedDateRaw: item.publishedDateRaw,
      summary: item.summary,
      highlights: item.highlights,
    };
    if (item.pdfUrl) {
      setFields.pdfUrl = item.pdfUrl;
    }

    const setOnInsertFields = {
      titleBn: item.titleBn ?? "",
      slug: item.slug,
      origin: item.origin || "web_sync",
      organization: item.organization,
      organizationShort: item.organizationShort ?? "",
      gradeRange: item.gradeRange ?? "As per Circular",
      payScale2026: item.payScale2026 ?? "National Pay Scale 2026",
      vacancies: item.vacancies ?? "See Official Circular",
      ageLimit:
        item.ageLimit ?? "21 - 32 years (standard govt rules; check PDF)",
      educationRequired:
        item.educationRequired ??
        "Check official attachment for post-wise qualifications",
      applicationFee: item.applicationFee ?? "As per official notice",
      applyUrl: item.applyUrl ?? "",
      sourceId: item.sourceId ?? "",
      sourceName: item.sourceName ?? "",
      applicationSteps: item.applicationSteps ?? [],
      relatedLessonSlugs: item.relatedLessonSlugs ?? [],
      tags: item.tags ?? [],
      isFeatured: Boolean(item.isFeatured),
      isActive: item.isActive ?? true,
    };
    if (!item.pdfUrl) {
      setOnInsertFields.pdfUrl = "";
    }

    return {
      updateOne: {
        filter: { sourceHash: item.sourceHash },
        update: {
          $set: setFields,
          $setOnInsert: setOnInsertFields,
        },
        upsert: true,
      },
    };
  });

  const res = await JobCircular.bulkWrite(bulkOps, { ordered: false });
  return {
    newInserted: res.upsertedCount || 0,
    updatedCount: res.matchedCount || 0,
  };
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

function runAdapter(adapterType, payload, source, adapterContext) {
  switch (adapterType) {
    case "npf-table":
      return parseNpfTable(payload, source, 25, adapterContext);
    case "teletalk-api":
      return parseTeletalkJobs(payload, source, 400, adapterContext);
    case "bb-erecruitment":
      return parseBbErecruitment(payload, source, 25);
    case "rss-feed":
      return parseRssCurrentAffairs(payload, source, 15);
    default:
      throw new Error(`Unsupported adapter type: ${adapterType}`);
  }
}

export async function syncSingleSource(source, options = {}) {
  const isServerless = Boolean(process.env.VERCEL);
  const fetchTimeoutMs =
    options.fetchTimeoutMs ??
    (isServerless
      ? Math.min(env.SCRAPER_TIMEOUT_MS, 7000)
      : env.SCRAPER_TIMEOUT_MS);

  const rawContent = await fetchPublicHtml(source.url, {
    timeoutMs: fetchTimeoutMs,
  });

  const adapterContext = {
    getExistingJobDocs,
    pageTimeoutMs: isServerless ? 6000 : 8000,
    maxPortalPdfLookups: isServerless ? 8 : 20,
    pdfBudgetMs: isServerless ? 6000 : 15000,
    maxDetailPdfLookups: isServerless ? 6 : 15,
    detailBudgetMs: isServerless ? 4000 : 10000,
  };

  // Awaited: most adapters are synchronous, but paginating/detail-fetching ones return promises.
  const parsedItems = await runAdapter(
    source.adapterType,
    rawContent,
    source,
    adapterContext
  );

  const isCurrentAffairs =
    source.targetType === "current_affairs" || source.adapterType === "rss-feed";

  const { newInserted, updatedCount } = isCurrentAffairs
    ? await upsertCurrentAffairsBatch(parsedItems)
    : await upsertJobCircularsBatch(parsedItems);

  await WebSource.updateOne(
    { _id: source._id },
    {
      $set: {
        lastSyncAt: new Date(),
        lastStatus: "success",
        lastMessage: `Fetched ${parsedItems.length} items (${newInserted} new, ${updatedCount} refreshed)`,
        lastItemsFetched: parsedItems.length,
        lastNewItems: newInserted,
      },
      $inc: { totalItemsSynced: newInserted },
    }
  );

  return {
    sourceKey: source.key,
    sourceName: source.name,
    fetched: parsedItems.length,
    newInserted,
    updatedCount,
  };
}

export async function runLiveWebSync({
  triggeredBy = "manual",
  sourceKey = null,
  targetType = null,
  maxRunMs = null,
} = {}) {
  if (syncInProgress) {
    return {
      skipped: true,
      reason: "running",
      message:
        "A live web sync job is already running. Please wait a few seconds.",
    };
  }

  const ownerId = `${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const acquiredLock = await acquireDistributedSyncLock(ownerId);
  if (!acquiredLock) {
    return {
      skipped: true,
      reason: "running",
      message:
        "Another live web sync job is already running. Please wait a few seconds.",
    };
  }

  syncInProgress = true;
  const startedAt = new Date();
  const runStartMs = startedAt.getTime();
  const isServerless = Boolean(process.env.VERCEL);

  // Stay safely below Vercel's 60s function cap (and Next.js's ~25-30s rewrite proxy cap
  // for browser-triggered syncs) so SyncLog is always persisted cleanly.
  const effectiveMaxRunMs =
    maxRunMs ??
    (sourceKey
      ? isServerless
        ? 45_000
        : 90_000
      : isServerless
      ? triggeredBy === "cron"
        ? 42_000
        : 22_000
      : 120_000);

  const sourceTimeoutMs = isServerless
    ? triggeredBy === "cron"
      ? 16_000
      : 12_000
    : 30_000;

  const errors = [];
  const sourceResults = [];
  let totalFetched = 0;
  let newInserted = 0;
  let updatedCount = 0;
  let deferredSources = 0;

  try {
    await ensureWebSourcesOnce();

    const query = { enabled: true };
    if (sourceKey) query.key = sourceKey;
    if (targetType) query.targetType = targetType;

    // Prioritize never-synced or previously deferred sources first; among equally
    // due sources, start teletalk-api at t=0 so it runs in parallel with faster feeds.
    const rawSources = await WebSource.find(query)
      .sort({ lastSyncAt: 1, name: 1 })
      .lean();
    const newestSyncMs = rawSources.reduce(
      (max, s) =>
        s.lastSyncAt ? Math.max(max, new Date(s.lastSyncAt).getTime()) : max,
      0
    );
    const deferredThresholdMs = newestSyncMs - 120_000;
    const sources = [...rawSources].sort((a, b) => {
      const aTime = a.lastSyncAt ? new Date(a.lastSyncAt).getTime() : 0;
      const bTime = b.lastSyncAt ? new Date(b.lastSyncAt).getTime() : 0;
      const aUrgent = aTime === 0 || (newestSyncMs > 0 && aTime < deferredThresholdMs);
      const bUrgent = bTime === 0 || (newestSyncMs > 0 && bTime < deferredThresholdMs);
      if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
      if (!aUrgent && !bUrgent) {
        const aHeavy = a.adapterType === "teletalk-api" ? 0 : 1;
        const bHeavy = b.adapterType === "teletalk-api" ? 0 : 1;
        if (aHeavy !== bHeavy) return aHeavy - bHeavy;
      }
      if (aTime !== bTime) return aTime - bTime;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });

    const CONCURRENCY = Math.min(12, Math.max(1, sources.length));
    let cursor = 0;

    async function runWorker() {
      while (cursor < sources.length) {
        const elapsedMs = Date.now() - runStartMs;
        const remainingRunMs = effectiveMaxRunMs - elapsedMs;
        if (!sourceKey && remainingRunMs <= 2500) {
          break;
        }

        const index = cursor++;
        const source = sources[index];
        const perSourceBudget = sourceKey
          ? sourceTimeoutMs
          : Math.max(4000, Math.min(sourceTimeoutMs, remainingRunMs + 4000));

        try {
          const result = await withTimeout(
            syncSingleSource(source),
            perSourceBudget,
            `Sync ${source.key}`
          );
          sourceResults.push(result);
          totalFetched += result.fetched;
          newInserted += result.newInserted;
          updatedCount += result.updatedCount;
        } catch (err) {
          const message = err?.message || "Unknown fetch error";
          errors.push({
            sourceKey: source.key,
            sourceName: source.name,
            message,
          });
          await WebSource.updateOne(
            { _id: source._id },
            {
              $set: {
                lastSyncAt: new Date(),
                lastStatus: "error",
                lastMessage: message,
                lastItemsFetched: 0,
                lastNewItems: 0,
              },
            }
          ).catch(() => {});
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => runWorker()));
    deferredSources = Math.max(0, sources.length - cursor);

    const finishedAt = new Date();
    const sourcesChecked = sourceResults.length + errors.length;
    const status =
      errors.length === 0 && deferredSources === 0
        ? "success"
        : sourceResults.length > 0
        ? "partial"
        : "failed";

    const log = await SyncLog.create({
      triggeredBy,
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - runStartMs,
      sourcesChecked,
      totalFetched,
      newInserted,
      updatedCount,
      status,
      errors,
    });

    return {
      skipped: false,
      status,
      deferredSources,
      log,
      sourceResults,
      errors,
    };
  } finally {
    syncInProgress = false;
    await releaseDistributedSyncLock(ownerId);
  }
}
