import crypto from "crypto";
import mongoose from "mongoose";
import { JobCircular } from "../models/JobCircular.js";
import { LearningModule } from "../models/LearningModule.js";
import {
  getSyncFreshness,
  triggerStaleSyncInBackground,
} from "../scrapers/index.js";
import {
  buildJobSearchTokenSets,
  buildTokenCondition,
} from "../utils/jobSearchQuery.js";

export async function listJobs(req, res, next) {
  try {
    const {
      q = "",
      category = "",
      recordType = "",
      origin = "",
      sourceId = "",
      featured = "",
      page = "1",
      limit = "25",
    } = req.query;

    const baseFilter = { isActive: true };

    if (category && category !== "All") baseFilter.category = category;
    if (recordType && recordType !== "All") baseFilter.recordType = recordType;
    if (origin && origin !== "All") baseFilter.origin = origin;
    if (sourceId && sourceId !== "All") baseFilter.sourceId = sourceId;
    if (featured === "true") baseFilter.isFeatured = true;

    const tokens = buildJobSearchTokenSets(q);
    let filter = { ...baseFilter };
    let searchFallback = null;

    if (tokens.length === 1) {
      filter.$and = [buildTokenCondition(tokens[0])];
    } else if (tokens.length > 1) {
      filter.$and = tokens.map(buildTokenCondition);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const sortSpec =
      origin === "curated" || featured === "true"
        ? { isFeatured: -1, publishedDate: -1, updatedAt: -1, createdAt: -1 }
        : { publishedDate: -1, updatedAt: -1, createdAt: -1 };

    let [items, total, categories, syncMeta] = await Promise.all([
      JobCircular.find(filter)
        .sort(sortSpec)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      JobCircular.countDocuments(filter),
      JobCircular.distinct("category", { isActive: true }),
      getSyncFreshness(),
    ]);

    // Fallback to broad ($or) token match if strict ($and) across multi-word search finds 0
    if (total === 0 && tokens.length > 1) {
      const broadFilter = {
        ...baseFilter,
        $or: tokens.map(buildTokenCondition),
      };
      const [broadItems, broadTotal] = await Promise.all([
        JobCircular.find(broadFilter)
          .sort(sortSpec)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        JobCircular.countDocuments(broadFilter),
      ]);
      if (broadTotal > 0) {
        items = broadItems;
        total = broadTotal;
        searchFallback = "broad";
      }
    }

    if (!process.env.VERCEL && syncMeta.isStale && !syncMeta.syncRunning) {
      triggerStaleSyncInBackground("auto").catch(() => {});
    }

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
        categories,
        searchFallback,
        syncMeta,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getJobBySlug(req, res, next) {
  try {
    const job = await JobCircular.findOne({
      slug: req.params.slug,
      isActive: true,
    }).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job circular or notice not found",
      });
    }

    const relatedLessons = job.relatedLessonSlugs?.length
      ? await LearningModule.find({ slug: { $in: job.relatedLessonSlugs } })
          .select("letter stage slug title titleBn estimatedMinutes")
          .sort({ order: 1 })
          .lean()
      : [];

    res.json({
      success: true,
      data: {
        job,
        relatedLessons,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createJob(req, res, next) {
  try {
    const payload = req.validatedBody;
    const baseSlug = payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 56);
    const suffix = crypto.randomBytes(3).toString("hex");
    const slug = `${baseSlug || "govt-circular"}-${suffix}`;

    const doc = await JobCircular.create({
      ...payload,
      slug,
      origin: "curated",
      publishedDate: payload.publishedDate
        ? new Date(payload.publishedDate)
        : new Date(),
      deadlineDate: payload.deadlineDate ? new Date(payload.deadlineDate) : null,
      sourceName: "Admin Published",
    });

    res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteJob(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid circular ID",
      });
    }
    const deleted = await JobCircular.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Circular not found",
      });
    }
    res.json({
      success: true,
      message: "Circular deleted",
    });
  } catch (err) {
    next(err);
  }
}
