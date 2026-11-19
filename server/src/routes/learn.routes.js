import { Router } from "express";
import { getLessonBySlug, listLessons } from "../controllers/learn.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", listLessons);
router.get("/:slug", getLessonBySlug);

export default router;
