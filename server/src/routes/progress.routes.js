import { Router } from "express";
import { z } from "zod";
import {
  clearStudyDrawings,
  clearStudyHighlights,
  deleteStudyDrawing,
  deleteStudyHighlight,
  deleteStudyNote,
  getProgress,
  saveStudyDrawings,
  saveStudyHighlights,
  saveStudyNote,
  toggleJobBookmark,
  toggleLessonProgress,
  toggleQuestionBookmark,
  toggleRoutineDay,
  toggleTopicProgress,
  updateStudyHighlight,
} from "../controllers/progress.controller.js";
import { validateBody } from "../middleware/validate.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/auth.js";

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
const highlightStyleSchema = z.enum(["highlight", "underline", "wavy", "box"]);
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
    style: highlightStyleSchema.optional(),
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
    style: highlightStyleSchema.optional(),
    note: z.string().max(300).optional(),
  })
  .refine(
    (val) =>
      val.color !== undefined ||
      val.style !== undefined ||
      val.note !== undefined,
    {
      message: "Provide color, style, or note to update.",
    }
  );

const inkColorSchema = z.enum(["dark", "yellow", "green", "pink", "blue"]);
const drawingItemSchema = z.object({
  id: z.string().min(1).max(100),
  scopeKey: z.string().min(1).max(160),
  viewKey: z.string().max(80).optional(),
  color: inkColorSchema.optional(),
  width: z.number().min(1).max(24).optional(),
  points: z
    .array(
      z.object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(50000),
      })
    )
    .min(1)
    .max(1500),
  createdAt: z.string().max(60).optional(),
});

const saveDrawingsBody = z.object({
  drawings: z.array(drawingItemSchema).min(1).max(40),
});

const saveNoteBody = z.object({
  note: z.object({
    id: z.string().min(1).max(100),
    scopeKey: z.string().min(1).max(160),
    viewKey: z.string().max(80).optional(),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(50000),
    text: z.string().max(1500),
    color: inkColorSchema.optional(),
    createdAt: z.string().max(60).optional(),
  }),
});

const router = Router();
router.use(requireAuth);
const progressMutationLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });
const sheetCanvasLimiter = createRateLimiter({ windowMs: 60_000, max: 180 });

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
router.post(
  "/:sessionId/drawings",
  sheetCanvasLimiter,
  validateBody(saveDrawingsBody),
  saveStudyDrawings
);
router.delete(
  "/:sessionId/drawings/:drawingId",
  sheetCanvasLimiter,
  deleteStudyDrawing
);
router.delete(
  "/:sessionId/drawings",
  sheetCanvasLimiter,
  clearStudyDrawings
);
router.post(
  "/:sessionId/notes",
  sheetCanvasLimiter,
  validateBody(saveNoteBody),
  saveStudyNote
);
router.delete(
  "/:sessionId/notes/:noteId",
  sheetCanvasLimiter,
  deleteStudyNote
);

export default router;
