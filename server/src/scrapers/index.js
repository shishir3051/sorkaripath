import { JobCircular } from "../models/JobCircular.js";
import { CurrentAffairsItem } from "../models/CurrentAffairsItem.js";
import { WebSource } from "../models/WebSource.js";
import { SyncLog } from "../models/SyncLog.js";
import { fetchPublicHtml } from "./utils.js";
import { parseNpfTable } from "./adapters/npfTableAdapter.js";
import { parseBbErecruitment } from "./adapters/bbErecruitmentAdapter.js";
import { parseRssCurrentAffairs } from "./adapters/rssCurrentAffairsAdapter.js";

let syncInProgress = false;

export function isSyncRunning() {
  return syncInProgress;
}

function runAdapter(adapterType, payload, source) {
  switch (adapterType) {
    case "npf-table":
      return parseNpfTable(payload, source, 25);
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
  const parsedItems = runAdapter(source.adapterType, rawContent, source);

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
        await JobCircular.updateOne(
          { _id: existing._id },
          {
            $set: {
              title: item.title,
              pdfUrl: item.pdfUrl,
              detailUrl: item.detailUrl,
              deadlineDate: item.deadlineDate,
              deadlineRaw: item.deadlineRaw,
              publishedDate: item.publishedDate,
              publishedDateRaw: item.publishedDateRaw,
              summary: item.summary,
              highlights: item.highlights,
            },
          }
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
    const CONCURRENCY = Math.min(6, Math.max(1, sources.length));
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
