import { StudyTopic } from "../models/StudyTopic.js";
import { generateJsonWithGemini } from "./aiCircularService.js";
import { recordAiUsage } from "./aiUsageService.js";

const VALID_SUBJECTS = [
  "Bangla",
  "English",
  "Bangladesh Affairs",
  "International Affairs",
  "Math & Mental Ability",
  "General Science & ICT",
  "Ethics & Governance",
  "Geography & Environment",
  "Govt Job Rules & Banking",
  "All",
];

const VALID_TRACKS = [
  "BCS Preliminary",
  "Bank Combined",
  "Primary & NTRCA",
  "Grade 11-20",
  "Govt Rules 2026",
];

const BANGLA_DIGIT_MAP = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

function cleanText(value, maxLen = 1800) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function cleanScalarText(value, maxLen = 3500) {
  if (typeof value === "string") return value.trim().slice(0, maxLen);
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value).slice(0, maxLen);
  }
  if (typeof value === "boolean") return String(value).slice(0, maxLen);
  return "";
}

function normalizeStringList(items, maxItems = 6, maxLen = 280) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => cleanText(String(item || ""), maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeScalarList(items, maxItems = 8, maxLen = 360) {
  if (!Array.isArray(items)) return [];
  const output = [];
  for (const item of items) {
    if (output.length >= maxItems) break;
    const text = cleanScalarText(item, maxLen);
    if (text) output.push(text);
  }
  return output;
}

function normalizeExamples(items, maxItems = 5, maxDetailLen = 900) {
  if (!Array.isArray(items)) return [];
  const output = [];
  for (const entry of items) {
    if (output.length >= maxItems) break;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const label = cleanScalarText(entry.label, 160);
    const detail = cleanScalarText(entry.detail, maxDetailLen);
    if (label && detail) {
      output.push({ label, detail });
    }
  }
  return output;
}

function parseStepNumber(rawStep, fallbackStep) {
  if (typeof rawStep === "number" && Number.isInteger(rawStep)) {
    return rawStep >= 1 && rawStep <= 6 ? rawStep : fallbackStep;
  }
  if (typeof rawStep === "string") {
    const normalized = rawStep
      .trim()
      .replace(/[০-৯]/g, (digit) => BANGLA_DIGIT_MAP[digit] ?? digit);
    const parsed = Number(normalized);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 6) {
      return parsed;
    }
  }
  return fallbackStep;
}

function normalizeRuleSteps(items, maxItems = 6) {
  if (!Array.isArray(items)) return [];
  const output = [];
  const usedSteps = new Set();

  for (const entry of items) {
    if (output.length >= maxItems) break;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;

    const ruleTitle = cleanScalarText(entry.ruleTitle, 180);
    const formula = cleanScalarText(entry.formula, 220);
    const exampleHeader = cleanScalarText(entry.exampleHeader, 220);
    const breakdownLines = normalizeScalarList(entry.breakdownLines, 6, 280);
    const moreExamples = normalizeScalarList(entry.moreExamples, 5, 160);

    const resolvedTitle = ruleTitle || exampleHeader || formula;
    const hasContent =
      breakdownLines.length > 0 ||
      Boolean(formula) ||
      Boolean(exampleHeader) ||
      moreExamples.length > 0;

    if (!resolvedTitle || !hasContent) continue;

    let stepNumber = parseStepNumber(entry.stepNumber, output.length + 1);
    if (usedSteps.has(stepNumber)) {
      const nextSequential = output.length + 1;
      stepNumber = !usedSteps.has(nextSequential)
        ? nextSequential
        : [1, 2, 3, 4, 5, 6].find((n) => !usedSteps.has(n)) ?? nextSequential;
    }
    usedSteps.add(stepNumber);

    output.push({
      stepNumber,
      ruleTitle: resolvedTitle,
      formula,
      exampleHeader,
      breakdownLines,
      moreExamples,
    });
  }

  return output;
}

