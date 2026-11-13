import mongoose from "mongoose";

const studyResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    examTrack: {
      type: String,
      enum: [
        "All Tracks",
        "BCS",
        "Bank & Financial",
        "Primary & NTRCA",
        "Grade 11-20",
      ],
      required: true,
      index: true,
    },
    subject: { type: String, required: true, index: true },
    resourceType: {
      type: String,
      enum: [
        "NCTB Core Book",
        "Recommended Guidebook",
        "Question Bank & Digest",
        "Official Reference",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["Must-Read Core", "High-Yield Practice", "Reference"],
      default: "Must-Read Core",
    },
    authorOrPublisher: { type: String, required: true },
    whyStudy: { type: String, required: true },
    keyTopics: { type: [String], default: [] },
    officialUrl: { type: String, default: "" },
    order: { type: Number, default: 100 },
  },
  { timestamps: true }
);

export const StudyResource =
  mongoose.models.StudyResource ||
  mongoose.model("StudyResource", studyResourceSchema);
