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

export function isSyncRunning() {
  return syncInProgress;
}

export async function ensureWebSourcesUpserted() {
  for (const src of webSourcesData) {
    await WebSource.updateOne(
      { key: src.key },
      {
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
      { upsert: true }
    );
  }
}

export async function getSyncFreshness() {
  const lastLog = await SyncLog.findOne()
    .sort({ finishedAt: -1 })
    .select("finishedAt status triggeredBy")
    .lean();

  const lastSyncAt = lastLog?.finishedAt || null;
  const staleMs = env.AUTO_SYNC_STALE_MINUTES * 60_000;
  const isStale =
    !lastSyncAt || Date.now() - new Date(lastSyncAt).getTime() >= staleMs;

  return {
    lastSyncAt,
    isStale,
    syncRunning: syncInProgress,
  };
}

let lastAutoTriggerMs = 0;

export async function triggerStaleSyncInBackground(triggeredBy = "auto") {
  if (syncInProgress) return false;
  const now = Date.now();
  const minCooldownMs = env.PUBLIC_SYNC_COOLDOWN_SEC * 1000;
  if (now - lastAutoTriggerMs < minCooldownMs) return false;

  const { isStale } = await getSyncFreshness();
  if (!isStale) return false;

  lastAutoTriggerMs = now;
  setTimeout(() => {
    runLiveWebSync({ triggeredBy }).catch((err) => {
      console.error("[AutoSync] Background sync error:", err?.message || err);
    });
  }, 0);
  return true;
}

function runAdapter(adapterType, payload, source) {
  switch (adapterType) {
    case "npf-table":
      return parseNpfTable(payload, source, 25);
    case "teletalk-api":
      return parseTeletalkJobs(payload, source, 400);
    case "bb-erecruitment":
      return parseBbErecruitment(payload, source, 25);
    case "rss-feed":
      return parseRssCurrentAffairs(payload, source, 15);
    default:
      throw new Error(`Unsupported adapter type: ${adapterType}`);
  }
}

export async function syncSingleSource(source) {
  const rawContent = await fetchPublicHtml(source.url);
  // Awaited: most adapters are synchronous, but a paginating one (teletalk-api)
  // returns a promise. Awaiting a non-promise is a no-op for the others.
  const parsedItems = await runAdapter(source.adapterType, rawContent, source);

  let newInserted = 0;
  let updatedCount = 0;

  if (source.targetType === "current_affairs" || source.adapterType === "rss-feed") {
    for (const item of parsedItems) {
      const existing = await CurrentAffairsItem.findOne({
        sourceHash: item.sourceHash,
      })
        .select("_id")
        .lean();

      if (!existing) {
        await CurrentAffairsItem.create(item);
        newInserted += 1;
      } else {
        await CurrentAffairsItem.updateOne(
          { _id: existing._id },
          { $set: { title: item.title, summary: item.summary, topic: item.topic } }
        );
        updatedCount += 1;
      }
    }
  } else {
    for (const item of parsedItems) {
      const existing = await JobCircular.findOne({ sourceHash: item.sourceHash })
        .select("_id")
        .lean();

      if (!existing) {
        await JobCircular.create(item);
        newInserted += 1;
      } else {
        const updateFields = {
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
          updateFields.pdfUrl = item.pdfUrl;
        }
        await JobCircular.updateOne(
          { _id: existing._id },
          { $set: updateFields }
        );
        updatedCount += 1;
      }
    }
  }

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
} = {}) {
  if (syncInProgress) {
    return {
      skipped: true,
      message: "A live web sync job is already running. Please wait a few seconds.",
    };
  }

  syncInProgress = true;
  const startedAt = new Date();
  const errors = [];
  const sourceResults = [];
  let totalFetched = 0;
  let newInserted = 0;
  let updatedCount = 0;

  try {
    const query = { enabled: true };
    if (sourceKey) query.key = sourceKey;
    if (targetType) query.targetType = targetType;

    const sources = await WebSource.find(query).sort({ name: 1 });
    const CONCURRENCY = Math.min(8, Math.max(1, sources.length));
    let cursor = 0;

    async function runWorker() {
      while (cursor < sources.length) {
        const index = cursor++;
        const source = sources[index];
        try {
          const result = await syncSingleSource(source);
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
          );
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => runWorker()));

    const finishedAt = new Date();
    const status =
      errors.length === 0
        ? "success"
        : sourceResults.length > 0
        ? "partial"
        : "failed";

    const log = await SyncLog.create({
      triggeredBy,
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      sourcesChecked: sources.length,
      totalFetched,
      newInserted,
      updatedCount,
      status,
      errors,
    });

    return {
      skipped: false,
      status,
      log,
      sourceResults,
      errors,
    };
  } finally {
    syncInProgress = false;
  }
}
