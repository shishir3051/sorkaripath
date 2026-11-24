import { WebSource } from "../models/WebSource.js";
import { SyncLog } from "../models/SyncLog.js";
import {
  getSyncFreshness,
  runLiveWebSync,
} from "../scrapers/index.js";
import { env } from "../config/env.js";
import { safeSecretEqual } from "../utils/security.js";
import { resolveUserFromRequest } from "../middleware/auth.js";

export async function getSyncStatus(req, res, next) {
  try {
    const [sources, logs, syncMeta] = await Promise.all([
      WebSource.find().sort({ name: 1 }).lean(),
      SyncLog.find().sort({ finishedAt: -1 }).limit(12).lean(),
      getSyncFreshness(),
    ]);

    res.json({
      success: true,
      data: {
        syncRunning: syncMeta.syncRunning,
        syncMeta,
        sources,
        logs,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function triggerWebSync(req, res, next) {
  try {
    const adminHeader = req.header("x-admin-key") || "";
    const authUser = await resolveUserFromRequest(req);
    const hasValidAdmin =
      safeSecretEqual(adminHeader, env.ADMIN_API_KEY) ||
      authUser?.role === "admin";

    const rawTrigger = req.body?.triggeredBy
      ? String(req.body.triggeredBy).trim().toLowerCase()
      : "manual";
    const triggeredBy = rawTrigger === "auto" ? "auto" : "manual";

    // Automatic freshness checks from the UI skip quietly with 200 when data is already fresh
    // or another serverless instance is currently syncing.
    if (triggeredBy === "auto") {
      const freshness = await getSyncFreshness();
      if (!freshness.isStale) {
        return res.json({
          success: true,
          data: {
            skipped: true,
            reason: "fresh",
            lastSyncAt: freshness.lastSyncAt,
            message: "Circulars were synced recently.",
          },
        });
      }
      if (freshness.syncRunning) {
        return res.json({
          success: true,
          data: {
            skipped: true,
            reason: "running",
            lastSyncAt: freshness.lastSyncAt,
            message: "A live web sync is already in progress.",
          },
        });
      }
    }

    if (!hasValidAdmin && env.PUBLIC_SYNC_COOLDOWN_SEC > 0) {
      const lastSync = await SyncLog.findOne()
        .sort({ finishedAt: -1 })
        .select("finishedAt")
        .lean();

      if (lastSync?.finishedAt) {
        const elapsedMs = Date.now() - new Date(lastSync.finishedAt).getTime();
        const cooldownMs = env.PUBLIC_SYNC_COOLDOWN_SEC * 1000;
        if (elapsedMs >= 0 && elapsedMs < cooldownMs) {
          const waitSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
          if (triggeredBy === "auto") {
            return res.json({
              success: true,
              data: {
                skipped: true,
                reason: "cooldown",
                lastSyncAt: lastSync.finishedAt,
                message: `Sync cooldown active (${waitSec}s remaining).`,
              },
            });
          }
          res.set("Retry-After", String(waitSec));
          return res.status(429).json({
            success: false,
            message: `Live sync ran recently. Public sync cooldown active (${waitSec}s remaining).`,
          });
        }
      }
    }

    const rawSourceKey = req.body?.sourceKey ? String(req.body.sourceKey).trim() : null;
    const sourceKey =
      rawSourceKey &&
      rawSourceKey.length <= 80 &&
      /^[a-z0-9_-]+$/i.test(rawSourceKey)
        ? rawSourceKey
        : null;
    const rawTarget = req.body?.targetType ? String(req.body.targetType) : null;
    const targetType =
      rawTarget === "job" || rawTarget === "current_affairs" ? rawTarget : null;

    const result = await runLiveWebSync({
      triggeredBy,
      sourceKey,
      targetType,
    });

    if (result.skipped) {
      if (triggeredBy === "auto") {
        return res.json({
          success: true,
          data: result,
        });
      }
      return res.status(409).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function triggerCronSync(req, res, next) {
  try {
    const authHeader = req.header("authorization") || "";
    const adminHeader = req.header("x-admin-key") || "";

    const validCronSecret =
      Boolean(env.CRON_SECRET) &&
      safeSecretEqual(authHeader, `Bearer ${env.CRON_SECRET}`);
    const validAdminKey = safeSecretEqual(adminHeader, env.ADMIN_API_KEY);

    if (!validCronSecret && !validAdminKey) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized cron invocation.",
      });
    }

    const result = await runLiveWebSync({ triggeredBy: "cron" });
    if (result.skipped) {
      return res.status(409).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
