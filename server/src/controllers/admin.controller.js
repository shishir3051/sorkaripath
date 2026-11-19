import mongoose from "mongoose";
import { User, toSafeUser } from "../models/User.js";
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
    ]);

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
