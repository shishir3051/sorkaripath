import { StudyTopic } from "../models/StudyTopic.js";
import { generateJsonWithGemini } from "./aiCircularService.js";

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

function cleanText(value, maxLen = 1800) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function normalizeStringList(items, maxItems = 6, maxLen = 280) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => cleanText(String(item || ""), maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeExamples(items, maxItems = 3) {
  if (!Array.isArray(items)) return [];
  return items
    .map((entry) => ({
      label: cleanText(entry?.label || "", 120),
      detail: cleanText(entry?.detail || "", 400),
    }))
    .filter((entry) => entry.label && entry.detail)
    .slice(0, maxItems);
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
    `Give a crisp high-yield revision summary, common exam traps in BD govt exams, worked examples, and a quick memory mnemonic for "${topic?.title || effectiveSubject}".`;

  return [
    "You are SorkariPath's senior Bangladesh Government Job Exam Mentor (BCS, Combined Bank SO/Officer, Primary Assistant Teacher, NTRCA, and Ministry Grade 11-20).",
    "Answer accurately, concisely, and practically for exam candidates in Bangladesh.",
    "For Bangla Language/Literature, BD Constitution, Govt Rules, or Bangla-medium exams, write rich natural Bangla inside `explanationBn` and clear English exam notes inside `explanationEn`.",
    "",
    "--- ATTACHED LECTURE CONTEXT ---",
    formatTopicContext(topic),
    "",
    `Selected Subject: ${effectiveSubject}`,
    `Student Request: ${effectiveQuestion}`,
    "",
    "Return ONLY valid JSON matching this exact schema (no markdown fences):",
    JSON.stringify({
      topicTitle: "Short title of the concept explained",
      subject: "Subject name",
      explanationEn: "Clear 2-4 sentence exam-focused explanation in English with any formula or rule trap",
      explanationBn: "সহজ ও স্পষ্ট বাংলায় ২-৪ বাক্যের মূল ব্যাখ্যা ও পরীক্ষার শর্টকাট কৌশল",
      keyPoints: ["4 to 6 high-yield bullet points for BCS/Bank/Primary MCQ & Written"],
      workedExamples: [
        { label: "Example 1 / Past Trap", detail: "Short worked step-by-step example" },
      ],
      memoryTip: "One memorable shortcut, mnemonic, or rule of thumb",
      followUpQuestions: ["2 smart follow-up questions the student can ask next"],
    }),
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
 * with bilingual English + Bangla notes, worked examples, and shortcuts.
 */
export async function explainStudyTopicWithAi({
  topicSlug = "",
  subject = "All",
  question = "",
}) {
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

  const { data, modelUsed, keySlotUsed, totalKeys } = await generateJsonWithGemini({
    contents: prompt,
    timeoutMs: 22_000,
  });

  return {
    topicTitle: cleanText(data?.topicTitle, 180) || topic?.title || "Study Tutor Note",
    subject: cleanText(data?.subject, 80) || topic?.subject || subject || "All",
    explanationEn: cleanText(data?.explanationEn, 2400),
    explanationBn: cleanText(data?.explanationBn, 2400),
    keyPoints: normalizeStringList(data?.keyPoints, 7, 320),
    workedExamples: normalizeExamples(data?.workedExamples, 4),
    memoryTip: cleanText(data?.memoryTip, 400),
    followUpQuestions: normalizeStringList(data?.followUpQuestions, 3, 180),
    meta: {
      modelUsed,
      keySlotUsed,
      totalKeys,
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

  const { data, modelUsed, keySlotUsed, totalKeys } = await generateJsonWithGemini({
    contents: prompt,
    timeoutMs: 28_000,
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

  return {
    topicTitle:
      cleanText(data?.topicTitle, 160) ||
      topic?.title ||
      cleanText(topicTitle, 160) ||
      resolvedSubject,
    subject: resolvedSubject,
    examTrack: resolvedTrack,
    questions,
    meta: {
      modelUsed,
      keySlotUsed,
      totalKeys,
      requestedCount: safeCount,
      generatedCount: questions.length,
      groundedTopicSlug: topic?.slug || null,
    },
  };
}
