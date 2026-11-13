import { Router } from "express";
import { z } from "zod";
import {
  getProgress,
  toggleJobBookmark,
  toggleLessonProgress,
  toggleQuestionBookmark,
  toggleRoutineDay,
  toggleTopicProgress,
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

export default router;
