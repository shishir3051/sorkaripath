import mongoose from "mongoose";

const webSourceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    organizationShort: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    adapterType: {
      type: String,
      enum: ["npf-table", "bb-erecruitment", "rss-feed", "teletalk-api"],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["job", "current_affairs"],
      default: "job",
      index: true,
    },
    defaultCategory: { type: String, default: "General Notice" },
    enabled: { type: Boolean, default: true, index: true },
    lastSyncAt: { type: Date, default: null },
    lastStatus: {
      type: String,
      enum: ["idle", "success", "error"],
      default: "idle",
    },
    lastMessage: { type: String, default: "Not synced yet" },
    lastItemsFetched: { type: Number, default: 0 },
    lastNewItems: { type: Number, default: 0 },
    totalItemsSynced: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const WebSource =
  mongoose.models.WebSource || mongoose.model("WebSource", webSourceSchema);