function normalizeSummaryTable(rawTable) {
  if (!rawTable || typeof rawTable !== "object" || Array.isArray(rawTable)) {
    return null;
  }

  const headers = normalizeScalarList(rawTable.headers, 5, 80);
  if (headers.length === 0 || !Array.isArray(rawTable.rows)) {
    return null;
  }

  const rows = [];
  for (const rawRow of rawTable.rows) {
    if (rows.length >= 8) break;
    if (!Array.isArray(rawRow)) continue;

    const cells = headers.map((_, colIdx) => cleanScalarText(rawRow[colIdx], 200));
    if (cells.every((cell) => !cell)) continue;
    rows.push(cells);
  }

  if (rows.length === 0) {
    return null;
  }

  return {
    title: cleanScalarText(rawTable.title, 160) || "সংক্ষেপে মনে রাখার চার্ট",
    headers,
    rows,
  };
}

async function loadGroundedTopic(topicSlug) {
  if (!topicSlug) return null;
  const slug = cleanText(topicSlug, 120);
  if (!slug) return null;
  return StudyTopic.findOne({ slug })
    .select(
      "title slug subject unit targetTracks highYieldSummary keyFacts chapters.heading"
    )
    .lean();
}

function formatTopicContext(topic) {
  if (!topic) return "No specific lecture sheet attached; use general Bangladesh govt job syllabus knowledge.";
  const chapterHeadings = (topic.chapters || [])
    .map((c) => c.heading)
    .filter(Boolean)
    .slice(0, 6);
  const facts = (topic.keyFacts || []).slice(0, 5);
  return [
    `Topic Title: ${topic.title}`,
    `Subject: ${topic.subject} | Unit: ${topic.unit}`,
    `Target Tracks: ${(topic.targetTracks || []).join(", ")}`,
    `Summary: ${cleanText(topic.highYieldSummary, 600)}`,
    chapterHeadings.length ? `Chapters: ${chapterHeadings.join(" | ")}` : "",
    facts.length ? `Key Facts: ${facts.join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildTutorPrompt({ topic, subject, question }) {
  const effectiveSubject = topic?.subject || subject || "All";
  const effectiveQuestion =
    question ||
    `Give a complete step-by-step high-yield breakdown with decomposed rule steps, common exam traps in BD govt exams, worked examples, a quick-revision chart, and a memory mnemonic for "${topic?.title || effectiveSubject}".`;

  const schemaExample = {
    topicTitle: "Short clear title of the concept explained",
    subject: effectiveSubject,
    explanationEn:
      "Clear exam-focused explanation in English with exact grammar/technical definitions, formulas, and common BD exam trap alerts",
    explanationBn:
      "সহজ, স্বাভাবিক ও পরীক্ষার উপযোগী বাংলায় বিস্তারিত মূল ব্যাখ্যা (নিয়ম কীভাবে কাজ করে, শর্ত এবং পরীক্ষার ফাঁদসহ)",
    keyPoints: [
      "4 to 8 high-yield bullet points for BCS, Combined Bank, Primary, NTRCA & Grade 11-20 exams",
    ],
    ruleSteps: [
      {
        stepNumber: 1,
        ruleTitle: "১. এ + স্বরবর্ণ = অয় (এ → অয়)",
        formula: "এ-কার (ে) + ভিন্ন স্বরবর্ণ = অয়্ + স্বরবর্ণ",
        exampleHeader: "নে + অন = নয়ন",
        breakdownLines: [
          "পূর্বপদ বিশ্লেষণ: ন্ + এ",
          "পরপদ বিশ্লেষণ: অ + ন",
          "ধ্বনি পরিবর্তন: এ → অয়",
          "মধ্যবর্তী সংযোগ: ন্ + (অয়) + অন",
          "চূড়ান্ত মিলন: (ন্+অ)=ন + (য়্+অ)=য় + ন ⇒ নয়ন",
        ],
        moreExamples: ["শে + অন = শয়ন", "চে + অন = চয়ন"],
      },
    ],
    summaryTable: {
      title: "সংক্ষেপে মনে রাখার চার্ট",
      headers: ["ধরন / ধাপ", "মূল সূত্র / নিয়ম", "উদাহরণ ও পরীক্ষা টিপস"],
      rows: [
        ["এ + স্বর", "এ → অয়", "নে + অন = নয়ন, শে + অন = শয়ন"],
        ["ঐ + স্বর", "ঐ → আয়", "নৈ + অক = নায়ক, গৈ + অক = গায়ক"],
      ],
    },
    workedExamples: [
      {
        label: "Example 1 / Past Exam Trap",
        detail:
          "Detailed multi-line step-by-step worked solution showing each intermediate step, final answer, and why common distractors fail",
      },
    ],
    memoryTip: "One memorable Bangla/English mnemonic, rhyme, or 5-second exam shortcut",
    followUpQuestions: ["2 to 3 smart follow-up questions the student can ask next"],
  };

  return [
    "You are SorkariPath's senior Bangladesh Government Job Exam Mentor (BCS, Combined Bank SO/Officer, Primary Assistant Teacher, NTRCA, and Ministry Grade 11-20).",
    "Teach step-by-step with textbook precision so candidates understand every intermediate transformation, not just the final answer.",
    "",
    "LANGUAGE & CLARITY RULES:",
    "- Write natural, authoritative, exam-ready Bangla in `explanationBn`, `ruleSteps`, `summaryTable`, `workedExamples`, and `memoryTip` (keep English grammar sentences/terms crisp in English alongside Bangla guidance).",
    "- Write crisp English technical/grammar clarity in `explanationEn` (precise rules, formulas, constitutional articles, or exam terminology).",
    "",
    "STEP-BY-STEP BREAKDOWN RULES (`ruleSteps` - 1 to 4 focused steps):",
    "- Show explicit line-by-line `breakdownLines` tailored to the subject (concise, never skip intermediate steps):",
    "  * Bangla (সন্ধি, সমাস, প্রত্যয়, কারক, উপসর্গ, ধাতু, বানান): break letter-by-letter/phoneme-by-phoneme (`ন্ + এ`, `অ + ন`, `এ → অয়`, `ন্ + (অয়) + অন = নয়ন`) or clause-by-clause (`ব্যাসবাক্য`, পূর্বপদ/পরপদ, পদলোপ, অর্থের প্রাধান্য, প্রত্যয়/বিভক্তি).",
    "  * English (Tense, Clause, Conditionals, Voice, Narration, Right Form of Verbs, Correction): show clause split, trigger word/marker, exact grammar formula rule, and word-by-word transformation step-by-step.",
    "  * Math & Mental Ability / General Science & ICT: explicitly show (1) Given values (প্রদত্ত মান), (2) Formula chosen (নির্বাচিত সূত্র), (3) Line-by-line substitution & algebraic/binary/logic simplification, and (4) Final unit/answer + shortcut verification.",
    "  * Bangladesh Affairs, International Affairs, Ethics & Governance, Geography & Govt Rules: break down by constitutional article / statutory section / historical trigger -> mechanism / calculation / timeline -> exceptions & BPSC/Bank MCQ traps.",
    "",
    "QUICK-REVISION CHART (`summaryTable`):",
    "- ALWAYS populate `summaryTable` as a quick-revision chart (`সংক্ষেপে মনে রাখার চার্ট`, up to 5 columns and up to 8 rows).",
    "- Every row inside `rows` MUST have the exact same cell count as `headers`.",
    "",
    "IMPORTANT: The sample values inside the JSON schema below only show the expected structure and granularity. Replace every field completely with accurate content answering the Student Request and Selected Subject below.",
    "",
    "--- ATTACHED LECTURE CONTEXT ---",
    formatTopicContext(topic),
    "",
    `Selected Subject: ${effectiveSubject}`,
    `Student Request: ${effectiveQuestion}`,
    "",
    "Return ONLY valid JSON matching this exact schema (no markdown fences):",
    JSON.stringify(schemaExample),
  ].join("\n");
}

function buildMcqGeneratorPrompt({
  topic,
  subject,
  topicTitle,
  examTrack,
  difficulty,
  count,
}) {
  const resolvedSubject = VALID_SUBJECTS.includes(topic?.subject)
    ? topic.subject
    : VALID_SUBJECTS.includes(subject)
      ? subject
      : "Bangladesh Affairs";
  const resolvedTrack = VALID_TRACKS.includes(examTrack)
    ? examTrack
    : "BCS Preliminary";
  const resolvedDifficulty = ["Easy", "Medium", "Hard"].includes(difficulty)
    ? difficulty
    : "Medium";

  return [
    "You are an expert Bangladesh PSC, Bangladesh Bank Bankers' Selection Committee (BSc), DPE Primary, and NTRCA question setter.",
    `Create exactly ${count} original, non-trivial, factually verified 4-option multiple-choice questions.`,
    "Every question must test real exam traps used in BD government recruitment tests and have ONE unambiguously correct option. Keep stems crisp and each explanation concise (1-2 short sentences, <= 160 chars) for fast response.",
    resolvedSubject === "English"
      ? "Write questions and options in formal English; explanation can be clear English (with brief Bangla nuance if helpful)."
      : "Use authentic exam-grade Bangla (or standard English where technical/math terminology warrants) matching BPSC and Bank recruitment papers.",
    "",
    "--- CONTEXT ---",
    formatTopicContext(topic),
    `Subject: ${resolvedSubject}`,
    topicTitle ? `Focus Topic: ${cleanText(topicTitle, 160)}` : "",
    `Target Exam Track: ${resolvedTrack}`,
    `Difficulty: ${resolvedDifficulty}`,
    "",
    "Return ONLY valid JSON matching this schema (no markdown fences):",
    JSON.stringify({
      topicTitle: topic?.title || cleanText(topicTitle, 140) || resolvedSubject,
      questions: [
        {
          question: "Question stem ending with ? or :",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctIndex: 0,
          explanation: "Why the correct option is right and why the main distractor is wrong.",
          difficulty: resolvedDifficulty,
          tags: ["topic-tag"],
        },
      ],
    }),
  ]
    .filter(Boolean)
    .join("\n");
}

function sanitizeGeneratedMcqs(rawQuestions, { subject, examTrack, defaultDifficulty }) {
  if (!Array.isArray(rawQuestions)) return [];
  const seen = new Set();
  const output = [];

  for (const raw of rawQuestions) {
    const question = cleanText(raw?.question, 500);
    const options = Array.isArray(raw?.options)
      ? raw.options.map((opt) => cleanText(String(opt || ""), 220)).filter(Boolean)
      : [];
    const correctIndex = Number(raw?.correctIndex);
    const explanation = cleanText(raw?.explanation, 700);

    if (
      !question ||
      seen.has(question) ||
      options.length !== 4 ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex > 3 ||
      !explanation
    ) {
      continue;
    }

    seen.add(question);
    output.push({
      _id: `ai-${Date.now()}-${output.length + 1}`,
      question,
      options,
      correctIndex,
      explanation,
      subject,
      examTrack,
      difficulty: ["Easy", "Medium", "Hard"].includes(raw?.difficulty)
        ? raw.difficulty
        : defaultDifficulty,
      sourceYear: "Gemini AI Fresh Practice",
      examSeries: "AI Adaptive Drill",
      tags: normalizeStringList(raw?.tags, 4, 40),
    });
  }

  return output;
}

/**
 * Answers a candidate's study doubt or summarizes a Topic Guru lecture sheet
 * with bilingual English + Bangla notes, step-by-step rule breakdowns,
 * quick-revision chart, worked examples, and shortcuts.
 */
export async function explainStudyTopicWithAi({
  topicSlug = "",
  subject = "All",
  question = "",
  actorUser = null,
} = {}) {
  const cleanQuestion = cleanText(question, 600);
  const topic = await loadGroundedTopic(topicSlug);

  if (!topic && !cleanQuestion) {
    const err = new Error("Provide a study question or choose a Topic Guru sheet.");
    err.statusCode = 400;
    throw err;
  }

  const prompt = buildTutorPrompt({
    topic,
    subject: VALID_SUBJECTS.includes(subject) ? subject : "All",
    question: cleanQuestion,
  });

  const { data, modelUsed, keySlotUsed, totalKeys, usage } =
    await generateJsonWithGemini({
      contents: prompt,
      timeoutMs: 15_000,
    });

  const resolvedTitle =
    cleanScalarText(data?.topicTitle, 180) || topic?.title || "Study Tutor Note";

  await recordAiUsage({
    actorUser,
    feature: "study_tutor",
    modelUsed,
    keySlotUsed,
    usage,
    isCacheHit: false,
    label: cleanQuestion || resolvedTitle,
  });

  return {
    topicTitle: resolvedTitle,
    subject: cleanScalarText(data?.subject, 80) || topic?.subject || subject || "All",
    explanationEn: cleanScalarText(data?.explanationEn, 3500),
    explanationBn: cleanScalarText(data?.explanationBn, 3500),
    keyPoints: normalizeScalarList(data?.keyPoints, 8, 360),
    ruleSteps: normalizeRuleSteps(data?.ruleSteps, 6),
    summaryTable: normalizeSummaryTable(data?.summaryTable),
    workedExamples: normalizeExamples(data?.workedExamples, 5, 900),
    memoryTip: cleanScalarText(data?.memoryTip, 600),
    followUpQuestions: normalizeScalarList(data?.followUpQuestions, 4, 220),
    meta: {
      modelUsed,
      keySlotUsed,
      totalKeys,
      usage,
      groundedTopicSlug: topic?.slug || null,
    },
  };
}

/**
 * Generates fresh Bangladesh govt job MCQ drills using Gemini, optionally
 * grounded in an open Topic Guru lecture sheet.
 */
export async function generatePracticeMcqsWithAi({
  topicSlug = "",
  subject = "Bangladesh Affairs",
  topicTitle = "",
  examTrack = "BCS Preliminary",
  difficulty = "Medium",
  count = 5,
  actorUser = null,
}) {
  const topic = await loadGroundedTopic(topicSlug);
  const resolvedSubject =
    topic?.subject && topic.subject !== "All"
      ? topic.subject
      : VALID_SUBJECTS.includes(subject) && subject !== "All"
        ? subject
        : "Bangladesh Affairs";
  const resolvedTrack = VALID_TRACKS.includes(examTrack)
    ? examTrack
    : "BCS Preliminary";
  const resolvedDifficulty = ["Easy", "Medium", "Hard"].includes(difficulty)
    ? difficulty
    : "Medium";
  const safeCount = Math.min(10, Math.max(3, Number(count) || 5));

  const prompt = buildMcqGeneratorPrompt({
    topic,
    subject: resolvedSubject,
    topicTitle,
    examTrack: resolvedTrack,
    difficulty: resolvedDifficulty,
    count: safeCount,
  });

  const { data, modelUsed, keySlotUsed, totalKeys, usage } =
    await generateJsonWithGemini({
      contents: prompt,
      timeoutMs: 15_000,
    });

  const questions = sanitizeGeneratedMcqs(data?.questions, {
    subject: resolvedSubject,
    examTrack: resolvedTrack,
    defaultDifficulty: resolvedDifficulty,
  });

  if (questions.length < 2) {
    const err = new Error(
      "Gemini AI could not produce valid practice MCQs for this prompt. Please try again."
    );
    err.statusCode = 502;
    throw err;
  }

  const resolvedTopicTitle =
    cleanText(data?.topicTitle, 160) ||
    topic?.title ||
    cleanText(topicTitle, 160) ||
    resolvedSubject;

  await recordAiUsage({
    actorUser,
    feature: "generate_mcqs",
    modelUsed,
    keySlotUsed,
    usage,
    isCacheHit: false,
    label: `${resolvedTopicTitle} (${questions.length} MCQs)`,
  });

  return {
    topicTitle: resolvedTopicTitle,
    subject: resolvedSubject,
    examTrack: resolvedTrack,
    questions,
    meta: {
      modelUsed,
      keySlotUsed,
      totalKeys,
      usage,
      requestedCount: safeCount,
      generatedCount: questions.length,
      groundedTopicSlug: topic?.slug || null,
    },
  };
}
