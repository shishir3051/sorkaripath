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

const SUBJECT_SPRINT_CONFIGS = [
  {
    id: "ict-science-sprint",
    title: "Computer, Cyber & General Science Sprint",
    subtitle: "Essential for all Bank, ICT Directorate, Computer Operator & BCS exams",
    subject: "General Science & ICT",
    officialPattern: "High-scoring technical & daily science section",
    badge: "Subject Focus",
  },
  {
    id: "bangla-master-sprint",
    title: "Bangla Literature & Grammar Marathon",
    subtitle: "Charjapad to Modern Era, Sondhi, Samas, Karok & spelling rules",
    subject: "Bangla",
    officialPattern: "BCS 35 Marks & Primary/Ministry 20–25 MCQ standard",
    badge: "Bangla Core",
  },
  {
    id: "english-master-sprint",
    title: "English Grammar, Idioms & Comprehension Sprint",
    subtitle: "BCS Literature, Prepositions, Conditionals, Voice & Bank error detection",
    subject: "English",
    officialPattern: "BCS 35 Marks & Bank 25 MCQ benchmark",
    badge: "English Core",
  },
  {
    id: "math-mental-sprint",
    title: "Maths & Mental Ability Problem-Solving Sprint",
    subtitle: "Percentage, Profit-Loss, Mensuration, Probability & IQ Puzzles",
    subject: "Math & Mental Ability",
    officialPattern: "BCS 30 Marks & Bank Analytical Math Focus",
    badge: "Math & IQ",
  },
  {
    id: "ethics-governance-sprint",
    title: "Ethics, Values & Good Governance Sprint",
    subtitle: "10-Mark BCS Ethics module, UNCAC, NIS & Public Administration integrity",
    subject: "Ethics & Governance",
    officialPattern: "BCS 10 Marks + Cadre Viva Integrity Check",
    badge: "Ethics & NIS",
  },
  {
    id: "geography-delta-sprint",
    title: "Geography, Disaster & Delta Plan Sprint",
    subtitle: "Bengal Basin rivers, Bay of Bengal, Climate Agreements & BD Delta Plan 2100",
    subject: "Geography & Environment",
    officialPattern: "BCS 10 Marks + Environmental GK",
    badge: "Geo & Climate",
  },
  {
    id: "rules-banking-sprint",
    title: "Service Rules, Banking & Constitution Sprint",
    subtitle: "2026 Pay Scale, Quota Reform, BB Monetary Policy, BASEL III & Art 133–141",
    subject: "Govt Job Rules & Banking",
    officialPattern: "Govt Departmental, Viva & Bank SO Core",
    badge: "2026 Policy & Bank",
  },
];

function buildModelTestCatalog(trackCountMap, subjectCountMap, totalMcqCount) {
  const presets = [
    {
      id: "full-bd-govt-mix",
      title: "All-Track BD Govt Mega Mock",
      subtitle: "Mixed 9-subject full-length screening mock across all BD govt tracks",
      examTrack: "All",
      subject: "All",
      availableQuestions: totalMcqCount,
      questionLimit: Math.min(50, Math.max(15, totalMcqCount)),
      officialPattern: "100–200 MCQ standard screening pattern",
      durationMinutes: 40,
      negativeMarking: "0.50 mark per wrong answer (BCS/PSC benchmark)",
      badge: "Recommended Full Mix",
    },
    {
      id: "bcs-prelims-mock",
      title: "BCS Preliminary High-Yield Mock",
      subtitle: "46th–50th BCS Prelims syllabus focus with Ethics, Geography & BD Affairs",
      examTrack: "BCS Preliminary",
      subject: "All",
      availableQuestions: trackCountMap["BCS Preliminary"] || 0,
      questionLimit: Math.min(40, Math.max(10, trackCountMap["BCS Preliminary"] || 15)),
      officialPattern: "BPSC Official: 200 MCQ / 2 Hours / 0.50 negative",
      durationMinutes: 30,
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
      questionLimit: Math.min(30, Math.max(10, trackCountMap["Bank Combined"] || 10)),
      officialPattern: "Bankers Selection Committee: 100 MCQ / 60 Min / 0.25 negative",
      durationMinutes: 25,
      negativeMarking: "0.25 mark deducted per wrong answer",
      badge: "Banker Track",
    },
    {
      id: "primary-ntrca-mock",
      title: "Primary Assistant Teacher & NTRCA Mock",
      subtitle: "NCTB Bangla grammar, English, arithmetic, Pedagogy & Liberation War",
      examTrack: "Primary & NTRCA",
      subject: "All",
      availableQuestions: trackCountMap["Primary & NTRCA"] || 0,
      questionLimit: Math.min(30, Math.max(10, trackCountMap["Primary & NTRCA"] || 10)),
      officialPattern: "DPE 75–80 MCQ / NTRCA 100 MCQ (40% pass mark)",
      durationMinutes: 25,
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
      questionLimit: Math.min(25, Math.max(10, trackCountMap["Grade 11-20"] || 10)),
      officialPattern: "Ministry Standard: 70–100 MCQ + Practical Typing Test",
      durationMinutes: 20,
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
      questionLimit: Math.min(25, Math.max(10, trackCountMap["Govt Rules 2026"] || 10)),
      officialPattern: "Viva Voce & Current Governance Hot-Topics",
      durationMinutes: 20,
      negativeMarking: "Self-paced conceptual mastery check",
      badge: "2026 Viva & Policy",
    },
  ];

  for (const cfg of SUBJECT_SPRINT_CONFIGS) {
    const count = subjectCountMap[cfg.subject] || 0;
    const questionLimit = Math.min(25, Math.max(5, count || 10));
    presets.push({
      id: cfg.id,
      title: cfg.title,
      subtitle: cfg.subtitle,
      examTrack: "All",
      subject: cfg.subject,
      availableQuestions: count,
      questionLimit,
      officialPattern: cfg.officialPattern,
      durationMinutes: Math.max(10, Math.round(questionLimit * 0.75)),
      negativeMarking: "Standard 0.50 benchmark",
      badge: cfg.badge,
    });
  }

  return presets;
}

