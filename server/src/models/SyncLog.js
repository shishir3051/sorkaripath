import mongoose from "mongoose";

const syncErrorSchema = new mongoose.Schema(
  {
    sourceKey: String,
    sourceName: String,
    message: String,
  },
  { _id: false }
);

const syncLogSchema = new mongoose.Schema(
  {
    triggeredBy: {
      type: String,
      enum: ["cron", "manual", "seed", "auto"],
      default: "manual",
    },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    durationMs: { type: Number, required: true },
    sourcesChecked: { type: Number, default: 0 },
    totalFetched: { type: Number, default: 0 },
    newInserted: { type: Number, default: 0 },
    updatedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["success", "partial", "failed"],
      default: "success",
    },
    errors: { type: [syncErrorSchema], default: [] },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export const SyncLog =
  mongoose.models.SyncLog || mongoose.model("SyncLog", syncLogSchema);
