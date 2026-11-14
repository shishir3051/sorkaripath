import mongoose from "mongoose";
import { McqQuestion } from "../models/McqQuestion.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { LearnerProgress } from "../models/LearnerProgress.js";
import { StudyTopic } from "../models/StudyTopic.js";
import {
  capSearchQuery,
  escapeRegex,
  isValidSessionId,
} from "../utils/security.js";

export async function getQuestions(req, res, next) {
  try {
    const {
      subject = "All",
      examTrack = "All",
      examSeries = "All",
      difficulty = "All",
      tag = "",
      ids = "",
      limit = "15",
      includeAnswers = "true",
    } = req.query;

    const match = {};
    if (ids && String(ids).trim()) {
      const validIds = String(ids)
        .split(",")
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      match._id = { $in: validIds };
    } else {
      if (subject && subject !== "All") match.subject = subject;
      if (examTrack && examTrack !== "All") match.examTrack = examTrack;
      if (examSeries && examSeries !== "All") match.examSeries = examSeries;
      if (difficulty && difficulty !== "All") match.difficulty = difficulty;
      if (tag && String(tag).trim()) match.tags = String(tag).trim();
    }

    const size = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));

    const questions = await McqQuestion.aggregate([
      { $match: match },
      { $sample: { size } },
    ]);

    const sanitize = includeAnswers === "false";
    const items = questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      subject: q.subject,
      examTrack: q.examTrack,
      examSeries: q.examSeries,
      difficulty: q.difficulty,
      sourceYear: q.sourceYear,
      tags: q.tags,
      ...(sanitize
        ? {}
        : { correctIndex: q.correctIndex, explanation: q.explanation }),
    }));

    const [subjects, examTracks, examSeriesList, totalAvailable] =
      await Promise.all([
        McqQuestion.distinct("subject"),
        McqQuestion.distinct("examTrack"),
        McqQuestion.distinct("examSeries"),
        McqQuestion.countDocuments(match),
      ]);

    res.json({
      success: true,
      data: {
        items,
        totalAvailable,
        subjects,
        examTracks,
        examSeriesList: examSeriesList.filter(
          (s) => s && s !== "Topic Practice Bank"
        ),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function submitQuizAttempt(req, res, next) {
  try {
    const {
      sessionId,
      examTrack = "All Tracks",
      subject = "All Subjects",
      negativeMarkingEnabled = true,
      durationSeconds = 0,
      answers,
    } = req.validatedBody;

    const questionIds = answers
      .map((a) => String(a.questionId || "").trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid question IDs provided.",
      });
    }
    const questions = await McqQuestion.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map((q) => [String(q._id), q]));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const review = answers.map((ans) => {
      const q = questionMap.get(String(ans.questionId));
      if (!q) {
        return {
          questionId: ans.questionId,
          status: "missing",
        };
      }

      const selectedIndex =
        typeof ans.selectedIndex === "number" ? ans.selectedIndex : null;

      let isCorrect = false;
      let status = "unanswered";

      if (selectedIndex === null) {
        unansweredCount += 1;
      } else if (selectedIndex === q.correctIndex) {
        correctCount += 1;
        isCorrect = true;
        status = "correct";
      } else {
        wrongCount += 1;
        status = "wrong";
      }

      return {
        questionId: String(q._id),
        question: q.question,
        options: q.options,
        selectedIndex,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        subject: q.subject,
        isCorrect,
        status,
      };
    });

    const totalQuestions = answers.length;
    const penalty = negativeMarkingEnabled ? wrongCount * 0.5 : 0;
    const netScore = Number((correctCount - penalty).toFixed(2));
    const maxScore = totalQuestions;
    const accuracyPercent =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    const attempt = await QuizAttempt.create({
      sessionId,
      examTrack,
      subject,
      totalQuestions,
      correctCount,
      wrongCount,
      unansweredCount,
      negativeMarkingEnabled,
      netScore,
      maxScore,
      accuracyPercent,
      durationSeconds,
    });

    // Update persistent Mistake Vault for this learner session
    const wrongIds = review
      .filter((r) => r.status === "wrong")
      .map((r) => r.questionId);
    const correctIds = review
      .filter((r) => r.status === "correct")
      .map((r) => r.questionId);

    if (wrongIds.length > 0 || correctIds.length > 0) {
      let progress = await LearnerProgress.findOne({ sessionId });
      if (!progress) {
        progress = await LearnerProgress.create({ sessionId });
      }
      const nextWrongSet = new Set(progress.wrongQuestionIds || []);
      for (const id of wrongIds) nextWrongSet.add(id);
      for (const id of correctIds) nextWrongSet.delete(id);
      progress.wrongQuestionIds = Array.from(nextWrongSet);
      await progress.save();
    }

    res.status(201).json({
      success: true,
      data: {
        attempt,
        review,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAttemptHistory(req, res, next) {
  try {
    const sessionId = String(req.query.sessionId || "").trim();
    if (!isValidSessionId(sessionId)) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const attempts = await QuizAttempt.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    res.json({
      success: true,
      data: attempts,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPastPapersArchive(req, res, next) {
  try {
    const examSeries = String(req.query.examSeries || "").trim();

    const seriesList = await McqQuestion.aggregate([
      {
        $match: {
          examSeries: { $type: "string", $nin: ["Topic Practice Bank", ""] },
        },
      },
      {
        $group: {
          _id: "$examSeries",
          count: { $sum: 1 },
          examTrack: { $first: "$examTrack" },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const activeSeries =
      examSeries || seriesList[0]?._id || "Topic Practice Bank";

    const items = await McqQuestion.find({ examSeries: activeSeries })
      .sort({ _id: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        activeSeries,
        seriesList: seriesList.map((s) => ({
          examSeries: s._id,
          count: s.count,
          examTrack: s.examTrack,
        })),
        items,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function smartSearchPractice(req, res, next) {
  try {
    const q = capSearchQuery(req.query.q, 100);
    const subject = String(req.query.subject || "All");

    const qFilter = {};
    if (subject && subject !== "All") qFilter.subject = subject;

    const topicFilter = {};
    if (subject && subject !== "All") topicFilter.subject = subject;

    if (q) {
      const tokens = q
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5);

      qFilter.$and = tokens.map((tok) => {
        const rx = new RegExp(escapeRegex(tok), "i");
        return {
          $or: [
            { question: rx },
            { explanation: rx },
            { tags: rx },
            { examSeries: rx },
            { subject: rx },
          ],
        };
      });

      topicFilter.$and = tokens.map((tok) => {
        const rx = new RegExp(escapeRegex(tok), "i");
        return {
          $or: [
            { title: rx },
            { unit: rx },
            { highYieldSummary: rx },
            { keyFacts: rx },
          ],
        };
      });
    }

    const [questions, topics] = await Promise.all([
      McqQuestion.find(qFilter).sort({ createdAt: -1 }).limit(30).lean(),
      StudyTopic.find(topicFilter).sort({ order: 1 }).limit(8).lean(),
    ]);

    res.json({
      success: true,
      data: {
        questions,
        topics,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMistakeVault(req, res, next) {
  try {
    const sessionId = String(req.query.sessionId || "").trim();
    if (!isValidSessionId(sessionId)) {
      return res.json({
        success: true,
        data: { wrongQuestions: [], bookmarkedQuestions: [] },
      });
    }

    const progress = await LearnerProgress.findOne({ sessionId }).lean();
    if (!progress) {
      return res.json({
        success: true,
        data: { wrongQuestions: [], bookmarkedQuestions: [] },
      });
    }

    const wrongObjIds = (progress.wrongQuestionIds || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    const bookmarkObjIds = (progress.bookmarkedQuestionIds || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    const [wrongQuestions, bookmarkedQuestions] = await Promise.all([
      wrongObjIds.length > 0
        ? McqQuestion.find({ _id: { $in: wrongObjIds } }).lean()
        : Promise.resolve([]),
      bookmarkObjIds.length > 0
        ? McqQuestion.find({ _id: { $in: bookmarkObjIds } }).lean()
        : Promise.resolve([]),
    ]);

    res.json({
      success: true,
      data: {
        wrongQuestions,
        bookmarkedQuestions,
      },
    });
  } catch (err) {
    next(err);
  }
}
