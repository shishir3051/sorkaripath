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
  },
  { timestamps: true }
);

export function toSafeUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role === "admin" ? "admin" : "user",
    isEmailVerified: Boolean(user.isEmailVerified),
    passwordSetupPending: Boolean(user.passwordSetupPending),
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt || null,
  };
}

export const User = mongoose.models.User || mongoose.model("User", userSchema);
