import crypto from "crypto";
import mongoose from "mongoose";
import { JobCircular } from "../models/JobCircular.js";
import { LearningModule } from "../models/LearningModule.js";
import { capSearchQuery, escapeRegex } from "../utils/security.js";

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

    const filter = { isActive: true };

    if (category && category !== "All") filter.category = category;
    if (recordType && recordType !== "All") filter.recordType = recordType;
    if (origin && origin !== "All") filter.origin = origin;
    if (sourceId && sourceId !== "All") filter.sourceId = sourceId;
    if (featured === "true") filter.isFeatured = true;

    const search = capSearchQuery(q, 100);
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { title: regex },
        { titleBn: regex },
        { organization: regex },
        { organizationShort: regex },
        { summary: regex },
        { tags: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const sortSpec =
      origin === "curated" || featured === "true"
        ? { isFeatured: -1, publishedDate: -1, updatedAt: -1, createdAt: -1 }
        : { publishedDate: -1, updatedAt: -1, createdAt: -1 };

    const [items, total, categories] = await Promise.all([
      JobCircular.find(filter)
        .sort(sortSpec)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      JobCircular.countDocuments(filter),
      JobCircular.distinct("category", { isActive: true }),
    ]);

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
