import { CurrentAffairsItem } from "../models/CurrentAffairsItem.js";
import { StudyResource } from "../models/StudyResource.js";
import { StudyTopic } from "../models/StudyTopic.js";
import { McqQuestion } from "../models/McqQuestion.js";
import { WebSource } from "../models/WebSource.js";
import { capSearchQuery, escapeRegex } from "../utils/security.js";

function buildAffairsFilter({ topic, language, q }) {
  const filter = {};
  if (topic && topic !== "All") {
    filter.topic = topic;
  }
  if (language && language !== "All") {
    filter.language = language;
  }
  const search = capSearchQuery(q, 100);
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: rx }, { summary: rx }, { sourceName: rx }];
  }
  return filter;
}

function buildModelTestCatalog(trackCountMap, subjectCountMap, totalMcqCount) {
  const presets = [
    {
      id: "full-bd-govt-mix",
      title: "All-Track BD Govt Mega Mock",
      subtitle: "Mixed Bangla, English, BD Affairs, ICT & Math across all tracks",
      examTrack: "All",
      subject: "All",
      availableQuestions: totalMcqCount,
      questionLimit: Math.min(30, Math.max(10, totalMcqCount)),
      officialPattern: "100–200 MCQ standard screening pattern",
      durationMinutes: 25,
      negativeMarking: "0.50 mark per wrong answer (BCS/PSC benchmark)",
      badge: "Recommended Daily Mix",
    },
    {
      id: "bcs-prelims-mock",
      title: "BCS Preliminary High-Yield Mock",
      subtitle: "46th–50th BCS Prelims syllabus focus with Governance & BD Affairs",
      examTrack: "BCS Preliminary",
      subject: "All",
      availableQuestions: trackCountMap["BCS Preliminary"] || 0,
      questionLimit: Math.min(25, Math.max(5, trackCountMap["BCS Preliminary"] || 15)),
      officialPattern: "BPSC Official: 200 MCQ / 2 Hours / 0.50 negative",
      durationMinutes: 20,
      negativeMarking: "0.50 mark deducted per wrong answer",
      badge: "Cadre Track",
    },
    {
      id: "bank-combined-mock",
      title: "Bangladesh Bank & Combined Bank Mock",
      subtitle: "Banking sector math, English comprehension, monetary policy & ICT",
      examTrack: "Bank Combined",
      subject: "All",
      availableQuestions: trackCountMap["Bank Combined"] || 0,
      questionLimit: Math.min(20, Math.max(5, trackCountMap["Bank Combined"] || 10)),
      officialPattern: "Bankers Selection Committee: 100 MCQ / 60 Min / 0.25 negative",
      durationMinutes: 15,
      negativeMarking: "0.25 mark deducted per wrong answer",
      badge: "Banker Track",
    },
    {
      id: "primary-ntrca-mock",
      title: "Primary Assistant Teacher & NTRCA Mock",
      subtitle: "NCTB Bangla grammar, English, arithmetic & BD Liberation War core",
      examTrack: "Primary & NTRCA",
      subject: "All",
      availableQuestions: trackCountMap["Primary & NTRCA"] || 0,
      questionLimit: Math.min(20, Math.max(5, trackCountMap["Primary & NTRCA"] || 10)),
      officialPattern: "DPE 75–80 MCQ / NTRCA 100 MCQ (40% pass mark)",
      durationMinutes: 15,
      negativeMarking: "0.25–0.50 mark depending on DPE / NTRCA",
      badge: "Teaching Track",
    },
    {
      id: "grade-11-20-mock",
      title: "Ministry & Grade 11–20 Screening Mock",
      subtitle: "Office assistant, computer operator & non-cadre ministry written-prep MCQs",
      examTrack: "Grade 11-20",
      subject: "All",
      availableQuestions: trackCountMap["Grade 11-20"] || 0,
      questionLimit: Math.min(20, Math.max(5, trackCountMap["Grade 11-20"] || 10)),
      officialPattern: "Ministry Standard: 70–100 MCQ + Practical Typing Test",
      durationMinutes: 15,
      negativeMarking: "Check individual circular notice (0 or 0.25)",
      badge: "Ministry Track",
    },
    {
      id: "govt-rules-2026-mock",
      title: "2026 Govt Rules, Constitution & Service Act Drill",
      subtitle: "2024 Quota Reform (93% Merit), Age Limit 32 Ordinance & Constitutional Articles",
      examTrack: "Govt Rules 2026",
      subject: "All",
      availableQuestions: trackCountMap["Govt Rules 2026"] || 0,
      questionLimit: Math.min(15, Math.max(5, trackCountMap["Govt Rules 2026"] || 10)),
      officialPattern: "Viva Voce & Current Governance Hot-Topics",
      durationMinutes: 10,
      negativeMarking: "Self-paced conceptual mastery check",
      badge: "2026 Viva & Policy",
    },
    {
      id: "ict-science-sprint",
      title: "Computer, Cyber & General Science Sprint",
      subtitle: "Essential for all Bank, ICT Directorate, Computer Operator & BCS exams",
      examTrack: "All",
      subject: "General Science & ICT",
      availableQuestions: subjectCountMap["General Science & ICT"] || 0,
      questionLimit: Math.min(
        20,
        Math.max(5, subjectCountMap["General Science & ICT"] || 10)
      ),
      officialPattern: "High-scoring technical & daily science section",
      durationMinutes: 12,
      negativeMarking: "Standard 0.50 benchmark",
      badge: "Subject Focus",
    },
  ];

  return presets;
}

