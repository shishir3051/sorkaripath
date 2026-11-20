import mongoose from "mongoose";

const studyHighlightSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    scopeKey: { type: String, required: true },
    scopeTitle: { type: String, default: "" },
    blockId: { type: String, required: true },
    sectionLabel: { type: String, default: "" },
    text: { type: String, required: true },
    start: { type: Number, required: true, min: 0 },
    end: { type: Number, required: true, min: 1 },
    color: {
      type: String,
      enum: ["yellow", "green", "pink", "blue"],
      default: "yellow",
    },
    style: {
      type: String,
      enum: ["highlight", "underline", "wavy", "box"],
      default: "highlight",
    },
    note: { type: String, default: "" },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const learnerProgressSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    completedLessonSlugs: { type: [String], default: [] },
    completedTopicSlugs: { type: [String], default: [] },
    completedRoutineDays: { type: [Number], default: [] },
    routineTrack: { type: String, default: "BCS" },
    wrongQuestionIds: { type: [String], default: [] },
    bookmarkedQuestionIds: { type: [String], default: [] },
    bookmarkedJobSlugs: { type: [String], default: [] },
    studyHighlights: { type: [studyHighlightSchema], default: [] },
    targetTrack: { type: String, default: "BCS & General Govt" },
  },
  { timestamps: true }
);

export const LearnerProgress =
  mongoose.models.LearnerProgress ||
  mongoose.model("LearnerProgress", learnerProgressSchema);
