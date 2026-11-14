import { Router } from "express";
import { z } from "zod";
import {
  analyzeCircular,
  discoverCirculars,
  getAiStatus,
} from "../controllers/ai.controller.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { validateBody } from "../middleware/validate.js";

const discoverSchema = z.object({
  query: z.string().trim().min(2).max(240),
  liveRefresh: z.boolean().optional().default(false),
});

const analyzeSchema = z.object({
  forceRefresh: z.boolean().optional().default(false),
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

export default router;
