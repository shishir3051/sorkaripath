import { Router } from "express";
import {
  getBooks,
  getCurrentAffairs,
  getStudyOverview,
  getStudyRoutine,
  getStudyTopicBySlug,
  getStudyTopics,
} from "../controllers/study.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/overview", getStudyOverview);
router.get("/current-affairs", getCurrentAffairs);
router.get("/books", getBooks);
router.get("/topics", getStudyTopics);
router.get("/topics/:slug", getStudyTopicBySlug);
router.get("/routine", getStudyRoutine);

export default router;
