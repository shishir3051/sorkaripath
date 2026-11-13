import { Router } from "express";
import { z } from "zod";
import {
  getAttemptHistory,
  getMistakeVault,
  getPastPapersArchive,
  getQuestions,
  smartSearchPractice,
  submitQuizAttempt,
} from "../controllers/practice.controller.js";
import { validateBody } from "../middleware/validate.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const submitAttemptSchema = z.object({
  sessionId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{4,120}$/, "Invalid learner session identifier"),
  examTrack: z.string().max(80).optional(),
  subject: z.string().max(80).optional(),
  negativeMarkingEnabled: z.boolean().optional().default(true),
  durationSeconds: z.number().int().min(0).max(14400).optional().default(0),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedIndex: z.number().int().min(0).max(3).nullable(),
      })
    )
    .min(1)
    .max(200),
});

const router = Router();
const submitLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });
const readLimiter = createRateLimiter({ windowMs: 60_000, max: 90 });

router.get("/questions", readLimiter, getQuestions);
router.post("/submit", submitLimiter, validateBody(submitAttemptSchema), submitQuizAttempt);
router.get("/attempts", getAttemptHistory);
router.get("/archive", getPastPapersArchive);
router.get("/search", readLimiter, smartSearchPractice);
router.get("/mistakes", getMistakeVault);

export default router;
