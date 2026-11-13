import { Router } from "express";
import mongoose from "mongoose";
import metaRoutes from "./meta.routes.js";
import jobsRoutes from "./jobs.routes.js";
import learnRoutes from "./learn.routes.js";
import practiceRoutes from "./practice.routes.js";
import progressRoutes from "./progress.routes.js";
import syncRoutes from "./sync.routes.js";
import studyRoutes from "./study.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "bd-govt-job-portal-api",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    dbName: mongoose.connection.name,
    timestamp: new Date().toISOString(),
  });
});

router.use("/meta", metaRoutes);
router.use("/jobs", jobsRoutes);
router.use("/learn", learnRoutes);
router.use("/practice", practiceRoutes);
router.use("/progress", progressRoutes);
router.use("/sync", syncRoutes);
router.use("/study", studyRoutes);

export default router;
