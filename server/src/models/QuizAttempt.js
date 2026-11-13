import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    examTrack: { type: String, default: "All Tracks" },
    subject: { type: String, default: "All Subjects" },
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    wrongCount: { type: Number, required: true },
    unansweredCount: { type: Number, default: 0 },
    negativeMarkingEnabled: { type: Boolean, default: true },
    netScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    accuracyPercent: { type: Number, required: true },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const QuizAttempt =
  mongoose.models.QuizAttempt || mongoose.model("QuizAttempt", quizAttemptSchema);
