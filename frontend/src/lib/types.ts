export type JobOrigin = "curated" | "web_sync";
export type UserRole = "user" | "admin";

export interface AiTokenStats {
  totalRequests: number;
  apiCalls: number;
  cacheHits: number;
  promptTokens: number;
  outputTokens: number;
  thoughtsTokens: number;
  totalTokens: number;
  lastUsedAt?: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  passwordSetupPending?: boolean;
  targetTrack?: string;
  bio?: string;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  isPrimaryAdmin?: boolean;
  aiStats?: AiTokenStats;
}
export type RecordType =
  | "circular"
  | "notice"
  | "result"
  | "admit_card"
  | "exam_schedule";

export interface AiCircularExtraction {
  extractedAt?: string | null;
  modelUsed?: string;
  summaryEn?: string;
  summaryBn?: string;
  totalVacancies?: string;
  positions?: string[];
  educationSummary?: string;
  ageRequirement?: string;
  applicationFee?: string;
  applyStartDate?: string;
  applyDeadline?: string;
  applyWebsite?: string;
  keyInstructions?: string[];
}

export interface JobCircular {
  _id: string;
  title: string;
  titleBn?: string;
  slug: string;
  recordType: RecordType;
  origin: JobOrigin;
  category: string;
  organization: string;
  organizationShort: string;
  gradeRange: string;
  payScale2026: string;
  vacancies: string;
  ageLimit: string;
  educationRequired: string;
  applicationFee: string;
  publishedDate: string;
  publishedDateRaw?: string;
  deadlineDate?: string | null;
  deadlineRaw?: string;
  applyUrl?: string;
  pdfUrl?: string;
  detailUrl?: string;
  sourceId?: string;
  sourceName?: string;
  summary: string;
  highlights: string[];
  applicationSteps: string[];
  relatedLessonSlugs: string[];
  tags: string[];
  aiExtraction?: AiCircularExtraction;
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningSection {
  heading: string;
  body: string;
  bullets: string[];
  tip?: string;
}

export interface OfficialLink {
  label: string;
  url: string;
}

export interface LearningModule {
  _id: string;
  letter: string;
  order: number;
  stage: string;
  slug: string;
  title: string;
  titleBn?: string;
  subtitle?: string;
  estimatedMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  summary: string;
  sections?: LearningSection[];
  checklist: string[];
  officialLinks?: OfficialLink[];
  quizTags: string[];
  updatedForYear: number;
}

export interface McqQuestion {
  _id: string;
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
  subject: string;
  examTrack: string;
  examSeries?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  sourceYear?: string;
  tags: string[];
}

export interface QuizAttempt {
  _id: string;
  sessionId: string;
  examTrack: string;
  subject: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  negativeMarkingEnabled: boolean;
  netScore: number;
  maxScore: number;
  accuracyPercent: number;
  durationSeconds: number;
  createdAt: string;
}

export interface WebSource {
  _id: string;
  key: string;
  name: string;
  organization: string;
  organizationShort: string;
  url: string;
  adapterType: "npf-table" | "bb-erecruitment" | "rss-feed" | "teletalk-api";
  targetType?: "job" | "current_affairs";
  defaultCategory: string;
  enabled: boolean;
  lastSyncAt?: string | null;
  lastStatus: "idle" | "success" | "error";
  lastMessage: string;
  lastItemsFetched: number;
  lastNewItems: number;
  totalItemsSynced: number;
}

export interface SyncLog {
  _id: string;
  triggeredBy: "cron" | "manual" | "seed" | "auto";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  sourcesChecked: number;
  totalFetched: number;
  newInserted: number;
  updatedCount: number;
  status: "success" | "partial" | "failed";
  errors: Array<{ sourceKey: string; sourceName: string; message: string }>;
}

export interface SyncMeta {
  lastSyncAt?: string | null;
  isStale?: boolean;
  syncRunning?: boolean;
  staleMinutes?: number;
}

export interface OverviewData {
  stats: {
    totalCirculars: number;
    liveSyncedCount: number;
    curatedCount: number;
    lessonCount: number;
    mcqCount: number;
    enabledSources: number;
  };
  lastSyncLog: SyncLog | null;
  syncMeta?: SyncMeta;
  featuredCirculars: JobCircular[];
  latestLiveNotices: JobCircular[];
  latestRecruitmentCirculars?: JobCircular[];
  upcomingDeadlines: JobCircular[];
  highlights2026: {
    ageLimit: string;
    bcsAttempts: string;
    quotaBreakdown: Array<{ label: string; percent: number }>;
    payScaleSummary: string;
  };
}

export type HighlightColor = "yellow" | "green" | "pink" | "blue";
export type HighlightStyle = "highlight" | "underline" | "wavy" | "box";
export type InkColor = HighlightColor | "dark";

export interface HighlightAiExplanation {
  topicTitle: string;
  explanationBn?: string;
  explanationEn?: string;
  keyPoints?: string[];
  ruleSteps?: Array<{
    stepNumber: number;
    ruleTitle: string;
    formula?: string;
    exampleHeader?: string;
    breakdownLines?: string[];
    moreExamples?: string[];
  }>;
  summaryTable?: {
    title?: string;
    headers: string[];
    rows: string[][];
  } | null;
  workedExamples?: Array<{ label: string; detail: string }>;
  memoryTip?: string;
  answeredAt: string;
  modelUsed?: string;
}

export interface StudyHighlight {
  id: string;
  scopeKey: string;
  scopeTitle?: string;
  blockId: string;
  sectionLabel?: string;
  text: string;
  start: number;
  end: number;
  color: HighlightColor;
  style?: HighlightStyle;
  note?: string;
  aiExplanation?: HighlightAiExplanation | null;
  createdAt: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface SheetDrawingStroke {
  id: string;
  scopeKey: string;
  viewKey: string;
  color: InkColor;
  width: number;
  points: DrawingPoint[];
  createdAt: string;
}

export interface SheetStickyNote {
  id: string;
  scopeKey: string;
  viewKey: string;
  x: number;
  y: number;
  text: string;
  color: InkColor;
  createdAt: string;
}

export interface LearnerProgress {
  sessionId: string;
  completedLessonSlugs: string[];
  completedTopicSlugs?: string[];
  completedRoutineDays?: number[];
  routineTrack?: string;
  wrongQuestionIds?: string[];
  bookmarkedQuestionIds?: string[];
  bookmarkedJobSlugs: string[];
  studyHighlights?: StudyHighlight[];
  studyDrawings?: SheetDrawingStroke[];
  studyNotes?: SheetStickyNote[];
  targetTrack: string;
}

export interface CurrentAffairsItem {
  _id: string;
  title: string;
  sourceHash: string;
  topic:
    | "Bangladesh Affairs"
    | "Economy & Banking"
    | "International Affairs"
    | "Science & ICT"
    | "Governance & Policy"
    | "Bangla Digest";
  language: "en" | "bn";
  sourceKey: string;
  sourceName: string;
  url: string;
  summary: string;
  publishedDate: string;
  examRelevanceNote: string;
}

export interface StudyResource {
  _id: string;
  title: string;
  slug: string;
  examTrack:
    | "All Tracks"
    | "BCS"
    | "Bank & Financial"
    | "Primary & NTRCA"
    | "Grade 11-20";
  subject: string;
  resourceType:
    | "NCTB Core Book"
    | "Recommended Guidebook"
    | "Question Bank & Digest"
    | "Official Reference";
  priority: "Must-Read Core" | "High-Yield Practice" | "Reference";
  authorOrPublisher: string;
  whyStudy: string;
  keyTopics: string[];
  officialUrl?: string;
  order: number;
}

export interface ModelTestPreset {
  id: string;
  title: string;
  subtitle: string;
  examTrack: string;
  subject: string;
  availableQuestions: number;
  questionLimit: number;
  officialPattern: string;
  durationMinutes: number;
  negativeMarking: string;
  badge: string;
}

export interface StudyFormulaItem {
  label: string;
  formula: string;
  note?: string;
}

export interface StudyComparisonTable {
  title?: string;
  headers: string[];
  rows: string[][];
}

export interface StudyPracticeProblem {
  question: string;
  hint?: string;
  solution: string;
  answer: string;
}

export interface StudyChapter {
  heading: string;
  explanation: string;
  formulaBox?: StudyFormulaItem[];
  comparisonTable?: StudyComparisonTable;
  points: string[];
  workedExamples: string[];
  commonMistakes?: string[];
  practiceProblems?: StudyPracticeProblem[];
}

export interface StudyTopic {
  _id: string;
  title: string;
  slug: string;
  subject: string;
  unit: string;
  targetTracks: string[];
  estimatedMinutes: number;
  highYieldSummary: string;
  /** Omitted by the list endpoints; arrives with the per-topic sheet. */
  keyFacts?: string[];
  // Omitted by the list endpoints; present once the per-topic sheet loads.
  memoryTricks?: string[];
  quickExamples?: Array<{ label: string; detail: string }>;
  chapters?: StudyChapter[];
  /** Supplied by the list endpoints in place of the full chapters array. */
  chapterCount?: number;
  mcqSubjectFilter: string;
  order: number;
}

export interface PastPaperSummary {
  examSeries: string;
  count: number;
  examTrack: string;
}

export interface RoutineDayItem {
  day: number;
  phase: string;
  title: string;
  focusSummary: string;
  topicSlug?: string;
  examSeries?: string;
  practiceSubject: string;
  examTrack: string;
  actionType: "topic" | "archive" | "mistakes" | "search" | "mock";
}

export interface StudyRoutineData {
  track: string;
  totalDays: number;
  days: RoutineDayItem[];
}

export interface StudyBatchLesson {
  step: number;
  slug: string;
  title: string;
  subject: string;
  unit: string;
  estimatedMinutes: number;
  chaptersCount: number;
}

export interface StudyBatch {
  id: string;
  title: string;
  badge: string;
  trackKey: string;
  examTrack: string;
  weeklyHours: string;
  targetExam: string;
  syllabusSummary: string;
  recommendedModelTestId: string;
  mcqPoolCount: number;
  totalLessons: number;
  totalEstimatedMinutes: number;
  matchingArchives: string[];
  lessons: StudyBatchLesson[];
}

export interface StudyOverviewData {
  currentAffairs: CurrentAffairsItem[];
  affairsTopics: Array<{ topic: string; count: number }>;
  affairsSources: WebSource[];
  books: StudyResource[];
  topics: StudyTopic[];
  pastPapers: PastPaperSummary[];
  routine: StudyRoutineData;
  modelTests: ModelTestPreset[];
  studyBatches?: StudyBatch[];
  stats: {
    affairsCount: number;
    booksCount: number;
    topicsCount: number;
    pastPapersCount: number;
    mcqCount: number;
    affairsFeedCount: number;
    batchesCount?: number;
  };
}
