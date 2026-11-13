import { LearnerProgress } from "../models/LearnerProgress.js";
import { isValidSessionId } from "../utils/security.js";

function validateSessionParam(req, res) {
  const sessionId = String(req.params.sessionId || "").trim();
  if (!isValidSessionId(sessionId)) {
    res.status(400).json({
      success: false,
      message: "Invalid learner session identifier.",
    });
    return null;
  }
  return sessionId;
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
