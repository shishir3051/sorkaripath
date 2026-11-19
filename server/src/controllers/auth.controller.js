import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { User, toSafeUser } from "../models/User.js";
import { AiUsageLog } from "../models/AiUsageLog.js";
import { JobCircular } from "../models/JobCircular.js";
import { LearnerProgress } from "../models/LearnerProgress.js";
import { LearningModule } from "../models/LearningModule.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { StudyTopic } from "../models/StudyTopic.js";
import {
  clearAuthCookie,
  resolveUserFromRequest,
  setAuthCookie,
  signAuthToken,
} from "../middleware/auth.js";
import {
  deleteUserAccountData,
  ensureConfiguredAdmins,
  isConfiguredAdminEmail,
  normalizeEmail,
} from "../services/authBootstrapService.js";
import { sendOtpEmail } from "../services/mailService.js";
import { safeSecretEqual } from "../utils/security.js";

const BCRYPT_ROUNDS = 12;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 45_000;
const OTP_TTL_MS = {
  verify_email: 15 * 60_000,
  reset_password: 15 * 60_000,
  login_otp: 10 * 60_000,
};

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(email, purpose, otp) {
  return crypto
    .createHmac("sha256", env.JWT_SECRET)
    .update(`${normalizeEmail(email)}:${purpose}:${String(otp).trim()}`)
    .digest("hex");
}

function checkCooldownRemainingSec(user) {
  if (!user?.lastOtpSentAt) return 0;
  const elapsed = Date.now() - new Date(user.lastOtpSentAt).getTime();
  if (elapsed >= 0 && elapsed < RESEND_COOLDOWN_MS) {
    return Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
  }
  return 0;
}

function clearOtpState(user) {
  user.otpHash = null;
  user.otpPurpose = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
}

async function issueAndSendOtp(user, purpose, recipientName) {
  const otp = generateOtpCode();
  const ttlMs = OTP_TTL_MS[purpose] || 15 * 60_000;

  user.otpHash = hashOtp(user.email, purpose, otp);
  user.otpPurpose = purpose;
  user.otpExpiresAt = new Date(Date.now() + ttlMs);
  user.otpAttempts = 0;
  user.lastOtpSentAt = new Date();
  await user.save();

  try {
    await sendOtpEmail({
      to: user.email,
      name: recipientName || user.name,
      otp,
      purpose,
    });
  } catch (err) {
    user.lastOtpSentAt = null;
    await user.save().catch(() => {});
    throw err;
  }
}

async function verifyUserOtp(user, purpose, otp) {
  if (!user || !user.otpHash || user.otpPurpose !== purpose || !user.otpExpiresAt) {
    return {
      ok: false,
      status: 400,
      message: "No active verification code found. Please request a new code.",
    };
  }

  if (Date.now() > new Date(user.otpExpiresAt).getTime()) {
    clearOtpState(user);
    await user.save();
    return {
      ok: false,
      status: 400,
      message: "This verification code has expired. Please request a new code.",
    };
  }

  if ((user.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
    clearOtpState(user);
    await user.save();
    return {
      ok: false,
      status: 429,
      message: "Too many incorrect attempts. Please request a new code.",
    };
  }

  const providedHash = hashOtp(user.email, purpose, otp);
  const valid = safeSecretEqual(providedHash, user.otpHash);

  if (!valid) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    const remaining = Math.max(0, MAX_OTP_ATTEMPTS - user.otpAttempts);
    if (remaining === 0) {
      clearOtpState(user);
    }
    await user.save();
    return {
      ok: false,
      status: 400,
      message:
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. Please request a new code.",
    };
  }

  return { ok: true };
}

