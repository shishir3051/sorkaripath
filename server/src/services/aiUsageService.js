import mongoose from "mongoose";
import { AiUsageLog } from "../models/AiUsageLog.js";
import { User } from "../models/User.js";

export function extractTokenUsage(response) {
  const meta = response?.usageMetadata || {};
  const promptTokens = Math.max(0, Number(meta.promptTokenCount) || 0);
  const outputTokens = Math.max(0, Number(meta.candidatesTokenCount) || 0);
  const thoughtsTokens = Math.max(0, Number(meta.thoughtsTokenCount) || 0);
  const cachedTokens = Math.max(0, Number(meta.cachedContentTokenCount) || 0);
  const toolTokens = Math.max(0, Number(meta.toolUsePromptTokenCount) || 0);
  const computedSum = promptTokens + outputTokens + thoughtsTokens + toolTokens;
  const totalTokens = Math.max(computedSum, Number(meta.totalTokenCount) || 0);

  return {
    promptTokens,
    outputTokens,
    thoughtsTokens,
    cachedTokens,
    totalTokens,
  };
}

const ZERO_USAGE = {
  promptTokens: 0,
  outputTokens: 0,
  thoughtsTokens: 0,
  cachedTokens: 0,
  totalTokens: 0,
};

export async function recordAiUsage({
  actorUser = null,
  feature,
  modelUsed = "",
  keySlotUsed = 1,
  usage = ZERO_USAGE,
  isCacheHit = false,
  label = "",
}) {
  try {
    const safeUsage = isCacheHit ? ZERO_USAGE : { ...ZERO_USAGE, ...usage };
    const cleanLabel = String(label || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140);

    const hasUser = Boolean(
      actorUser?.id && mongoose.Types.ObjectId.isValid(actorUser.id)
    );
    const userId = hasUser ? new mongoose.Types.ObjectId(actorUser.id) : null;
    const userEmail = hasUser
      ? String(actorUser.email || "").trim().toLowerCase() || "guest"
      : "guest";
    const userName = hasUser
      ? String(actorUser.name || "").trim() || userEmail
      : "Guest Visitor";

    await AiUsageLog.create({
      userId,
      userEmail,
      userName,
      feature,
      modelUsed: String(modelUsed || ""),
      keySlotUsed: Number(keySlotUsed) || 1,
      promptTokens: safeUsage.promptTokens,
      outputTokens: safeUsage.outputTokens,
      thoughtsTokens: safeUsage.thoughtsTokens,
      cachedTokens: safeUsage.cachedTokens,
      totalTokens: safeUsage.totalTokens,
      isCacheHit: Boolean(isCacheHit),
      label: cleanLabel,
    });

    if (userId) {
      await User.updateOne(
        { _id: userId },
        {
          $inc: {
            "aiStats.totalRequests": 1,
            "aiStats.apiCalls": isCacheHit ? 0 : 1,
            "aiStats.cacheHits": isCacheHit ? 1 : 0,
            "aiStats.promptTokens": safeUsage.promptTokens,
            "aiStats.outputTokens": safeUsage.outputTokens,
            "aiStats.thoughtsTokens": safeUsage.thoughtsTokens,
            "aiStats.totalTokens": safeUsage.totalTokens,
          },
          $set: {
            "aiStats.lastUsedAt": new Date(),
          },
        }
      );
    }
  } catch (err) {
    console.warn("[AI Telemetry] Failed to record AI usage log:", err.message);
  }
}
