import mongoose from "mongoose";

const aiUsageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    userEmail: {
      type: String,
      default: "guest",
      lowercase: true,
      trim: true,
      index: true,
    },
    userName: {
      type: String,
      default: "Guest Visitor",
      trim: true,
    },
    feature: {
      type: String,
      enum: [
        "study_tutor",
        "generate_mcqs",
        "circular_discover",
        "circular_analyze",
      ],
      required: true,
      index: true,
    },
    modelUsed: {
      type: String,
      default: "",
      trim: true,
    },
    keySlotUsed: {
      type: Number,
      default: 1,
    },
    promptTokens: {
      type: Number,
      default: 0,
      min: 0,
    },
    outputTokens: {
      type: Number,
      default: 0,
      min: 0,
    },
    thoughtsTokens: {
      type: Number,
      default: 0,
      min: 0,
    },
    cachedTokens: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
      min: 0,
    },
    isCacheHit: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: "",
      trim: true,
      maxlength: 140,
    },
  },
  { timestamps: true }
);

aiUsageLogSchema.index({ createdAt: -1 });
aiUsageLogSchema.index({ userEmail: 1, createdAt: -1 });

export const AiUsageLog =
  mongoose.models.AiUsageLog || mongoose.model("AiUsageLog", aiUsageLogSchema);
