import mongoose from "mongoose";

const learnerProgressSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    completedLessonSlugs: { type: [String], default: [] },
    completedTopicSlugs: { type: [String], default: [] },
    completedRoutineDays: { type: [Number], default: [] },
    routineTrack: { type: String, default: "BCS" },
    wrongQuestionIds: { type: [String], default: [] },
    bookmarkedQuestionIds: { type: [String], default: [] },
    bookmarkedJobSlugs: { type: [String], default: [] },
    targetTrack: { type: String, default: "BCS & General Govt" },
  },
  { timestamps: true }
);

export const LearnerProgress =
  mongoose.models.LearnerProgress ||
  mongoose.model("LearnerProgress", learnerProgressSchema);
