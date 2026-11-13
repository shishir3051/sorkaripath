import { Router } from "express";
import { z } from "zod";
import {
  createJob,
  deleteJob,
  getJobBySlug,
  listJobs,
} from "../controllers/jobs.controller.js";
import { requireAdminKey } from "../middleware/adminAuth.js";
import { validateBody } from "../middleware/validate.js";
import { sanitizeHttpUrl } from "../utils/security.js";

const httpUrlField = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (v) => v === "" || Boolean(sanitizeHttpUrl(v)),
    "Must be a valid http:// or https:// URL"
  )
  .optional()
  .default("");

const createJobSchema = z.object({
  title: z.string().min(4).max(240),
  titleBn: z.string().max(240).optional().default(""),
  recordType: z
    .enum(["circular", "notice", "result", "admit_card", "exam_schedule"])
    .default("circular"),
  category: z
    .enum([
      "BCS",
      "Bank & Financial",
      "Ministry & Directorate",
      "Teaching (Primary/NTRCA)",
      "Defense & Police",
      "Engineering & Technical",
      "Judicial & Legal",
      "General Notice",
    ])
    .default("Ministry & Directorate"),
  organization: z.string().min(2).max(160),
  organizationShort: z.string().max(30).optional().default(""),
  gradeRange: z.string().max(60).optional().default("Grade 9-20"),
  payScale2026: z.string().max(120).optional().default("National Pay Scale 2026"),
  vacancies: z.string().max(60).optional().default("See Circular"),
  ageLimit: z.string().max(120).optional().default("21 - 32 years"),
  educationRequired: z.string().max(400).optional().default("Graduation / HSC"),
  applicationFee: z.string().max(120).optional().default("As per circular"),
  publishedDate: z.string().optional(),
  deadlineDate: z.string().optional().nullable(),
  deadlineRaw: z.string().max(80).optional().default(""),
  applyUrl: httpUrlField,
  pdfUrl: httpUrlField,
  summary: z.string().min(10).max(2000),
  highlights: z.array(z.string().max(240)).max(25).optional().default([]),
  applicationSteps: z.array(z.string().max(240)).max(25).optional().default([]),
  relatedLessonSlugs: z.array(z.string().max(140)).max(25).optional().default([]),
  tags: z.array(z.string().max(80)).max(25).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
});

const router = Router();

router.get("/", listJobs);
router.get("/:slug", getJobBySlug);
router.post("/", requireAdminKey, validateBody(createJobSchema), createJob);
router.delete("/:id", requireAdminKey, deleteJob);

export default router;
