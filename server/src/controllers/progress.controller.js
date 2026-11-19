import { LearnerProgress } from "../models/LearnerProgress.js";

const MAX_STUDY_HIGHLIGHTS = 400;

function validateSessionParam(req, res) {
  if (!req.user?.id) {
    res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Please sign in to access your study progress.",
    });
    return null;
  }
  return `user_${req.user.id}`;
}

async function getOrCreateProgress(sessionId) {
  let doc = await LearnerProgress.findOne({ sessionId });
  if (!doc) {
    doc = await LearnerProgress.create({ sessionId });
  }
  return doc;
}

async function toggleProgressField(req, res, next, field, value) {
  try {
    const sessionId = validateSessionParam(req, res);
    if (!sessionId) return;

    const progress = await getOrCreateProgress(sessionId);
    const list = progress[field] || [];
    const exists = list.includes(value);
    progress[field] = exists
      ? list.filter((item) => item !== value)
      : [...list, value];

    await progress.save();
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
}

export async function getProgress(req, res, next) {
  try {
    const sessionId = validateSessionParam(req, res);
    if (!sessionId) return;

    const progress = await getOrCreateProgress(sessionId);
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
}

export function toggleLessonProgress(req, res, next) {
  return toggleProgressField(
    req,
    res,
    next,
    "completedLessonSlugs",
    req.validatedBody.lessonSlug
  );
}

export function toggleJobBookmark(req, res, next) {
  return toggleProgressField(
    req,
    res,
    next,
    "bookmarkedJobSlugs",
    req.validatedBody.jobSlug
  );
}

export function toggleTopicProgress(req, res, next) {
  return toggleProgressField(
    req,
    res,
    next,
    "completedTopicSlugs",
    req.validatedBody.topicSlug
  );
}

export function toggleQuestionBookmark(req, res, next) {
  return toggleProgressField(
    req,
    res,
    next,
    "bookmarkedQuestionIds",
    req.validatedBody.questionId
  );
}

export async function toggleRoutineDay(req, res, next) {
  try {
    const sessionId = validateSessionParam(req, res);
    if (!sessionId) return;

    const { track, dayNumber } = req.validatedBody;
    const progress = await getOrCreateProgress(sessionId);

    if (track) progress.routineTrack = track;
    const list = progress.completedRoutineDays || [];
    const exists = list.includes(dayNumber);
    progress.completedRoutineDays = exists
      ? list.filter((d) => d !== dayNumber)
      : [...list, dayNumber].sort((a, b) => a - b);

    await progress.save();
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
}

export async function saveStudyHighlights(req, res, next) {
  try {
    const sessionId = validateSessionParam(req, res);
    if (!sessionId) return;

    const incoming = req.validatedBody.highlights;
    const progress = await getOrCreateProgress(sessionId);
    const existing = Array.isArray(progress.studyHighlights)
      ? progress.studyHighlights.map((item) =>
          typeof item.toObject === "function" ? item.toObject() : item
        )
      : [];

    const byId = new Map(existing.map((h) => [h.id, h]));
    for (const item of incoming) {
      if (item.end <= item.start) continue;
      byId.set(item.id, {
        id: item.id,
        scopeKey: item.scopeKey,
        scopeTitle: item.scopeTitle || "",
        blockId: item.blockId,
        sectionLabel: item.sectionLabel || "",
        text: item.text,
        start: item.start,
        end: item.end,
        color: item.color || "yellow",
        note: item.note || "",
        createdAt: item.createdAt || new Date().toISOString(),
      });
    }

    const merged = Array.from(byId.values())
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      .slice(-MAX_STUDY_HIGHLIGHTS);

    progress.studyHighlights = merged;
    await progress.save();
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
}

export async function updateStudyHighlight(req, res, next) {
  try {
    const sessionId = validateSessionParam(req, res);
    if (!sessionId) return;

    const highlightId = String(req.params.highlightId || "").trim();
    if (!highlightId || highlightId.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight identifier.",
      });
    }

    const progress = await getOrCreateProgress(sessionId);
    const list = Array.isArray(progress.studyHighlights)
      ? progress.studyHighlights
      : [];
    const target = list.find((h) => h.id === highlightId);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found.",
      });
    }

    if (req.validatedBody.color !== undefined) {
      target.color = req.validatedBody.color;
    }
    if (req.validatedBody.note !== undefined) {
      target.note = req.validatedBody.note;
    }

    await progress.save();
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
}

export async function deleteStudyHighlight(req, res, next) {
  try {
    const sessionId = validateSessionParam(req, res);
    if (!sessionId) return;

    const highlightId = String(req.params.highlightId || "").trim();
    if (!highlightId || highlightId.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight identifier.",
      });
    }

    const progress = await getOrCreateProgress(sessionId);
    progress.studyHighlights = (progress.studyHighlights || []).filter(
      (h) => h.id !== highlightId
    );
    await progress.save();
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
}

export async function clearStudyHighlights(req, res, next) {
  try {
    const sessionId = validateSessionParam(req, res);
    if (!sessionId) return;

    const scopeKey = String(req.query.scopeKey || "").trim();
    const progress = await getOrCreateProgress(sessionId);
    progress.studyHighlights = scopeKey
      ? (progress.studyHighlights || []).filter((h) => h.scopeKey !== scopeKey)
      : [];

    await progress.save();
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
}
