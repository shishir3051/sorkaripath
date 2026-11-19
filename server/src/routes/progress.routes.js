import { Router } from "express";
import { z } from "zod";
import {
  clearStudyHighlights,
  deleteStudyHighlight,
  getProgress,
  saveStudyHighlights,
  toggleJobBookmark,
  toggleLessonProgress,
  toggleQuestionBookmark,
  toggleRoutineDay,
  toggleTopicProgress,
  updateStudyHighlight,
} from "../controllers/progress.controller.js";
import { validateBody } from "../middleware/validate.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const lessonBody = z.object({ lessonSlug: z.string().min(1).max(140) });
const bookmarkBody = z.object({ jobSlug: z.string().min(1).max(140) });
const topicBody = z.object({ topicSlug: z.string().min(1).max(140) });
const routineDayBody = z.object({
  track: z.string().min(1).max(80).optional(),
  dayNumber: z.number().int().min(1).max(365),
});
const questionBookmarkBody = z.object({
  questionId: z.string().min(1).max(120),
});

const highlightColorSchema = z.enum(["yellow", "green", "pink", "blue"]);
const highlightItemSchema = z
  .object({
    id: z.string().min(1).max(100),
    scopeKey: z.string().min(1).max(160),
    scopeTitle: z.string().max(200).optional(),
    blockId: z.string().min(1).max(160),
    sectionLabel: z.string().max(200).optional(),
    text: z.string().min(1).max(1200),
    start: z.number().int().min(0).max(50000),
    end: z.number().int().min(1).max(50000),
    color: highlightColorSchema.optional(),
    note: z.string().max(300).optional(),
    createdAt: z.string().max(60).optional(),
  })
  .refine((item) => item.end > item.start, {
    message: "Highlight end offset must be greater than start offset.",
  });

const saveHighlightsBody = z.object({
  highlights: z.array(highlightItemSchema).min(1).max(40),
});

const updateHighlightBody = z
  .object({
    color: highlightColorSchema.optional(),
    note: z.string().max(300).optional(),
  })
  .refine((val) => val.color !== undefined || val.note !== undefined, {
    message: "Provide color or note to update.",
  });

const router = Router();
const progressMutationLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

router.get("/:sessionId", getProgress);
router.post(
  "/:sessionId/toggle-lesson",
  progressMutationLimiter,
  validateBody(lessonBody),
  toggleLessonProgress
);
router.post(
  "/:sessionId/toggle-bookmark",
  progressMutationLimiter,
  validateBody(bookmarkBody),
  toggleJobBookmark
);
router.post(
  "/:sessionId/toggle-topic",
  progressMutationLimiter,
  validateBody(topicBody),
  toggleTopicProgress
);
router.post(
  "/:sessionId/toggle-routine-day",
  progressMutationLimiter,
  validateBody(routineDayBody),
  toggleRoutineDay
);
router.post(
  "/:sessionId/toggle-question-bookmark",
  progressMutationLimiter,
  validateBody(questionBookmarkBody),
  toggleQuestionBookmark
);
router.post(
  "/:sessionId/highlights",
  progressMutationLimiter,
  validateBody(saveHighlightsBody),
  saveStudyHighlights
);
router.patch(
  "/:sessionId/highlights/:highlightId",
  progressMutationLimiter,
  validateBody(updateHighlightBody),
  updateStudyHighlight
);
router.delete(
  "/:sessionId/highlights/:highlightId",
  progressMutationLimiter,
  deleteStudyHighlight
);
router.delete(
  "/:sessionId/highlights",
  progressMutationLimiter,
  clearStudyHighlights
);

export default router;