const STUDY_BATCH_DEFINITIONS = [
  {
    id: "bcs-cadre-batch",
    title: "BCS Preliminary & Written Master Batch (46th–50th)",
    badge: "Cadre Foundation Batch",
    trackKey: "BCS",
    examTrack: "BCS Preliminary",
    weeklyHours: "14 hrs / week",
    targetExam: "BPSC Cadre & Non-Cadre (200 MCQ + Written)",
    syllabusSummary:
      "Complete 9-subject BPSC roadmap combining Bangla, English, Math, BD & Intl Affairs, Science/ICT, Ethics and Geography lecture sheets with past BCS MCQ archives.",
    recommendedModelTestId: "bcs-prelims-mock",
    featuredSeries: [
      "46th BCS Preliminary Archive",
      "45th BCS Preliminary Archive",
      "44th BCS Preliminary Archive",
      "43rd & 41st BCS Archive",
      "40th-42nd BCS Preliminary Archive",
      "35th-39th BCS Preliminary Archive",
      "30th-34th BCS Preliminary Archive",
      "20th-29th BCS Preliminary Archive",
      "10th-19th BCS Preliminary Archive",
      "Geography & Intl Affairs Master Archive",
    ],
  },
  {
    id: "combined-bank-batch",
    title: "Bangladesh Bank AD & Combined Bank SO/Officer Batch",
    badge: "Banker Track Batch",
    trackKey: "Bank & Financial",
    examTrack: "Bank Combined",
    weeklyHours: "12 hrs / week",
    targetExam: "BB AD, Sonali, Rupali, Agrani & Combined Bank",
    syllabusSummary:
      "Structured BSC preliminary + 200-mark written blueprint: English focus writing, step-by-step Bank written math, DBMS/networking ICT, and Bangladesh Bank monetary policy.",
    recommendedModelTestId: "bank-combined-mock",
    featuredSeries: ["Sonali & Combined Bank SO Archive", "Bangladesh Bank AD Archive"],
  },
  {
    id: "primary-ntrca-batch",
    title: "Primary Assistant Teacher & NTRCA Rapid Batch",
    badge: "Teaching Track Batch",
    trackKey: "Primary & NTRCA",
    examTrack: "Primary & NTRCA",
    weeklyHours: "10 hrs / week",
    targetExam: "DPE Primary Teacher & NTRCA College/School",
    syllabusSummary:
      "High-retention NCTB Class 5–10 foundation: Bangla grammar, English basics, short-cut arithmetic, Liberation War, classroom pedagogy and 40%+ qualifying drills.",
    recommendedModelTestId: "primary-ntrca-mock",
    featuredSeries: [
      "18th NTRCA & Primary Master Archive",
      "DPE Primary Teacher Master Archive",
      "Primary & NTRCA Archive",
    ],
  },
  {
    id: "ministry-grade-batch",
    title: "Post Office, Ministry Grade 11–20 & Computer Operator Batch",
    badge: "Secretariat & Office Batch",
    trackKey: "Grade 11-20",
    examTrack: "Grade 11-20",
    weeklyHours: "8 hrs / week",
    targetExam: "Post Office, Secretariat, DG Food, DC Office, BRTA & Railway",
    syllabusSummary:
      "Focused non-cadre prep for Post Office, Computer Operator, Office Assistant & Auditor exams: MS Office/shortcuts, Bangla spelling, English prepositions, math & 2026 Pay Scale/Quota rules.",
    recommendedModelTestId: "grade-11-20-mock",
    featuredSeries: [
      "Bangladesh Post Office & Directorate Archive",
      "Ministry Grade 11-20 Archive",
      "2026 Govt Rules & Constitution Archive",
    ],
  },
];

