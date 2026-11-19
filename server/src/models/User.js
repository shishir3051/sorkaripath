import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    pendingName: {
      type: String,
      default: null,
    },
    pendingPasswordHash: {
      type: String,
      default: null,
    },
    passwordSetupPending: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    otpHash: {
      type: String,
      default: null,
    },
    otpPurpose: {
      type: String,
      enum: ["verify_email", "reset_password", "login_otp", null],
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    lastOtpSentAt: {
      type: Date,
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    aiStats: {
      totalRequests: { type: Number, default: 0 },
      apiCalls: { type: Number, default: 0 },
      cacheHits: { type: Number, default: 0 },
      promptTokens: { type: Number, default: 0 },
      outputTokens: { type: Number, default: 0 },
      thoughtsTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      lastUsedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export function toSafeUser(user) {
  if (!user) return null;
  const stats = user.aiStats || {};
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role === "admin" ? "admin" : "user",
    isEmailVerified: Boolean(user.isEmailVerified),
    passwordSetupPending: Boolean(user.passwordSetupPending),
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt || null,
    aiStats: {
      totalRequests: Number(stats.totalRequests) || 0,
      apiCalls: Number(stats.apiCalls) || 0,
      cacheHits: Number(stats.cacheHits) || 0,
      promptTokens: Number(stats.promptTokens) || 0,
      outputTokens: Number(stats.outputTokens) || 0,
      thoughtsTokens: Number(stats.thoughtsTokens) || 0,
      totalTokens: Number(stats.totalTokens) || 0,
      lastUsedAt: stats.lastUsedAt || null,
    },
  };
}

export const User = mongoose.models.User || mongoose.model("User", userSchema);
