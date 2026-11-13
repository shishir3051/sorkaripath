import { LearningModule } from "../models/LearningModule.js";
import { McqQuestion } from "../models/McqQuestion.js";
import { capSearchQuery, escapeRegex } from "../utils/security.js";

export async function listLessons(req, res, next) {
  try {
    const { stage = "", difficulty = "", q = "" } = req.query;
    const filter = {};

    if (stage && stage !== "All") filter.stage = stage;
    if (difficulty && difficulty !== "All") filter.difficulty = difficulty;

    const search = capSearchQuery(q, 100);
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { title: regex },
        { titleBn: regex },
        { subtitle: regex },
        { summary: regex },
        { letter: regex },
      ];
    }

    const modules = await LearningModule.find(filter)
      .select(
        "letter order stage slug title titleBn subtitle estimatedMinutes difficulty summary checklist quizTags updatedForYear"
      )
      .sort({ order: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        items: modules,
        total: modules.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLessonBySlug(req, res, next) {
  try {
    const lesson = await LearningModule.findOne({ slug: req.params.slug }).lean();
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Learning module not found",
      });
    }

    const [prevLesson, nextLesson, relatedMcqCount] = await Promise.all([
      LearningModule.findOne({ order: lesson.order - 1 })
        .select("letter slug title")
        .lean(),
      LearningModule.findOne({ order: lesson.order + 1 })
        .select("letter slug title")
        .lean(),
      lesson.quizTags?.length
        ? McqQuestion.countDocuments({
            $or: [
              { tags: { $in: lesson.quizTags } },
              { subject: { $in: lesson.quizTags } },
            ],
          })
        : Promise.resolve(0),
    ]);

    res.json({
      success: true,
      data: {
        lesson,
        prevLesson,
        nextLesson,
        relatedMcqCount,
      },
    });
  } catch (err) {
    next(err);
  }
}
