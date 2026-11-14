import mongoose from "mongoose";

const jobCircularSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleBn: { type: String, trim: true, default: "" },
    slug: { type: String, required: true, unique: true, index: true },
    sourceHash: { type: String, unique: true, sparse: true },
    recordType: {
      type: String,
      enum: ["circular", "notice", "result", "admit_card", "exam_schedule"],
      default: "circular",
      index: true,
    },
    origin: {
      type: String,
      enum: ["curated", "web_sync"],
      default: "curated",
      index: true,
    },
    category: {
      type: String,
      enum: [
        "BCS",
        "Bank & Financial",
        "Ministry & Directorate",
        "Teaching (Primary/NTRCA)",
        "Defense & Police",
        "Engineering & Technical",
        "Judicial & Legal",
        "General Notice",
      ],
      default: "General Notice",
      index: true,
    },
    organization: { type: String, required: true, trim: true, index: true },
    organizationShort: { type: String, trim: true, default: "" },
    gradeRange: { type: String, trim: true, default: "As per Circular" },
    payScale2026: { type: String, trim: true, default: "National Pay Scale 2026" },
    vacancies: { type: String, trim: true, default: "See Official Circular" },
    ageLimit: {
      type: String,
      trim: true,
      default: "21 - 32 years (standard govt rules; check PDF)",
    },
    educationRequired: {
      type: String,
      trim: true,
      default: "Check official attachment for post-wise qualifications",
    },
    applicationFee: { type: String, trim: true, default: "As per official notice" },
    publishedDate: { type: Date, default: Date.now, index: true },
    publishedDateRaw: { type: String, default: "" },
    deadlineDate: { type: Date, default: null, index: true },
    deadlineRaw: { type: String, default: "" },
    applyUrl: { type: String, trim: true, default: "" },
    pdfUrl: { type: String, trim: true, default: "" },
    detailUrl: { type: String, trim: true, default: "" },
    sourceId: { type: String, trim: true, default: "", index: true },
    sourceName: { type: String, trim: true, default: "Editorial Curated" },
    summary: { type: String, trim: true, default: "" },
    highlights: { type: [String], default: [] },
    applicationSteps: { type: [String], default: [] },
    relatedLessonSlugs: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    aiExtraction: {
      extractedAt: { type: Date, default: null },
      modelUsed: { type: String, default: "" },
      summaryEn: { type: String, default: "" },
      summaryBn: { type: String, default: "" },
      totalVacancies: { type: String, default: "" },
      positions: { type: [String], default: [] },
      educationSummary: { type: String, default: "" },
      ageRequirement: { type: String, default: "" },
      applicationFee: { type: String, default: "" },
      applyStartDate: { type: String, default: "" },
      applyDeadline: { type: String, default: "" },
      applyWebsite: { type: String, default: "" },
      keyInstructions: { type: [String], default: [] },
    },
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

jobCircularSchema.index({
  title: "text",
  titleBn: "text",
  organization: "text",
  summary: "text",
  tags: "text",
});

export const JobCircular =
  mongoose.models.JobCircular || mongoose.model("JobCircular", jobCircularSchema);
