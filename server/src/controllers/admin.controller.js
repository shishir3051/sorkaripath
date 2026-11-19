import mongoose from "mongoose";
import { User, toSafeUser } from "../models/User.js";
import { AiUsageLog } from "../models/AiUsageLog.js";
import { JobCircular } from "../models/JobCircular.js";
import { LearningModule } from "../models/LearningModule.js";
import { StudyTopic } from "../models/StudyTopic.js";
import { McqQuestion } from "../models/McqQuestion.js";
import { isConfiguredAdminEmail } from "../services/authBootstrapService.js";

export async function getAdminOverview(_req, res, next) {
  try {
    const [
      totalUsers,
      verifiedUsers,
      adminUsers,
      totalCirculars,
      lessonCount,
      topicCount,
      mcqCount,
      users,
      recentCirculars,
      aiSummaryAgg,
      aiUserAgg,
      recentAiLogs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ role: "admin" }),
      JobCircular.countDocuments({ isActive: true }),
      LearningModule.countDocuments(),
      StudyTopic.countDocuments(),
      McqQuestion.countDocuments(),
      User.find().sort({ role: 1, createdAt: -1 }).limit(100).lean(),
      JobCircular.find({ isActive: true })
        .sort({ publishedDate: -1, createdAt: -1 })
        .limit(15)
        .select("title slug organization category origin recordType publishedDate isFeatured")
        .lean(),
      AiUsageLog.aggregate([
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            apiCalls: { $sum: { $cond: ["$isCacheHit", 0, 1] } },
            cacheHits: { $sum: { $cond: ["$isCacheHit", 1, 0] } },
            promptTokens: { $sum: "$promptTokens" },
            outputTokens: { $sum: "$outputTokens" },
            thoughtsTokens: { $sum: "$thoughtsTokens" },
            cachedTokens: { $sum: "$cachedTokens" },
            totalTokens: { $sum: "$totalTokens" },
          },
        },
      ]),
      AiUsageLog.aggregate([
        {
          $group: {
            _id: "$userEmail",
            userId: { $last: "$userId" },
            userName: { $last: "$userName" },
            totalRequests: { $sum: 1 },
            apiCalls: { $sum: { $cond: ["$isCacheHit", 0, 1] } },
            cacheHits: { $sum: { $cond: ["$isCacheHit", 1, 0] } },
            promptTokens: { $sum: "$promptTokens" },
            outputTokens: { $sum: "$outputTokens" },
            thoughtsTokens: { $sum: "$thoughtsTokens" },
            totalTokens: { $sum: "$totalTokens" },
            lastUsedAt: { $max: "$createdAt" },
            studyTutorCalls: {
              $sum: { $cond: [{ $eq: ["$feature", "study_tutor"] }, 1, 0] },
            },
            generateMcqsCalls: {
              $sum: { $cond: [{ $eq: ["$feature", "generate_mcqs"] }, 1, 0] },
            },
            circularDiscoverCalls: {
              $sum: { $cond: [{ $eq: ["$feature", "circular_discover"] }, 1, 0] },
            },
            circularAnalyzeCalls: {
              $sum: { $cond: [{ $eq: ["$feature", "circular_analyze"] }, 1, 0] },
            },
          },
        },
        { $sort: { totalTokens: -1, totalRequests: -1, lastUsedAt: -1 } },
        { $limit: 100 },
      ]),
      AiUsageLog.find()
        .sort({ createdAt: -1 })
        .limit(25)
        .select(
          "userEmail userName feature modelUsed keySlotUsed promptTokens outputTokens thoughtsTokens totalTokens isCacheHit label createdAt"
        )
        .lean(),
    ]);

    const userRoleByEmail = new Map(
      users.map((u) => [u.email, u.role === "admin" ? "admin" : "user"])
    );

    const rawSummary = aiSummaryAgg[0] || {};
    const aiUserBreakdown = aiUserAgg.map((row) => ({
      userId: row.userId ? String(row.userId) : null,
      userEmail: row._id || "guest",
      userName: row.userName || row._id || "Guest Visitor",
      role:
        row._id === "guest"
          ? "guest"
          : userRoleByEmail.get(row._id) || "user",
      totalRequests: Number(row.totalRequests) || 0,
      apiCalls: Number(row.apiCalls) || 0,
      cacheHits: Number(row.cacheHits) || 0,
      promptTokens: Number(row.promptTokens) || 0,
      outputTokens: Number(row.outputTokens) || 0,
      thoughtsTokens: Number(row.thoughtsTokens) || 0,
      totalTokens: Number(row.totalTokens) || 0,
      lastUsedAt: row.lastUsedAt || null,
      features: {
        study_tutor: Number(row.studyTutorCalls) || 0,
        generate_mcqs: Number(row.generateMcqsCalls) || 0,
        circular_discover: Number(row.circularDiscoverCalls) || 0,
        circular_analyze: Number(row.circularAnalyzeCalls) || 0,
      },
    }));

    const aiSummary = {
      totalRequests: Number(rawSummary.totalRequests) || 0,
      apiCalls: Number(rawSummary.apiCalls) || 0,
      cacheHits: Number(rawSummary.cacheHits) || 0,
      promptTokens: Number(rawSummary.promptTokens) || 0,
      outputTokens: Number(rawSummary.outputTokens) || 0,
      thoughtsTokens: Number(rawSummary.thoughtsTokens) || 0,
      cachedTokens: Number(rawSummary.cachedTokens) || 0,
      totalTokens: Number(rawSummary.totalTokens) || 0,
      uniqueUsersCount: aiUserBreakdown.length,
    };

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          verifiedUsers,
          adminUsers,
          totalCirculars,
          lessonCount,
          topicCount,
          mcqCount,
        },
        users: users.map((u) => ({
          ...toSafeUser(u),
          isPrimaryAdmin: isConfiguredAdminEmail(u.email),
        })),
        recentCirculars,
        aiSummary,
        aiUserBreakdown,
        recentAiLogs: recentAiLogs.map((log) => ({
          id: String(log._id),
          userEmail: log.userEmail,
          userName: log.userName,
          feature: log.feature,
          modelUsed: log.modelUsed,
          keySlotUsed: log.keySlotUsed,
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

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const { role } = req.validatedBody;
    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (String(target._id) === req.user.id && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot revoke your own admin privileges.",
      });
    }

    if (isConfiguredAdminEmail(target.email) && role !== "admin") {
      return res.status(400).json({
        success: false,
        message:
          "Configured primary admin account cannot be demoted while listed in ADMIN_EMAILS.",
      });
    }

    const roleChanged = target.role !== role;
    target.role = role;
    if (roleChanged && role !== "admin") {
      target.tokenVersion = (target.tokenVersion || 0) + 1;
    }
    await target.save();

    res.json({
      success: true,
      data: {
        user: {
          ...toSafeUser(target),
          isPrimaryAdmin: isConfiguredAdminEmail(target.email),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
