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
  [
    "post",
    "(?:\\bposts?\\b|postal|postmaster|bdpost|\\bpost\\s+office\\b|ডাক)",
  ],
  [
    "postal",
    "(?:postal|bdpost|\\bpost\\s+office\\b|postmaster|ডাক)",
  ],
  [
    "bdpost",
    "(?:bdpost|\\bpost\\s+office\\b|postal\\s+(?:directorate|department)|postmaster|ডাক\\s*অধিদপ্তর|ডাক\\s*বিভাগ|ডাক)",
  ],
  ["dak", "(?:bdpost|\\bpost\\s+office\\b|postal|ডাক)"],
  [
    "office",
    "(?:\\boffices?\\b|অফিস|বিভাগ|অধিদপ্তর|দপ্তর|division|directorate)",
  ],
  [
    "ministry",
    "(?:\\bministr(?:y|ies)\\b|মন্ত্রণালয়)",
  ],
  [
    "directorate",
    "(?:\\bdirectorates?\\b|অধিদপ্তর|পরিদপ্তর)",
  ],
  ["telecom", "(?:telecom|telecommunications|টেলিযোগাযোগ|\\bptd\\b|btcl|টেলিটক)"],
  ["telecommunications", "(?:telecom|telecommunications|টেলিযোগাযোগ|\\bptd\\b|btcl)"],
  ["ptd", "(?:\\bptd\\b|telecommunications|টেলিযোগাযোগ|ডাক)"],
  ["railway", "(?:railway|\\brail\\b|রেলওয়ে|রেল)"],
  ["rail", "(?:railway|\\brail\\b|রেলওয়ে|রেল)"],
  ["bank", "(?:bank|ব্যাংক|\\bbsc\\b|আর্থিক)"],
  ["bsc", "(?:\\bbsc\\b|ব্যাংক|bankers)"],
  ["health", "(?:health|স্বাস্থ্য|dghs|মেডিকেল|চিকিৎসা)"],
  ["dghs", "(?:health|স্বাস্থ্য|dghs)"],
  ["primary", "(?:primary|প্রাথমিক|\\bdpe\\b)"],
  ["dpe", "(?:\\bdpe\\b|প্রাথমিক\\s*শিক্ষা|primary\\s+education|প্রাথমিক)"],
  ["teacher", "(?:teacher|ntrca|শিক্ষক|শিক্ষা)"],
  ["education", "(?:education|শিক্ষা|moedu|dshe|shed|primary|প্রাথমিক|\\bdpe\\b)"],
  ["police", "(?:police|পুলিশ|স্বরাষ্ট্র|moha|আনসার|bgb)"],
  ["home", "(?:\\bhome\\b|স্বরাষ্ট্র|moha|পুলিশ)"],
  ["defense", "(?:defen[cs]e|প্রতিরক্ষা|\\bmod\\b|সেনা|নৌ|বিমান)"],
  ["defence", "(?:defen[cs]e|প্রতিরক্ষা|\\bmod\\b|সেনা|নৌ|বিমান)"],
  ["finance", "(?:finance|অর্থ|\\bmof\\b|বেতন|ভাতা|বাজেট)"],
  ["food", "(?:\\bfoods?\\b|খাদ্য|mofood|dgfood)"],
  ["dgfood", "(?:dgfood|mofood|খাদ্য|\\bfoods?\\b)"],
  ["social", "(?:social|welfare|সমাজকল্যাণ|\\bmsw\\b|\\bdss\\b)"],
  ["welfare", "(?:social|welfare|সমাজকল্যাণ|\\bmsw\\b|\\bdss\\b)"],
  ["agriculture", "(?:agriculture|কৃষি|\\bmoa\\b|\\bdae\\b)"],
  ["land", "(?:\\blands?\\b|ভূমি|minland)"],
  ["local", "(?:local|স্থানীয়|\\blgd\\b|lged)"],
  ["water", "(?:water|পানি|mowr|bwdb)"],
  ["shipping", "(?:shipping|নৌ|\\bmos\\b|\\bports?\\b|বন্দর)"],
  ["environment", "(?:environment|forest|পরিবেশ|বন|moef)"],
  ["forest", "(?:environment|forest|পরিবেশ|বন|moef)"],
  ["aviation", "(?:aviation|tourism|বিমান|পর্যটন|mocat)"],
  ["information", "(?:information|তথ্য|সম্প্রচার|\\bmoi\\b|moib)"],
  ["women", "(?:women|children|মহিলা|শিশু|mowca)"],
  ["ict", "(?:\\bict\\b|computer|কম্পিউটার|তথ্য ও যোগাযোগ|ictd)"],
  ["bcs", "(?:\\bbcs\\b|বিসিএস|cadre|ক্যাডার|bpsc)"],
  ["recruitment", "(?:recruit|নিয়োগ|circular|বিজ্ঞপ্তি|শূন্য)"],
  ["circular", "(?:circular|বিজ্ঞপ্তি|নিয়োগ)"],
  ["result", "(?:result|ফলাফল|ফল|উত্তীর্ণ|সুপারিশ)"],
  ["viva", "(?:viva|মৌখিক|schedule|সময়সূচি)"],
  ["exam", "(?:exam|পরীক্ষা|written|লিখিত|preliminary|mcq)"],
  ["admit", "(?:admit|প্রবেশপত্র)"],
]);

// Match both precomposed (য়/ড়/ঢ়/ো/ৌ) and decomposed (য+় / ড+় / ঢ+় / ে+া / ে+ৗ) Bengali sequences
function expandBengaliUnicodeVariants(pattern) {
  return pattern
    .replace(/\u09AF\u09BC|\u09DF/g, "(?:\u09DF|\u09AF\u09BC)")
    .replace(/\u09A1\u09BC|\u09DC/g, "(?:\u09DC|\u09A1\u09BC)")
    .replace(/\u09A2\u09BC|\u09DD/g, "(?:\u09DD|\u09A2\u09BC)")
    .replace(/\u09C7\u09BE|\u09CB/g, "(?:\u09CB|\u09C7\u09BE)")
    .replace(/\u09C7\u09D7|\u09CC/g, "(?:\u09CC|\u09C7\u09D7)");
}

function buildTokenCondition(token) {
  const alias = BILINGUAL_SEARCH_ALIASES.get(token.toLowerCase());
  const rawPattern = alias || escapeRegex(token);
  const regex = new RegExp(expandBengaliUnicodeVariants(rawPattern), "i");
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

function canonicalizeSearchPhrases(query) {
  return query
    .normalize("NFKC")
    .replace(
      /\b(?:bangladesh\s+)?post\s+office\b|\bpostal\s+(?:directorate|department)\b|\bbangladesh\s+post\b/gi,
      " bdpost "
    )
    .replace(
      /\bdirectorate\s+of\s+primary\s+education\b|\bprimary\s+education\b/gi,
      " dpe "
    )
    .replace(/\bdg\s+food\b|\bfood\s+directorate\b/gi, " dgfood ");
}

function buildJobSearchTokenSets(rawQuery) {
  const search = capSearchQuery(rawQuery, 100);
  if (!search) return [];
  const normalized = canonicalizeSearchPhrases(search);
  const rawTokens = normalized
    .split(/[\s,+/|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 6);

  if (rawTokens.length === 0) return [search.normalize("NFKC")];
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