function buildStudyBatches(topics, trackCountMap, pastPapers) {
  const pastSeriesSet = new Set(pastPapers.map((p) => p.examSeries));
  return STUDY_BATCH_DEFINITIONS.map((batch) => {
    const matchedTopics = topics.filter(
      (t) => Array.isArray(t.targetTracks) && t.targetTracks.includes(batch.trackKey)
    );
    const orderedTopics = matchedTopics.length ? matchedTopics : topics.slice(0, 8);
    const totalEstimatedMinutes = orderedTopics.reduce(
      (sum, t) => sum + (Number(t.estimatedMinutes) || 15),
      0
    );

    return {
      id: batch.id,
      title: batch.title,
      badge: batch.badge,
      trackKey: batch.trackKey,
      examTrack: batch.examTrack,
      weeklyHours: batch.weeklyHours,
      targetExam: batch.targetExam,
      syllabusSummary: batch.syllabusSummary,
      recommendedModelTestId: batch.recommendedModelTestId,
      mcqPoolCount: trackCountMap[batch.examTrack] || 0,
      totalLessons: orderedTopics.length,
      totalEstimatedMinutes,
      matchingArchives: batch.featuredSeries.filter((s) => pastSeriesSet.has(s)),
      lessons: orderedTopics.map((t, index) => ({
        step: index + 1,
        slug: t.slug,
        title: t.title,
        subject: t.subject,
        unit: t.unit,
        estimatedMinutes: t.estimatedMinutes || 15,
        chaptersCount:
          t.chapterCount || (Array.isArray(t.chapters) ? t.chapters.length : 0),
      })),
    };
  });
}

// List views only need card fields. The heavy sections are fetched per topic
// from /study/topics/:slug - "chapters" alone is ~62% of the collection, so
// shipping it 30x made /study/overview a 365 KB response.
// Cards still show a chapter-count badge, so the count is computed server
// side and the array itself dropped - a few bytes instead of ~108 KB.
const TOPIC_LIST_PIPELINE = [
  { $addFields: { chapterCount: { $size: { $ifNull: ["$chapters", []] } } } },
  { $project: { chapters: 0, memoryTricks: 0, quickExamples: 0, keyFacts: 0 } },
  { $sort: { order: 1, createdAt: 1 } },
];

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
      StudyTopic.aggregate(TOPIC_LIST_PIPELINE),
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
    const studyBatches = buildStudyBatches(topics, trackCountMap, pastPapers);

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
        studyBatches,
        stats: {
          affairsCount,
          booksCount: books.length,
          topicsCount: topics.length,
          pastPapersCount: pastPapers.length,
          mcqCount,
          affairsFeedCount: affairsSources.filter((s) => s.enabled).length,
          batchesCount: studyBatches.length,
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
        // Slugs carry the romanised name (bangla-sandhi-uposorgo-protyoy),
        // which is what users type when the title itself is in Bangla.
        { slug: rx },
        { unit: rx },
        { highYieldSummary: rx },
        { keyFacts: rx },
        // Searched because real content lives here: "Article 137-141" is a
        // quickExamples label on the Constitution sheet, and it is exactly
        // what the search box offers as an example.
        { memoryTricks: rx },
        { "quickExamples.label": rx },
        { "quickExamples.detail": rx },
        { "chapters.heading": rx },
        { "chapters.explanation": rx },
        { "chapters.points": rx },
        { "chapters.workedExamples": rx },
        { "chapters.commonMistakes": rx },
        { "chapters.formulaBox.label": rx },
        { "chapters.formulaBox.formula": rx },
        { "chapters.practiceProblems.question": rx },
      ];
    }

    const [items, subjects] = await Promise.all([
      StudyTopic.aggregate([{ $match: filter }, ...TOPIC_LIST_PIPELINE]),
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

    const subjectFilter =
      topic.mcqSubjectFilter && topic.mcqSubjectFilter !== "All"
        ? topic.mcqSubjectFilter
        : topic.subject;

    const relatedQuestions = await McqQuestion.find(
      subjectFilter && subjectFilter !== "All" ? { subject: subjectFilter } : {}
    )
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
