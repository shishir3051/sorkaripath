import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    body: { type: String, required: true },
    bullets: { type: [String], default: [] },
    tip: { type: String, default: "" },
  },
  { _id: false }
);

const officialLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const learningModuleSchema = new mongoose.Schema(
  {
    letter: { type: String, required: true, trim: true, uppercase: true },
    order: { type: Number, required: true, unique: true, index: true },
    stage: {
      type: String,
      enum: [
        "Foundations (A-E)",
        "Rules & Pay Scale (F-J)",
        "Applications & Exams (K-O)",
        "Major Tracks (P-T)",
        "Subject & Viva Mastery (U-Z)",
      ],
      required: true,
      index: true,
    },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    titleBn: { type: String, trim: true, default: "" },
    subtitle: { type: String, trim: true, default: "" },
    estimatedMinutes: { type: Number, default: 8 },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    summary: { type: String, required: true },
    sections: { type: [sectionSchema], default: [] },
    checklist: { type: [String], default: [] },
    officialLinks: { type: [officialLinkSchema], default: [] },
    quizTags: { type: [String], default: [] },
    updatedForYear: { type: Number, default: 2026 },
  },
  { timestamps: true }
);

learningModuleSchema.index({
  title: "text",
  titleBn: "text",
  summary: "text",
  subtitle: "text",
});

export const LearningModule =
  mongoose.models.LearningModule || mongoose.model("LearningModule", learningModuleSchema);
