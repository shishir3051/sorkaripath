import {
  analyzeCircularPdfWithAi,
  discoverLatestCircularsWithAi,
  getAiCapabilityStatus,
} from "../services/aiCircularService.js";
import {
  explainStudyTopicWithAi,
  generatePracticeMcqsWithAi,
} from "../services/aiStudyService.js";

export async function getAiStatus(_req, res) {
  res.json({
    success: true,
    data: getAiCapabilityStatus(),
  });
}

export async function discoverCirculars(req, res, next) {
  try {
    const { query, liveRefresh } = req.validatedBody;
    const data = await discoverLatestCircularsWithAi({
      query,
      liveRefresh,
      actorUser: req.user || null,
    });
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function analyzeCircular(req, res, next) {
  try {
    const slug = String(req.params.slug || "").trim();
    if (!slug || slug.length > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid circular slug.",
      });
    }
    const forceRefresh = Boolean(req.validatedBody?.forceRefresh);
    const data = await analyzeCircularPdfWithAi(slug, {
      forceRefresh,
      actorUser: req.user || null,
    });
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function studyTutor(req, res, next) {
  try {
    const data = await explainStudyTopicWithAi({
      ...req.validatedBody,
      actorUser: req.user || null,
    });
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function generateAiMcqs(req, res, next) {
  try {
    const data = await generatePracticeMcqsWithAi({
      ...req.validatedBody,
      actorUser: req.user || null,
    });
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}
