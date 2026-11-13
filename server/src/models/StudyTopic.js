import mongoose from "mongoose";

const quickExampleSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    detail: { type: String, required: true },
  },
  { _id: false }
);

const chapterSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    explanation: { type: String, required: true },
    points: { type: [String], default: [] },
    workedExamples: { type: [String], default: [] },
  },
  { _id: false }
);

const studyTopicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    subject: {
      type: String,
      enum: [
        "Bangla",
        "English",
        "Bangladesh Affairs",
        "International Affairs",
        "Math & Mental Ability",
        "General Science & ICT",
        "Ethics & Governance",
        "Geography & Environment",
        "Govt Job Rules & Banking",
      ],
      required: true,
      index: true,
    },
    unit: { type: String, required: true, trim: true },
    targetTracks: {
      type: [String],
      default: ["BCS", "Bank & Financial", "Primary & NTRCA", "Grade 11-20"],
    },
    estimatedMinutes: { type: Number, default: 15 },
    highYieldSummary: { type: String, required: true },
    keyFacts: { type: [String], default: [] },
    memoryTricks: { type: [String], default: [] },
    quickExamples: { type: [quickExampleSchema], default: [] },
    chapters: { type: [chapterSchema], default: [] },
    mcqSubjectFilter: { type: String, default: "All" },
    order: { type: Number, default: 100 },
  },
  { timestamps: true }
);

studyTopicSchema.index(
  {
    title: "text",
    unit: "text",
    highYieldSummary: "text",
    keyFacts: "text",
    "chapters.heading": "text",
    "chapters.explanation": "text",
    "chapters.points": "text",
  },
  { default_language: "none", language_override: "textSearchLanguage" }
);

export const StudyTopic =
  mongoose.models.StudyTopic || mongoose.model("StudyTopic", studyTopicSchema);