export async function register(req, res, next) {
  try {
    await ensureConfiguredAdmins();
    const { name, password } = req.validatedBody;
    const email = normalizeEmail(req.validatedBody.email);
    const isAdminEmail = isConfiguredAdminEmail(email);

    let user = await User.findOne({ email });
    if (user && user.isEmailVerified && !user.passwordSetupPending) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please sign in.",
      });
    }

    if (user) {
      const waitSec = checkCooldownRemainingSec(user);
      if (waitSec > 0) {
        return res.status(429).json({
          success: false,
          message: `Verification code sent recently. Please wait ${waitSec}s before requesting another.`,
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    if (!user) {
      user = new User({
        name,
        email,
        passwordHash,
        role: isAdminEmail ? "admin" : "user",
        isEmailVerified: false,
        passwordSetupPending: false,
      });
    } else if (user.passwordSetupPending) {
      user.pendingName = name;
      user.pendingPasswordHash = passwordHash;
      if (isAdminEmail) user.role = "admin";
    } else {
      user.name = name;
      user.passwordHash = passwordHash;
      user.pendingName = null;
      user.pendingPasswordHash = null;
      if (isAdminEmail) user.role = "admin";
    }

    await issueAndSendOtp(user, "verify_email", name);

    res.status(201).json({
      success: true,
      data: {
        email: user.email,
        verificationRequired: true,
        expiresInMinutes: 15,
        message: `A 6-digit verification code was sent to ${user.email}.`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    await ensureConfiguredAdmins();
    const email = normalizeEmail(req.validatedBody.email);
    const { otp } = req.validatedBody;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Account not found. Please register first.",
      });
    }

    const check = await verifyUserOtp(user, "verify_email", otp);
    if (!check.ok) {
      return res.status(check.status).json({
        success: false,
        message: check.message,
      });
    }

    if (user.pendingPasswordHash) {
      user.passwordHash = user.pendingPasswordHash;
      user.pendingPasswordHash = null;
    }
    if (user.pendingName) {
      user.name = user.pendingName;
      user.pendingName = null;
    }

    user.isEmailVerified = true;
    user.passwordSetupPending = false;
    if (isConfiguredAdminEmail(user.email)) {
      user.role = "admin";
    }
    clearOtpState(user);
    user.lastLoginAt = new Date();
    await user.save();

    const token = signAuthToken(user);
    setAuthCookie(res, req, token);

    res.json({
      success: true,
      data: {
        user: toSafeUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    await ensureConfiguredAdmins();
    const email = normalizeEmail(req.validatedBody.email);
    const { password } = req.validatedBody;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.passwordSetupPending && !user.passwordHash) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_SETUP_REQUIRED",
        email: user.email,
        message:
          "Your admin email is pre-authorized, but you have not set a password yet. Register with this Gmail or use 'Email OTP Sign-In' / 'Forgot Password'.",
      });
    }

    const passwordValid = user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isEmailVerified) {
      const waitSec = checkCooldownRemainingSec(user);
      if (waitSec === 0) {
        await issueAndSendOtp(user, "verify_email", user.name);
      }
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
        message:
          waitSec > 0
            ? `Your email is not verified yet. Enter the 6-digit code sent earlier (or resend in ${waitSec}s).`
            : `Your email is not verified yet. We sent a fresh 6-digit verification code to ${user.email}.`,
      });
    }

    if (isConfiguredAdminEmail(user.email) && user.role !== "admin") {
      user.role = "admin";
    }
    user.lastLoginAt = new Date();
    await user.save();

    const token = signAuthToken(user);
    setAuthCookie(res, req, token);

    res.json({
      success: true,
      data: {
        user: toSafeUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function requestLoginOtp(req, res, next) {
  try {
    await ensureConfiguredAdmins();
    const email = normalizeEmail(req.validatedBody.email);
    const user = await User.findOne({ email });

    if (user) {
      const waitSec = checkCooldownRemainingSec(user);
      if (waitSec > 0) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSec}s before requesting another sign-in code.`,
        });
      }
      await issueAndSendOtp(user, "login_otp", user.name);
    }

    res.json({
      success: true,
      data: {
        email,
        expiresInMinutes: 10,
        message:
          "If an account exists for this email, a 6-digit one-time sign-in code has been sent.",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyLoginOtp(req, res, next) {
  try {
    await ensureConfiguredAdmins();
    const email = normalizeEmail(req.validatedBody.email);
    const { otp } = req.validatedBody;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired sign-in code.",
      });
    }

    const check = await verifyUserOtp(user, "login_otp", otp);
    if (!check.ok) {
      return res.status(check.status).json({
        success: false,
        message: check.message,
      });
    }

    user.isEmailVerified = true;
    if (isConfiguredAdminEmail(user.email)) {
      user.role = "admin";
    }
    clearOtpState(user);
    user.lastLoginAt = new Date();
    await user.save();

    const token = signAuthToken(user);
    setAuthCookie(res, req, token);

    res.json({
      success: true,
      data: {
        user: toSafeUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function resendOtp(req, res, next) {
  try {
    await ensureConfiguredAdmins();
    const email = normalizeEmail(req.validatedBody.email);
    const { purpose } = req.validatedBody;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        data: {
          message:
            "If an eligible account exists for this email, a new code has been sent.",
        },
      });
    }

    if (
      purpose === "verify_email" &&
      user.isEmailVerified &&
      !user.passwordSetupPending
    ) {
      return res.status(400).json({
        success: false,
        message: "This email is already verified. Please sign in.",
      });
    }

    const waitSec = checkCooldownRemainingSec(user);
    if (waitSec > 0) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSec}s before requesting another code.`,
      });
    }

    await issueAndSendOtp(user, purpose, user.pendingName || user.name);

    res.json({
      success: true,
      data: {
        email: user.email,
        message: `A fresh 6-digit code has been sent to ${user.email}.`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    await ensureConfiguredAdmins();
    const email = normalizeEmail(req.validatedBody.email);
    const user = await User.findOne({ email });

    if (user) {
      const waitSec = checkCooldownRemainingSec(user);
      if (waitSec > 0) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSec}s before requesting another reset code.`,
        });
      }
      await issueAndSendOtp(user, "reset_password", user.name);
    }

    res.json({
      success: true,
      data: {
        email,
        expiresInMinutes: 15,
        message:
          "If an account exists for this email, a 6-digit password reset code has been sent.",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    await ensureConfiguredAdmins();
    const email = normalizeEmail(req.validatedBody.email);
    const { otp, newPassword } = req.validatedBody;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code.",
      });
    }

    const check = await verifyUserOtp(user, "reset_password", otp);
    if (!check.ok) {
      return res.status(check.status).json({
        success: false,
        message: check.message,
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.pendingPasswordHash = null;
    user.pendingName = null;
    user.passwordSetupPending = false;
    user.isEmailVerified = true;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    if (isConfiguredAdminEmail(user.email)) {
      user.role = "admin";
    }
    clearOtpState(user);
    user.lastLoginAt = new Date();
    await user.save();

    const token = signAuthToken(user);
    setAuthCookie(res, req, token);

    res.json({
      success: true,
      data: {
        user: toSafeUser(user),
        message: "Password updated successfully.",
      },
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  clearAuthCookie(res, req);
  res.json({
    success: true,
    data: { loggedOut: true },
  });
}

export async function getMe(req, res, next) {
  try {
    const user = await resolveUserFromRequest(req);
    res.json({
      success: true,
      data: {
        authenticated: Boolean(user),
        user: user || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const sessionId = `user_${req.user.id}`;
    const [
      user,
      progress,
      totalLessonsCount,
      totalTopicsCount,
      recentAttempts,
      recentAiLogs,
    ] = await Promise.all([
      User.findById(req.user.id),
      LearnerProgress.findOne({ sessionId }).lean(),
      LearningModule.countDocuments(),
      StudyTopic.countDocuments(),
      QuizAttempt.find({ sessionId }).sort({ createdAt: -1 }).limit(10).lean(),
      AiUsageLog.find({ userEmail: req.user.email })
        .sort({ createdAt: -1 })
        .limit(15)
        .select(
          "feature modelUsed promptTokens outputTokens thoughtsTokens totalTokens isCacheHit label createdAt"
        )
        .lean(),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const bookmarkedSlugs = progress?.bookmarkedJobSlugs || [];
    const bookmarkedJobs =
      bookmarkedSlugs.length > 0
        ? await JobCircular.find({
            slug: { $in: bookmarkedSlugs },
            isActive: true,
          })
            .select("title slug organization deadlineDate deadlineRaw category")
            .limit(20)
            .lean()
        : [];

    res.json({
      success: true,
      data: {
        user: {
          ...toSafeUser(user),
          isPrimaryAdmin: isConfiguredAdminEmail(user.email),
        },
        studyStats: {
          completedLessonsCount: progress?.completedLessonSlugs?.length || 0,
          totalLessonsCount,
          completedTopicsCount: progress?.completedTopicSlugs?.length || 0,
          totalTopicsCount,
          completedRoutineDaysCount:
            progress?.completedRoutineDays?.length || 0,
          routineTrack: progress?.routineTrack || "BCS",
          wrongQuestionsCount: progress?.wrongQuestionIds?.length || 0,
          bookmarkedQuestionsCount:
            progress?.bookmarkedQuestionIds?.length || 0,
          bookmarkedJobsCount: bookmarkedSlugs.length,
          highlightsCount: progress?.studyHighlights?.length || 0,
        },
        bookmarkedJobs,
        recentAttempts,
        recentAiLogs: recentAiLogs.map((log) => ({
          id: String(log._id),
          feature: log.feature,
          modelUsed: log.modelUsed,
          promptTokens: Number(log.promptTokens) || 0,
          outputTokens: Number(log.outputTokens) || 0,
          thoughtsTokens: Number(log.thoughtsTokens) || 0,
          totalTokens: Number(log.totalTokens) || 0,
          isCacheHit: Boolean(log.isCacheHit),
          label: log.label || "",
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, targetTrack, bio } = req.validatedBody;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (name !== undefined) user.name = name;
    if (targetTrack !== undefined) user.targetTrack = targetTrack;
    if (bio !== undefined) user.bio = bio;
    await user.save();

    if (targetTrack !== undefined) {
      await LearnerProgress.updateOne(
        { sessionId: `user_${user._id}` },
        { $set: { targetTrack } },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      data: {
        user: {
          ...toSafeUser(user),
          isPrimaryAdmin: isConfiguredAdminEmail(user.email),
        },
        message: "Profile updated successfully.",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.validatedBody;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.passwordHash && !user.passwordSetupPending) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required.",
        });
      }
      const matches = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!matches) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect.",
        });
      }
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.passwordSetupPending = false;
    user.pendingPasswordHash = null;
    user.pendingName = null;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const token = signAuthToken(user);
    setAuthCookie(res, req, token);

    res.json({
      success: true,
      data: {
        user: {
          ...toSafeUser(user),
          isPrimaryAdmin: isConfiguredAdminEmail(user.email),
        },
        message: "Password updated successfully.",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const { password, confirmText } = req.validatedBody;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (isConfiguredAdminEmail(user.email)) {
      return res.status(403).json({
        success: false,
        message:
          "Configured primary admin account cannot be deleted while listed in ADMIN_EMAILS.",
      });
    }

    if (user.passwordHash && !user.passwordSetupPending) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Enter your password to confirm account deletion.",
        });
      }
      const matches = await bcrypt.compare(password, user.passwordHash);
      if (!matches) {
        return res.status(400).json({
          success: false,
          message: "Password is incorrect.",
        });
      }
    } else if (String(confirmText || "").trim().toUpperCase() !== "DELETE") {
      return res.status(400).json({
        success: false,
        message: 'Type "DELETE" to confirm permanent account removal.',
      });
    }

    await deleteUserAccountData(user);
    clearAuthCookie(res, req);

    res.json({
      success: true,
      data: {
        deleted: true,
        message: "Your account and personal study data have been deleted.",
      },
    });
  } catch (err) {
    next(err);
  }
}