export async function getStudyOverview(_req, res, next) {
  try {
    const [
      currentAffairs,
      affairsCount,
      affairsTopics,
      books,
      topics,
      pastSeriesAgg,
      trackAggregation,
      subjectAggregation,
      mcqCount,
      affairsSources,
    ] = await Promise.all([
      CurrentAffairsItem.find()
        .sort({ publishedDate: -1, createdAt: -1 })
        .limit(12)
        .lean(),
      CurrentAffairsItem.countDocuments(),
      CurrentAffairsItem.aggregate([
        { $group: { _id: "$topic", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      StudyResource.find().sort({ order: 1, createdAt: 1 }).lean(),
      StudyTopic.find().sort({ order: 1, createdAt: 1 }).lean(),
      McqQuestion.aggregate([
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
      ]),
      McqQuestion.aggregate([
        { $group: { _id: "$examTrack", count: { $sum: 1 } } },
      ]),
      McqQuestion.aggregate([
        { $group: { _id: "$subject", count: { $sum: 1 } } },
      ]),
      McqQuestion.countDocuments(),
      WebSource.find({ targetType: "current_affairs" }).sort({ name: 1 }).lean(),
    ]);

    const trackCountMap = Object.fromEntries(
      trackAggregation.map((t) => [t._id, t.count])
    );
    const subjectCountMap = Object.fromEntries(
      subjectAggregation.map((s) => [s._id, s.count])
    );

    const modelTests = buildModelTestCatalog(
      trackCountMap,
      subjectCountMap,
      mcqCount
    );

    const pastPapers = pastSeriesAgg.map((p) => ({
      examSeries: p._id,
      count: p.count,
      examTrack: p.examTrack,
    }));

    const routine = buildGuidedRoutine(topics, "BCS");

    res.json({
      success: true,
      data: {
        currentAffairs,
        affairsTopics: affairsTopics.map((t) => ({ topic: t._id, count: t.count })),
        affairsSources,
        books,
        topics,
        pastPapers,
        routine,
        modelTests,
        stats: {
          affairsCount,
          booksCount: books.length,
          topicsCount: topics.length,
          pastPapersCount: pastPapers.length,
          mcqCount,
          affairsFeedCount: affairsSources.filter((s) => s.enabled).length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

function buildGuidedRoutine(allTopics, track = "BCS") {
  const trackMap = {
    BCS: "BCS Preliminary",
    "Bank & Financial": "Bank Combined",
    "Primary & NTRCA": "Primary & NTRCA",
    "Grade 11-20": "Grade 11-20",
  };
  const pastPaperByTrack = {
    BCS: "46th BCS Preliminary Archive",
    "Bank & Financial": "Bangladesh Bank & Combined Bank Archive",
    "Primary & NTRCA": "Primary & NTRCA Archive",
    "Grade 11-20": "Ministry Grade 11-20 Archive",
  };

  const trackTopics = allTopics.filter((t) =>
    t.targetTracks?.includes(track)
  );
  const pool = trackTopics.length > 0 ? trackTopics : allTopics;

  const days = [];
  for (let d = 1; d <= 30; d += 1) {
    if (d <= 20) {
      const topicObj = pool[(d - 1) % pool.length];
      const phase =
        d <= 10 ? "Foundation Phase" : "Core Mastery & Revision";
      days.push({
        day: d,
        phase,
        title: `Read: ${topicObj?.unit || topicObj?.subject}`,
        focusSummary: `${topicObj?.title || "Core Subject Sheet"} + 5 live Current Affairs headlines + 10 MCQ drill.`,
        topicSlug: topicObj?.slug || "",
        practiceSubject: topicObj?.mcqSubjectFilter || "All",
        examTrack: trackMap[track] || "All",
        actionType: "topic",
      });
    } else if (d <= 26) {
      const archiveSeries =
        d % 2 === 0 && track === "BCS"
          ? "45th BCS Preliminary Archive"
          : pastPaperByTrack[track] || "46th BCS Preliminary Archive";
      days.push({
        day: d,
        phase: "Job Solution Archive Phase",
        title: `Solve Past Paper: ${archiveSeries}`,
        focusSummary:
          "Study authentic previous exam questions in Job Solution mode, read every explanation, and test your speed.",
        examSeries: archiveSeries,
        practiceSubject: "All",
        examTrack: trackMap[track] || "All",
        actionType: "archive",
      });
    } else if (d <= 28) {
      days.push({
        day: d,
        phase: "Mistake Clearance Phase",
        title:
          d === 27
            ? "Clear Mistake Vault (Retry Wrong Answers)"
            : "Smart Search Revision: Formulas, Constitution & Vocab",
        focusSummary:
          d === 27
            ? "Re-attempt every question inside your Mistake Vault until zero weak items remain."
            : "Search weak keywords in MCQ Smart Search + review your saved Flashcards.",
        practiceSubject: "All",
        examTrack: trackMap[track] || "All",
        actionType: d === 27 ? "mistakes" : "search",
      });
    } else {
      days.push({
        day: d,
        phase: "Final Model Exam Phase",
        title: `Full Timed ${track} Mock Exam (${d === 29 ? "Set A" : "Final Assessment"})`,
        focusSummary:
          "Complete a full timed mock with -0.50 BPSC negative marking and review net score readiness.",
        practiceSubject: "All",
        examTrack: trackMap[track] || "All",
        actionType: "mock",
      });
    }
  }

  return {
    track,
    totalDays: 30,
    days,
  };
}

export async function getStudyTopics(req, res, next) {
  try {
    const { subject = "All", track = "All", q = "" } = req.query;
    const filter = {};
    if (subject && subject !== "All") filter.subject = subject;
    if (track && track !== "All") filter.targetTracks = track;
    const topicSearch = capSearchQuery(q, 100);
    if (topicSearch) {
      const rx = new RegExp(escapeRegex(topicSearch), "i");
      filter.$or = [
        { title: rx },
        { unit: rx },
        { highYieldSummary: rx },
        { keyFacts: rx },
        { "chapters.heading": rx },
        { "chapters.explanation": rx },
        { "chapters.points": rx },
      ];
    }

    const [items, subjects] = await Promise.all([
      StudyTopic.find(filter).sort({ order: 1, createdAt: 1 }).lean(),
      StudyTopic.distinct("subject"),
    ]);

    res.json({
      success: true,
      data: {
        items,
        subjects,
        total: items.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudyTopicBySlug(req, res, next) {
  try {
    const topic = await StudyTopic.findOne({ slug: req.params.slug }).lean();
    if (!topic) {
      return res.status(404).json({ success: false, message: "Topic sheet not found" });
    }

    const relatedQuestions = await McqQuestion.find({
      subject: topic.mcqSubjectFilter || topic.subject,
    })
      .limit(8)
      .lean();

    res.json({
      success: true,
      data: {
        topic,
        relatedQuestions,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudyRoutine(req, res, next) {
  try {
    const track = String(req.query.track || "BCS");
    const topics = await StudyTopic.find().sort({ order: 1 }).lean();
    const routine = buildGuidedRoutine(topics, track);
    res.json({ success: true, data: routine });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentAffairs(req, res, next) {
  try {
    const {
      topic = "All",
      language = "All",
      q = "",
      page = "1",
      limit = "24",
    } = req.query;

    const filter = buildAffairsFilter({ topic, language, q });
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 24));

    const [items, total, topics] = await Promise.all([
      CurrentAffairsItem.find(filter)
        .sort({ publishedDate: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      CurrentAffairsItem.countDocuments(filter),
      CurrentAffairsItem.distinct("topic"),
    ]);

    res.json({
      success: true,
      data: {
        items,
        topics,
        total,
        page: pageNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getBooks(req, res, next) {
  try {
    const {
      examTrack = "All",
      priority = "All",
      resourceType = "All",
      q = "",
    } = req.query;

    const filter = {};
    if (examTrack && examTrack !== "All") filter.examTrack = examTrack;
    if (priority && priority !== "All") filter.priority = priority;
    if (resourceType && resourceType !== "All") filter.resourceType = resourceType;
    const bookSearch = capSearchQuery(q, 100);
    if (bookSearch) {
      const rx = new RegExp(escapeRegex(bookSearch), "i");
      filter.$or = [
        { title: rx },
        { subject: rx },
        { whyStudy: rx },
        { authorOrPublisher: rx },
      ];
    }

    const [items, examTracks] = await Promise.all([
      StudyResource.find(filter).sort({ order: 1, createdAt: 1 }).lean(),
      StudyResource.distinct("examTrack"),
    ]);

    res.json({
      success: true,
      data: {
        items,
        examTracks,
        total: items.length,
      },
    });
  } catch (err) {
    next(err);
  }
}
