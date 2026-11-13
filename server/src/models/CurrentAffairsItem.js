import mongoose from "mongoose";

const currentAffairsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    sourceHash: { type: String, required: true, unique: true, index: true },
    topic: {
      type: String,
      enum: [
        "Bangladesh Affairs",
        "Economy & Banking",
        "International Affairs",
        "Science & ICT",
        "Governance & Policy",
        "Bangla Digest",
      ],
      default: "Bangladesh Affairs",
      index: true,
    },
    language: {
      type: String,
      enum: ["en", "bn"],
      default: "en",
      index: true,
    },
    sourceKey: { type: String, required: true, index: true },
    sourceName: { type: String, required: true },
    url: { type: String, required: true },
    summary: { type: String, default: "" },
    publishedDate: { type: Date, default: Date.now, index: true },
    examRelevanceNote: { type: String, default: "" },
  },
  { timestamps: true }
);

currentAffairsSchema.index(
  { title: "text", summary: "text" },
  { default_language: "none", language_override: "textSearchLanguage" }
);

export const CurrentAffairsItem =
  mongoose.models.CurrentAffairsItem ||
  mongoose.model("CurrentAffairsItem", currentAffairsSchema);
