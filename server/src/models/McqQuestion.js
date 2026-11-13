import mongoose from "mongoose";

const mcqQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, unique: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4,
        message: "MCQ question must have exactly 4 options",
      },
    },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, required: true },
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
    examTrack: {
      type: String,
      enum: [
        "BCS Preliminary",
        "Bank Combined",
        "Primary & NTRCA",
        "Grade 11-20",
        "Govt Rules 2026",
      ],
      default: "BCS Preliminary",
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    sourceYear: { type: String, default: "2026 Curriculum" },
    examSeries: {
      type: String,
      default: "Topic Practice Bank",
      index: true,
    },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

mcqQuestionSchema.index(
  { question: "text", explanation: "text", examSeries: "text", tags: "text" },
  { default_language: "none", language_override: "textSearchLanguage" }
);

export const McqQuestion =
  mongoose.models.McqQuestion || mongoose.model("McqQuestion", mcqQuestionSchema);
