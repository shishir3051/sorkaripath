import { Router } from "express";
import {
  getSyncStatus,
  triggerCronSync,
  triggerWebSync,
} from "../controllers/sync.controller.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const syncLimiter = createRateLimiter({ windowMs: 60_000, max: 6 });

const router = Router();

router.get("/status", getSyncStatus);
router.post("/run", syncLimiter, triggerWebSync);
router.get("/cron", triggerCronSync);
router.post("/cron", triggerCronSync);

export default router;
