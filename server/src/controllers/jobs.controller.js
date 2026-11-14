import crypto from "crypto";
import mongoose from "mongoose";
import { JobCircular } from "../models/JobCircular.js";
import { LearningModule } from "../models/LearningModule.js";
import {
  getSyncFreshness,
  triggerStaleSyncInBackground,
} from "../scrapers/index.js";
import { capSearchQuery, escapeRegex } from "../utils/security.js";

const SEARCH_NOISE_WORDS = new Set([
  "job",
  "jobs",
  "circular",
  "circulars",
  "notice",
  "notices",
  "recruitment",
  "vacancy",
  "vacancies",
  "career",
  "bdjobs",
  "bd",
  "govt",
  "government",
  "bangladesh",
  "of",
  "for",
  "and",
  "the",
  "in",
  "to",
]);

const BILINGUAL_SEARCH_ALIASES = new Map([
  ["post", "(?:post|postal|bdpost|ptd|ডাক)"],
  ["postal", "(?:post|postal|bdpost|ptd|ডাক)"],
  ["bdpost", "(?:post|postal|bdpost|ptd|ডাক)"],
  ["dak", "(?:post|postal|bdpost|ptd|ডাক)"],
  ["office", "(?:office|অফিস|বিভাগ|অধিদপ্তর|দপ্তর|division|directorate)"],
  ["telecom", "(?:telecom|telecommunications|টেলিযোগাযোগ|ptd|btcl|টেলিটক)"],
  ["telecommunications", "(?:telecom|telecommunications|টেলিযোগাযোগ|ptd|btcl)"],
  ["railway", "(?:railway|rail|রেলওয়ে|রেল)"],
  ["rail", "(?:railway|rail|রেলওয়ে|রেল)"],
  ["bank", "(?:bank|ব্যাংক|bsc|আর্থিক)"],
  ["health", "(?:health|স্বাস্থ্য|dghs|মেডিকেল|চিকিৎসা)"],
  ["dghs", "(?:health|স্বাস্থ্য|dghs)"],
  ["primary", "(?:primary|প্রাথমিক|dpe)"],
  ["teacher", "(?:teacher|ntrca|শিক্ষক|শিক্ষা)"],
  ["education", "(?:education|শিক্ষা|moedu|dshe|shed|primary|প্রাথমিক)"],
  ["police", "(?:police|পুলিশ|স্বরাষ্ট্র|moha|আনসার|bgb)"],
  ["home", "(?:home|স্বরাষ্ট্র|moha|পুলিশ)"],
  ["defense", "(?:defen[cs]e|প্রতিরক্ষা|mod|সেনা|নৌ|বিমান)"],
  ["defence", "(?:defen[cs]e|প্রতিরক্ষা|mod|সেনা|নৌ|বিমান)"],
  ["finance", "(?:finance|অর্থ|mof|বেতন|ভাতা|বাজেট)"],
  ["food", "(?:food|খাদ্য|mofood|dgfood)"],
  ["social", "(?:social|welfare|সমাজকল্যাণ|msw|dss)"],
  ["welfare", "(?:social|welfare|সমাজকল্যাণ|msw|dss)"],
  ["agriculture", "(?:agriculture|কৃষি|moa|dae)"],
  ["land", "(?:land|ভূমি|minland)"],
  ["local", "(?:local|স্থানীয়|lgd|lged)"],
  ["water", "(?:water|পানি|mowr|bwdb)"],
  ["shipping", "(?:shipping|নৌ|mos|port|বন্দর)"],
  ["environment", "(?:environment|forest|পরিবেশ|বন|moef)"],
  ["forest", "(?:environment|forest|পরিবেশ|বন|moef)"],
  ["aviation", "(?:aviation|tourism|বিমান|পর্যটন|mocat)"],
  ["information", "(?:information|তথ্য|সম্প্রচার|moi|moib)"],
  ["women", "(?:women|children|মহিলা|শিশু|mowca)"],
  ["ict", "(?:ict|computer|কম্পিউটার|তথ্য ও যোগাযোগ|ictd)"],
  ["bcs", "(?:bcs|বিসিএস|cadre|ক্যাডার|bpsc)"],
  ["recruitment", "(?:recruit|নিয়োগ|নিয়োগ|circular|বিজ্ঞপ্তি|শূন্য)"],
  ["circular", "(?:circular|বিজ্ঞপ্তি|নিয়োগ|নিয়োগ)"],
  ["result", "(?:result|ফলাফল|ফল|উত্তীর্ণ|সুপারিশ)"],
  ["viva", "(?:viva|মৌখিক|schedule|সময়সূচি|সময়সূচি)"],
  ["exam", "(?:exam|পরীক্ষা|written|লিখিত|preliminary|mcq)"],
  ["admit", "(?:admit|প্রবেশপত্র)"],
]);

function buildTokenCondition(token) {
  const alias = BILINGUAL_SEARCH_ALIASES.get(token.toLowerCase());
  const pattern = alias || escapeRegex(token);
  const regex = new RegExp(pattern, "i");
  return {
    $or: [
      { title: regex },
      { titleBn: regex },
      { organization: regex },
      { organizationShort: regex },
      { summary: regex },
      { tags: regex },
    ],
  };
}

function buildJobSearchTokenSets(rawQuery) {
  const search = capSearchQuery(rawQuery, 100);
  if (!search) return [];
  const rawTokens = search
    .split(/[\s,+/|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 6);

  if (rawTokens.length === 0) return [search];
  const coreTokens = rawTokens.filter(
    (t) => !SEARCH_NOISE_WORDS.has(t.toLowerCase())
  );
  return (coreTokens.length > 0 ? coreTokens : rawTokens).slice(0, 5);
}

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
