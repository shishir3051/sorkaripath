import { Router } from "express";
import { z } from "zod";
import {
  analyzeCircular,
  discoverCirculars,
  generateAiMcqs,
  getAiStatus,
  studyTutor,
} from "../controllers/ai.controller.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const discoverSchema = z.object({
  query: z.string().trim().min(2).max(240),
  liveRefresh: z.boolean().optional().default(false),
});

const analyzeSchema = z.object({
  forceRefresh: z.boolean().optional().default(false),
});

const studyTutorSchema = z
  .object({
    topicSlug: z.string().trim().max(120).optional().default(""),
    subject: z.string().trim().max(80).optional().default("All"),
    question: z.string().trim().max(600).optional().default(""),
  })
  .refine((val) => Boolean(val.topicSlug || val.question.length >= 2), {
    message: "Provide a study question (min 2 chars) or select a Topic Guru sheet.",
  });

const generateMcqsSchema = z.object({
  topicSlug: z.string().trim().max(120).optional().default(""),
  subject: z.string().trim().max(80).optional().default("Bangladesh Affairs"),
  topicTitle: z.string().trim().max(160).optional().default(""),
  examTrack: z.string().trim().max(80).optional().default("BCS Preliminary"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional().default("Medium"),
  count: z.number().int().min(3).max(10).optional().default(5),
});

const aiRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 15,
});

const router = Router();

router.get("/status", getAiStatus);
router.post(
  "/discover",
  aiRateLimiter,
  validateBody(discoverSchema),
  discoverCirculars
);
router.post(
  "/circulars/:slug/analyze",
  aiRateLimiter,
  validateBody(analyzeSchema),
  analyzeCircular
);
router.post(
  "/study-tutor",
  requireAuth,
  aiRateLimiter,
  validateBody(studyTutorSchema),
  studyTutor
);
router.post(
  "/generate-mcqs",
  requireAuth,
  aiRateLimiter,
  validateBody(generateMcqsSchema),
  generateAiMcqs
);

export default router;
