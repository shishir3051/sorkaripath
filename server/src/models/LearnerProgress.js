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

const drawingPointSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true, min: 0, max: 1 },
    y: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const sheetDrawingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    scopeKey: { type: String, required: true },
    viewKey: { type: String, default: "default" },
    color: {
      type: String,
      enum: ["dark", "yellow", "green", "pink", "blue"],
      default: "dark",
    },
    width: { type: Number, default: 3, min: 1, max: 24 },
    points: { type: [drawingPointSchema], default: [] },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const sheetNoteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    scopeKey: { type: String, required: true },
    viewKey: { type: String, default: "default" },
    x: { type: Number, required: true, min: 0, max: 1 },
    y: { type: Number, required: true, min: 0 },
    text: { type: String, default: "" },
    color: {
      type: String,
      enum: ["dark", "yellow", "green", "pink", "blue"],
      default: "yellow",
    },
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
    studyDrawings: { type: [sheetDrawingSchema], default: [] },
    studyNotes: { type: [sheetNoteSchema], default: [] },
    targetTrack: { type: String, default: "BCS & General Govt" },
  },
  { timestamps: true }
);

export const LearnerProgress =
  mongoose.models.LearnerProgress ||
  mongoose.model("LearnerProgress", learnerProgressSchema);
