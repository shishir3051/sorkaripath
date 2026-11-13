import { Router } from "express";
import { getLessonBySlug, listLessons } from "../controllers/learn.controller.js";

const router = Router();

router.get("/", listLessons);
router.get("/:slug", getLessonBySlug);

export default router;
