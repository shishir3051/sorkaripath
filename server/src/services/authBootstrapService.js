import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { LearnerProgress } from "../models/LearnerProgress.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { AiUsageLog } from "../models/AiUsageLog.js";

let bootstrapPromise = null;

export function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

export function getConfiguredAdminEmails() {
  return new Set(
    String(env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => normalizeEmail(e))
      .filter(Boolean)
  );
}

export function isConfiguredAdminEmail(email = "") {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getConfiguredAdminEmails().has(normalized);
}

function deriveAdminDisplayName(email) {
  const local = String(email.split("@")[0] || "Admin")
    .replace(/[0-9]+$/g, "")
    .replace(/[._-]+/g, " ")
    .trim();
  if (!local) return "Portal Admin";
  return local
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function runAdminBootstrap() {
  const adminEmails = getConfiguredAdminEmails();
  for (const email of adminEmails) {
    const existing = await User.findOne({ email });
    if (!existing) {
      await User.create({
        name: deriveAdminDisplayName(email),
        email,
        role: "admin",
        isEmailVerified: true,
        passwordSetupPending: true,
        passwordHash: null,
      });
      console.log(`[Auth] Provisioned admin account (${email}) — awaiting initial password setup via Register/OTP`);
    } else if (existing.role !== "admin" || !existing.isEmailVerified) {
      existing.role = "admin";
      existing.isEmailVerified = true;
      await existing.save();
      console.log(`[Auth] Elevated ${email} to admin role`);
    }
  }
}

export function ensureConfiguredAdmins() {
  if (!bootstrapPromise) {
    bootstrapPromise = runAdminBootstrap().catch((err) => {
      bootstrapPromise = null;
      console.error("[Auth] Admin bootstrap warning:", err.message);
    });
  }
  return bootstrapPromise;
}

export async function deleteUserAccountData(targetUser) {
  const userId = targetUser._id;
  const sessionId = `user_${userId}`;
  const normalizedEmail = normalizeEmail(targetUser.email);

  await Promise.all([
    LearnerProgress.deleteMany({ sessionId }),
    QuizAttempt.deleteMany({ sessionId }),
    AiUsageLog.deleteMany({
      $or: [{ userId }, { userEmail: normalizedEmail }],
    }),
    User.deleteOne({ _id: userId }),
  ]);
}
