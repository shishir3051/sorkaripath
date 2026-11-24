import { JobCircular } from "../models/JobCircular.js";
import { LearningModule } from "../models/LearningModule.js";
import { McqQuestion } from "../models/McqQuestion.js";
import { WebSource } from "../models/WebSource.js";
import { SyncLog } from "../models/SyncLog.js";
import { getSyncFreshness } from "../scrapers/index.js";

function pickDiverseRecent(items = [], maxItems = 12, maxPerSource = 2) {
  const counts = new Map();
  const picked = [];
  const overflow = [];

  for (const item of items) {
    const key = item.sourceId || item.organizationShort || "other";
    const c = counts.get(key) || 0;
    if (c < maxPerSource) {
      picked.push(item);
      counts.set(key, c + 1);
      if (picked.length >= maxItems) return picked;
    } else {
      overflow.push(item);
    }
  }

  for (const item of overflow) {
    if (picked.length >= maxItems) break;
    picked.push(item);
  }
  return picked;
}

export async function getOverview(req, res, next) {
  try {
    const [
      totalCirculars,
      liveSyncedCount,
      curatedCount,
      lessonCount,
      mcqCount,
      enabledSources,
      lastSyncLog,
      syncMeta,
      featuredCirculars,
      recentWebNoticesPool,
      latestRecruitmentCirculars,
      upcomingDeadlines,
    ] = await Promise.all([
      JobCircular.countDocuments({ isActive: true }),
      JobCircular.countDocuments({ isActive: true, origin: "web_sync" }),
      JobCircular.countDocuments({ isActive: true, origin: "curated" }),
      LearningModule.countDocuments(),
      McqQuestion.countDocuments(),
      WebSource.countDocuments({ enabled: true }),
      SyncLog.findOne().sort({ finishedAt: -1 }).lean(),
      getSyncFreshness(),
      JobCircular.find({ isActive: true, isFeatured: true })
        .sort({ publishedDate: -1 })
        .limit(6)
        .lean(),
      JobCircular.find({ isActive: true, origin: "web_sync" })
        .sort({ publishedDate: -1, updatedAt: -1, createdAt: -1 })
        .limit(45)
        .lean(),
      JobCircular.find({ isActive: true, origin: "web_sync", recordType: "circular" })
        .sort({ publishedDate: -1, updatedAt: -1, createdAt: -1 })
        .limit(10)
        .lean(),
      JobCircular.find({
        isActive: true,
        deadlineDate: { $gte: new Date() },
      })
        .sort({ deadlineDate: 1 })
        .limit(6)
        .lean(),
    ]);

    const latestLiveNotices = pickDiverseRecent(recentWebNoticesPool, 12, 2);

    res.json({
      success: true,
      data: {
        stats: {
          totalCirculars,
          liveSyncedCount,
          curatedCount,
          lessonCount,
          mcqCount,
          enabledSources,
        },
        lastSyncLog,
        syncMeta,
        featuredCirculars,
        latestLiveNotices,
        latestRecruitmentCirculars,
        upcomingDeadlines,
        highlights2026: {
          ageLimit: "21 - 32 years (Gazetted standard; 18+ for Grade 11-20)",
          bcsAttempts: "Unlimited attempts within age limit (21-32)",
          quotaBreakdown: [
            { label: "Merit (Open Competition)", percent: 93 },
            { label: "Children of Freedom Fighters / Biranganas", percent: 5 },
            { label: "Ethnic Minorities", percent: 1 },
            { label: "Persons with Disabilities & Third Gender", percent: 1 },
          ],
          payScaleSummary:
            "9th National Pay Scale 2026 (Service Order 2026): Grade 20 starts at ৳20,000, Grade 9 at ৳44,000, Grade 1 fixed at ৳1,56,000 (phased 100% by July 2027).",
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
