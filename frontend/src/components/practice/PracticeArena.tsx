"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Award,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FileCheck2,
  Layers,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  X,
  XCircle,
} from "lucide-react";
import { apiFetch, formatBdDateTime, getOrCreateSessionId } from "@/lib/api";
import type {
  LearnerProgress,
  McqQuestion,
  PastPaperSummary,
  QuizAttempt,
  StudyTopic,
} from "@/lib/types";

interface QuestionsResponse {
  items: McqQuestion[];
  totalAvailable: number;
  subjects: string[];
  examTracks: string[];
  examSeriesList?: string[];
}

interface ReviewItem {
  questionId: string;
  question: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
  explanation: string;
  subject: string;
  isCorrect: boolean;
  status: "correct" | "wrong" | "unanswered";
}

interface SubjectBreakdownItem {
  subject: string;
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  accuracyPercent: number;
  weak: boolean;
}

interface SubmitAnalytics {
  cutoffTargetPercent: number;
  netPercent: number;
  isSafeZone: boolean;
  penaltyLost: number;
  subjectBreakdown: SubjectBreakdownItem[];
}

interface SubmitResponse {
  attempt: QuizAttempt;
  review: ReviewItem[];
  analytics?: SubmitAnalytics;
}

interface ArchiveResponse {
  activeSeries: string;
  seriesList: PastPaperSummary[];
  items: McqQuestion[];
}

function computeClientAnalytics(
  review: ReviewItem[],
  netScore: number,
  maxScore: number,
  penaltyLost: number,
  examTrack: string
): SubmitAnalytics {
  const map = new Map<
    string,
    { total: number; correct: number; wrong: number; unanswered: number }
  >();
  for (const r of review) {
    const cur = map.get(r.subject) ?? {
      total: 0,
      correct: 0,
      wrong: 0,
      unanswered: 0,
    };
    cur.total += 1;
    if (r.status === "correct") cur.correct += 1;
    else if (r.status === "wrong") cur.wrong += 1;
    else cur.unanswered += 1;
    map.set(r.subject, cur);
  }
  const subjectBreakdown: SubjectBreakdownItem[] = Array.from(map.entries())
    .map(([sub, counts]) => {
      const accuracyPercent = counts.total
        ? Math.round((counts.correct / counts.total) * 100)
        : 0;
      return {
        subject: sub,
        ...counts,
        accuracyPercent,
        weak: accuracyPercent < 65,
      };
    })
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent);

  const trackLower = examTrack.toLowerCase();
  const cutoffTargetPercent = trackLower.includes("primary")
    ? 75
    : trackLower.includes("bank")
    ? 68
    : 65;
  const netPercent =
    maxScore > 0 ? Math.max(0, Math.round((netScore / maxScore) * 100)) : 0;

  return {
    cutoffTargetPercent,
    netPercent,
    isSafeZone: netPercent >= cutoffTargetPercent,
    penaltyLost: Math.round(penaltyLost * 100) / 100,
    subjectBreakdown,
  };
}

const ARCHIVE_TRACK_LABELS: Record<string, string> = {
  "BCS Preliminary": "BCS Preliminary & PSC Non-Cadre",
  "Bank Combined": "Bangladesh Bank & Combined Bank",
  "Primary & NTRCA": "DPE Primary & NTRCA",
  "Grade 11-20": "Post Office & Ministry Grade 11–20",
  "Govt Rules 2026": "2026 Govt Rules, Service Act & Viva",
};

const ARCHIVE_TRACK_ORDER = [
  "BCS Preliminary",
  "Bank Combined",
  "Primary & NTRCA",
  "Grade 11-20",
  "Govt Rules 2026",
];

function extractArchiveRank(name: string): number {
  const ord = name.match(/\b(\d{1,2})(?:st|nd|rd|th)\b/i);
  if (ord) return Number(ord[1]);
  const yr = name.match(/\b(20\d{2})\b/);
  if (yr) return Number(yr[1]);
  return -1;
}

function groupAndOrderArchiveSeries(list: PastPaperSummary[]) {
  const orderedSeries = [...list].sort((a, b) => {
    const tA = ARCHIVE_TRACK_ORDER.indexOf(a.examTrack);
    const tB = ARCHIVE_TRACK_ORDER.indexOf(b.examTrack);
    const normA = tA === -1 ? 99 : tA;
    const normB = tB === -1 ? 99 : tB;
    if (normA !== normB) return normA - normB;

    const rA = extractArchiveRank(a.examSeries);
    const rB = extractArchiveRank(b.examSeries);
    if (rA !== rB) return rB - rA;

    return a.examSeries.localeCompare(b.examSeries);
  });

  const groups: { track: string; label: string; items: PastPaperSummary[] }[] =
    [];
  for (const item of orderedSeries) {
    const track = item.examTrack || "Other";
    let group = groups.find((g) => g.track === track);
    if (!group) {
      group = {
        track,
        label: ARCHIVE_TRACK_LABELS[track] ?? track,
        items: [],
      };
      groups.push(group);
    }
    group.items.push(item);
  }
  return { orderedSeries, groups };
}

interface SmartSearchResponse {
  questions: McqQuestion[];
  topics: StudyTopic[];
}

interface MistakeVaultResponse {
  wrongQuestions: McqQuestion[];
  bookmarkedQuestions: McqQuestion[];
}

type ArenaMode = "mock" | "archive" | "search" | "mistakes";

function resolveMode(param: string | null): ArenaMode {
  if (
    param === "mock" ||
    param === "archive" ||
    param === "search" ||
    param === "mistakes"
  ) {
    return param;
  }
  return "mock";
}

export function PracticeArena() {
  const searchParams = useSearchParams();
  const initialMode = resolveMode(searchParams.get("mode"));
  const initialTrack = searchParams.get("examTrack") || "All";
  const initialSubject = searchParams.get("subject") || "All";
  const initialSeries = searchParams.get("examSeries") || "All";
  const initialLimit = searchParams.get("limit") || "15";
  const shouldAutostart = searchParams.get("autostart") === "1";

  const [mode, setMode] = useState<ArenaMode>(initialMode);
  const [subject, setSubject] = useState(initialSubject);
  const [examTrack, setExamTrack] = useState(initialTrack);
  const [examSeries, setExamSeries] = useState(initialSeries);
  const [limit, setLimit] = useState(initialLimit);
  const [negativeMarking, setNegativeMarking] = useState(true);
  const autostartDoneRef = useRef(false);

  const [subjects, setSubjects] = useState<string[]>([]);
  const [examTracks, setExamTracks] = useState<string[]>([]);
  const [examSeriesList, setExamSeriesList] = useState<string[]>([]);
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [elapsedSec, setElapsedSec] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [bookmarkedQIds, setBookmarkedQIds] = useState<Set<string>>(new Set());

  // Archive Mode State
  const [archiveData, setArchiveData] = useState<ArchiveResponse | null>(null);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [archiveTrack, setArchiveTrack] = useState<string>(
    initialTrack !== "All" ? initialTrack : "All"
  );
  const [archiveStudyMode, setArchiveStudyMode] = useState<"study" | "selftest">(
    "study"
  );
  const [revealedArchiveIds, setRevealedArchiveIds] = useState<Set<string>>(
    new Set()
  );
  const [selfTestPicks, setSelfTestPicks] = useState<Record<string, number>>(
    {}
  );
  const [archiveDirectoryOpen, setArchiveDirectoryOpen] = useState(false);
  const [archivePaperQuery, setArchivePaperQuery] = useState("");

  const rawSeriesList = archiveData?.seriesList;
  const activeSeriesName = archiveData?.activeSeries;

  const archiveGrouped = useMemo(
    () => groupAndOrderArchiveSeries(rawSeriesList ?? []),
    [rawSeriesList]
  );

  const filteredArchiveGroups = useMemo(() => {
    const q = archivePaperQuery.trim().toLowerCase();
    if (!q) return archiveGrouped.groups;
    return archiveGrouped.groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            item.examSeries.toLowerCase().includes(q) ||
            g.label.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [archiveGrouped.groups, archivePaperQuery]);

  const activeSeriesIdx = useMemo(() => {
    if (!activeSeriesName) return -1;
    return archiveGrouped.orderedSeries.findIndex(
      (s) => s.examSeries === activeSeriesName
    );
  }, [archiveGrouped.orderedSeries, activeSeriesName]);

  // Smart Search Mode State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSubject, setSearchSubject] = useState(
    initialSubject !== "All" ? initialSubject : "All"
  );
  const [searchResults, setSearchResults] = useState<SmartSearchResponse | null>(
    null
  );
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Mistake Vault State
  const [vault, setVault] = useState<MistakeVaultResponse>({
    wrongQuestions: [],
    bookmarkedQuestions: [],
  });
  const [loadingVault, setLoadingVault] = useState(false);

  // AI Fresh Quiz State
  const [isAiQuiz, setIsAiQuiz] = useState(false);
  const [aiTopicPrompt, setAiTopicPrompt] = useState("");
  const [aiCount, setAiCount] = useState("5");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const loadMetaAndVault = useCallback(async () => {
    const sid = getOrCreateSessionId();
    try {
      const [metaRes, histRes, progRes, vaultRes] = await Promise.all([
        apiFetch<QuestionsResponse>("/practice/questions?limit=1&includeAnswers=false"),
        apiFetch<QuizAttempt[]>(
          `/practice/attempts?sessionId=${encodeURIComponent(sid)}`
        ),
        apiFetch<LearnerProgress>(`/progress/${encodeURIComponent(sid)}`),
        apiFetch<MistakeVaultResponse>(
          `/practice/mistakes?sessionId=${encodeURIComponent(sid)}`
        ),
      ]);
      setSubjects(["All", ...metaRes.subjects]);
      setExamTracks(["All", ...metaRes.examTracks]);
      setExamSeriesList(["All", ...(metaRes.examSeriesList ?? [])]);
      setAttempts(histRes);
      setBookmarkedQIds(new Set(progRes.bookmarkedQuestionIds ?? []));
      setVault(vaultRes);
    } catch {
      // handled gracefully in UI
    }
  }, []);

  const loadArchive = useCallback(
    async (seriesName?: string, trackName?: string) => {
      setLoadingArchive(true);
      try {
        const sp = new URLSearchParams();
        if (seriesName && seriesName !== "All") sp.set("examSeries", seriesName);
        if (trackName && trackName !== "All") sp.set("examTrack", trackName);
        const qs = sp.toString();
        const res = await apiFetch<ArchiveResponse>(
          `/practice/archive${qs ? `?${qs}` : ""}`
        );
        setArchiveData(res);
        setRevealedArchiveIds(new Set());
        setSelfTestPicks({});
      } finally {
        setLoadingArchive(false);
      }
    },
    []
  );

  const runSmartSearch = useCallback(
    async (qText = searchQuery, sub = searchSubject) => {
      setLoadingSearch(true);
      try {
        const params = new URLSearchParams();
        if (qText.trim()) params.set("q", qText.trim());
        if (sub && sub !== "All") params.set("subject", sub);
        const res = await apiFetch<SmartSearchResponse>(
          `/practice/search?${params.toString()}`
        );
        setSearchResults(res);
      } finally {
        setLoadingSearch(false);
      }
    },
    [searchQuery, searchSubject]
  );

  const refreshVault = useCallback(async () => {
    setLoadingVault(true);
    try {
      const sid = getOrCreateSessionId();
      const res = await apiFetch<MistakeVaultResponse>(
        `/practice/mistakes?sessionId=${encodeURIComponent(sid)}`
      );
      setVault(res);
    } finally {
      setLoadingVault(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const sid = getOrCreateSessionId();

    Promise.all([
      apiFetch<QuestionsResponse>("/practice/questions?limit=1&includeAnswers=false"),
      apiFetch<QuizAttempt[]>(
        `/practice/attempts?sessionId=${encodeURIComponent(sid)}`
      ),
      apiFetch<LearnerProgress>(`/progress/${encodeURIComponent(sid)}`),
      apiFetch<MistakeVaultResponse>(
        `/practice/mistakes?sessionId=${encodeURIComponent(sid)}`
      ),
    ])
      .then(([metaRes, histRes, progRes, vaultRes]) => {
        if (!active) return;
        setSubjects(["All", ...metaRes.subjects]);
        setExamTracks(["All", ...metaRes.examTracks]);
        setExamSeriesList(["All", ...(metaRes.examSeriesList ?? [])]);
        setAttempts(histRes);
        setBookmarkedQIds(new Set(progRes.bookmarkedQuestionIds ?? []));
        setVault(vaultRes);
      })
      .catch(() => {});

    if (initialMode === "archive") {
      const sp = new URLSearchParams();
      if (initialSeries !== "All") sp.set("examSeries", initialSeries);
      if (initialTrack !== "All") sp.set("examTrack", initialTrack);
      const qs = sp.toString();
      apiFetch<ArchiveResponse>(`/practice/archive${qs ? `?${qs}` : ""}`)
        .then((res) => {
          if (active) setArchiveData(res);
        })
        .catch(() => {});
    } else if (initialMode === "search") {
      const sp = new URLSearchParams();
      if (initialSubject !== "All") sp.set("subject", initialSubject);
      apiFetch<SmartSearchResponse>(`/practice/search?${sp.toString()}`)
        .then((res) => {
          if (active) setSearchResults(res);
        })
        .catch(() => {});
    }

    if (shouldAutostart && !autostartDoneRef.current) {
      autostartDoneRef.current = true;
      const params = new URLSearchParams({
        subject: initialSubject,
        examTrack: initialTrack,
        examSeries: initialSeries,
        limit: initialLimit,
        includeAnswers: "false",
      });
      apiFetch<QuestionsResponse>(`/practice/questions?${params.toString()}`)
        .then((res) => {
          if (!active) return;
          setQuestions(res.items);
          setQuizActive(res.items.length > 0);
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [
    initialMode,
    initialSeries,
    initialSubject,
    initialTrack,
    initialLimit,
    shouldAutostart,
  ]);

  useEffect(() => {
    if (!quizActive) return;
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [quizActive]);

  function handleSwitchMode(nextMode: ArenaMode) {
    setMode(nextMode);
    if (nextMode === "archive" && !archiveData) {
      loadArchive(
        initialSeries !== "All" ? initialSeries : undefined,
        archiveTrack !== "All" ? archiveTrack : undefined
      );
    } else if (nextMode === "search" && !searchResults) {
      runSmartSearch(searchQuery, searchSubject);
    } else if (nextMode === "mistakes") {
      refreshVault();
    }
  }

  async function startMock(customIds?: string[]) {
    setMode("mock");
    setIsAiQuiz(false);
    setAiNotice(null);
    setLoading(true);
    setResult(null);
    setAnswers({});
    setElapsedSec(0);
    try {
      const params = new URLSearchParams({
        includeAnswers: "false",
      });
      if (customIds && customIds.length > 0) {
        params.set("ids", customIds.join(","));
        params.set("limit", String(Math.min(100, customIds.length)));
      } else {
        params.set("subject", subject);
        params.set("examTrack", examTrack);
        params.set("examSeries", examSeries);
        params.set("limit", limit);
      }

      const res = await apiFetch<QuestionsResponse>(
        `/practice/questions?${params.toString()}`
      );
      setQuestions(res.items);
      setQuizActive(res.items.length > 0);
    } finally {
      setLoading(false);
    }
  }

  async function startSubjectDrill(targetSubject: string) {
    setSubject(targetSubject);
    setExamTrack("All");
    setExamSeries("All");
    setLimit("15");
    setMode("mock");
    setIsAiQuiz(false);
    setAiNotice(null);
    setLoading(true);
    setResult(null);
    setAnswers({});
    setElapsedSec(0);
    try {
      const params = new URLSearchParams({
        subject: targetSubject,
        examTrack: "All",
        examSeries: "All",
        limit: "15",
        includeAnswers: "false",
      });
      const res = await apiFetch<QuestionsResponse>(
        `/practice/questions?${params.toString()}`
      );
      setQuestions(res.items);
      setQuizActive(res.items.length > 0);
    } finally {
      setLoading(false);
    }
  }

  async function startAiFreshQuiz() {
    setMode("mock");
    setGeneratingAi(true);
    setAiNotice(null);
    setResult(null);
    setAnswers({});
    setElapsedSec(0);
    try {
      const targetSubject = subject === "All" ? "Bangladesh Affairs" : subject;
      const targetTrack =
        examTrack === "All" ? "BCS Preliminary" : examTrack;
      const data = await apiFetch<{
        topicTitle: string;
        subject: string;
        examTrack: string;
        questions: McqQuestion[];
        meta?: { modelUsed: string; keySlotUsed: number; totalKeys: number };
      }>("/ai/generate-mcqs", {
        method: "POST",
        body: JSON.stringify({
          subject: targetSubject,
          examTrack: targetTrack,
          topicTitle: aiTopicPrompt.trim(),
          count: Math.min(10, Math.max(3, parseInt(aiCount, 10) || 5)),
        }),
      });
      setIsAiQuiz(true);
      setQuestions(data.questions);
      setQuizActive(data.questions.length > 0);
      setAiNotice(
        `Generated ${data.questions.length} fresh ${data.subject} MCQs (${data.meta?.modelUsed || "Gemini AI"} • Key ${data.meta?.keySlotUsed || 1}/${data.meta?.totalKeys || 1}).`
      );
    } catch (err) {
      setAiNotice(
        err instanceof Error
          ? err.message
          : "Could not generate AI MCQs right now."
      );
    } finally {
      setGeneratingAi(false);
    }
  }

  async function submitMock() {
    if (questions.length === 0) return;
    setSubmitting(true);
    setQuizActive(false);

    if (isAiQuiz) {
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;
      const review: ReviewItem[] = questions.map((q) => {
        const picked =
          typeof answers[q._id] === "number" ? answers[q._id] : null;
        const correctIdx = typeof q.correctIndex === "number" ? q.correctIndex : 0;
        let status: ReviewItem["status"] = "unanswered";
        if (picked === null) {
          unansweredCount += 1;
        } else if (picked === correctIdx) {
          correctCount += 1;
          status = "correct";
        } else {
          wrongCount += 1;
          status = "wrong";
        }
        return {
          questionId: q._id,
          question: q.question,
          options: q.options,
          selectedIndex: picked,
          correctIndex: correctIdx,
          explanation: q.explanation || "",
          subject: q.subject,
          isCorrect: status === "correct",
          status,
        };
      });
      const penalty = negativeMarking ? wrongCount * 0.5 : 0;
      const netScore = Math.round((correctCount - penalty) * 100) / 100;
      const accuracyPercent = questions.length
        ? Math.round((correctCount / questions.length) * 100)
        : 0;

      setResult({
        attempt: {
          _id: `ai-attempt-${Date.now()}`,
          sessionId: getOrCreateSessionId(),
          examTrack: examTrack === "All" ? "AI Adaptive Drill" : examTrack,
          subject: subject === "All" ? "Mixed AI Set" : subject,
          totalQuestions: questions.length,
          correctCount,
          wrongCount,
          unansweredCount,
          negativeMarkingEnabled: negativeMarking,
          netScore,
          maxScore: questions.length,
          accuracyPercent,
          durationSeconds: elapsedSec,
          createdAt: new Date().toISOString(),
        },
        review,
        analytics: computeClientAnalytics(
          review,
          netScore,
          questions.length,
          penalty,
          examTrack
        ),
      });
      setSubmitting(false);
      return;
    }

    try {
      const sid = getOrCreateSessionId();
      const payload = {
        sessionId: sid,
        examTrack: examSeries !== "All" ? examSeries : examTrack,
        subject,
        negativeMarkingEnabled: negativeMarking,
        durationSeconds: elapsedSec,
        answers: questions.map((q) => ({
          questionId: q._id,
          selectedIndex:
            typeof answers[q._id] === "number" ? answers[q._id] : null,
        })),
      };

      const res = await apiFetch<SubmitResponse>("/practice/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(res);
      await loadMetaAndVault();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleQuestionBookmark(questionId: string) {
    const sid = getOrCreateSessionId();
    const res = await apiFetch<LearnerProgress>(
      `/progress/${encodeURIComponent(sid)}/toggle-question-bookmark`,
      {
        method: "POST",
        body: JSON.stringify({ questionId }),
      }
    );
    setBookmarkedQIds(new Set(res.bookmarkedQuestionIds ?? []));
    if (mode === "mistakes") {
      await refreshVault();
    }
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* 4-Mode Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {[
          { id: "mock", label: "Timed Mock Simulator", icon: Target },
          {
            id: "archive",
            label: "Job Solution Archive",
            icon: FileCheck2,
          },
          { id: "search", label: "Smart MCQ Search", icon: Search },
          {
            id: "mistakes",
            label: `Mistake Vault (${vault.wrongQuestions.length})`,
            icon: AlertTriangle,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSwitchMode(tab.id as ArenaMode)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                mode === tab.id
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODE 1: TIMED MOCK SIMULATOR */}
      {mode === "mock" && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Subject Filter
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={quizActive}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                >
                  {(subjects.length ? subjects : ["All"]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Exam Track
                </label>
                <select
                  value={examTrack}
                  onChange={(e) => setExamTrack(e.target.value)}
                  disabled={quizActive}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                >
                  {(examTracks.length ? examTracks : ["All"]).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Past Paper Series
                </label>
                <select
                  value={examSeries}
                  onChange={(e) => setExamSeries(e.target.value)}
                  disabled={quizActive}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                >
                  {(examSeriesList.length ? examSeriesList : ["All"]).map(
                    (series) => (
                      <option key={series} value={series}>
                        {series}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Questions
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  disabled={quizActive}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                >
                  <option value="5">5 Questions</option>
                  <option value="10">10 Questions</option>
                  <option value="15">15 Questions</option>
                  <option value="20">20 Questions</option>
                  <option value="25">25 Questions</option>
                  <option value="30">30 Questions</option>
                  <option value="40">40 Questions</option>
                  <option value="50">50 Questions</option>
                  <option value="80">80 Questions (DPE / Ministry Full)</option>
                  <option value="100">Full Bank (Up to 100)</option>
                </select>
              </div>

              <div className="flex flex-col justify-between">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Negative Marking
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={negativeMarking}
                    disabled={quizActive}
                    onChange={(e) => setNegativeMarking(e.target.checked)}
                    className="h-4 w-4 accent-emerald-700"
                  />
                  <span>-0.50 penalty</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Target className="h-4 w-4 text-emerald-700" />
                <span>
                  Wrong answers automatically save to your Mistake Vault for easy re-drilling.
                </span>
              </div>
              <button
                type="button"
                onClick={() => startMock()}
                disabled={loading || generatingAi}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
              >
                {result || quizActive ? (
                  <RotateCcw className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>{loading ? "Generating..." : "Start New Mock Test"}</span>
              </button>
            </div>

            {/* Unlimited Gemini AI MCQ Generator */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Unlimited AI Fresh MCQ Generator (Uses Selected Subject &amp; Track Above)
                </p>
                <span className="text-[11px] font-semibold text-indigo-700">
                  Instant grading + bilingual exam explanations
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  disabled={quizActive}
                  value={aiTopicPrompt}
                  onChange={(e) => setAiTopicPrompt(e.target.value)}
                  placeholder="Optional focus topic (e.g. Sandhi, BD Constitution Art 137, Bank Ratio Math)"
                  className="flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-indigo-500 focus:outline-none disabled:opacity-60"
                />
                <select
                  disabled={quizActive}
                  value={aiCount}
                  onChange={(e) => setAiCount(e.target.value)}
                  className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800"
                >
                  <option value="5">5 AI MCQs</option>
                  <option value="8">8 AI MCQs</option>
                  <option value="10">10 AI MCQs</option>
                </select>
                <button
                  type="button"
                  disabled={quizActive || generatingAi || loading}
                  onClick={startAiFreshQuiz}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-700 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-60 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{generatingAi ? "Generating AI Quiz..." : "Generate AI Quiz"}</span>
                </button>
              </div>
              {aiNotice && (
                <p className="text-xs font-semibold text-indigo-900">{aiNotice}</p>
              )}
            </div>
          </div>

          {quizActive && questions.length > 0 && (
            <div className="space-y-5">
              <div className="sticky top-16 z-20 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-950 px-5 py-3 text-white shadow-md">
                <div className="text-sm font-bold">
                  Answered:{" "}
                  {
                    Object.values(answers).filter((v) => typeof v === "number")
                      .length
                  }{" "}
                  / {questions.length}
                </div>
                <div className="inline-flex items-center gap-2 font-mono text-sm font-bold text-emerald-300">
                  <Clock className="h-4 w-4" />
                  {formatTimer(elapsedSec)}
                </div>
                <button
                  type="button"
                  onClick={submitMock}
                  disabled={submitting}
                  className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                >
                  {submitting ? "Grading..." : "Submit Exam"}
                </button>
              </div>

              {questions.map((q, idx) => (
                <div
                  key={q._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Q{idx + 1} • {q.subject}
                    </span>
                    <span className="text-slate-500 font-semibold">
                      {q.examSeries && q.examSeries !== "Topic Practice Bank"
                        ? q.examSeries
                        : `${q.examTrack} (${q.difficulty})`}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {q.question}
                  </h3>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {q.options.map((opt, optIdx) => {
                      const selected = answers[q._id] === optIdx;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q._id]: prev[q._id] === optIdx ? null : optIdx,
                            }))
                          }
                          className={`flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition-all cursor-pointer ${
                            selected
                              ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600"
                              : "border-slate-200 bg-slate-50/70 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              selected
                                ? "bg-emerald-700 text-white"
                                : "bg-white border border-slate-300 text-slate-600"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-900 to-teal-900 p-6 text-white shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Mock Exam Result Summary
                    </p>
                    <h2 className="mt-1 text-3xl font-extrabold">
                      Net Score: {result.attempt.netScore} /{" "}
                      {result.attempt.maxScore}
                    </h2>
                    <p className="mt-1 text-sm text-emerald-100">
                      Accuracy: {result.attempt.accuracyPercent}% • Time:{" "}
                      {formatTimer(result.attempt.durationSeconds)}{" "}
                      {result.attempt.negativeMarkingEnabled
                        ? "• (-0.50 Penalty Applied)"
                        : "• (No Negative Marking)"}
                    </p>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div className="rounded-xl bg-white/10 px-4 py-2.5">
                      <p className="text-xs text-emerald-200">Correct</p>
                      <p className="text-xl font-extrabold">
                        {result.attempt.correctCount}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-4 py-2.5">
                      <p className="text-xs text-rose-200">Wrong</p>
                      <p className="text-xl font-extrabold">
                        {result.attempt.wrongCount}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-4 py-2.5">
                      <p className="text-xs text-slate-200">Skipped</p>
                      <p className="text-xl font-extrabold">
                        {result.attempt.unansweredCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {result.analytics && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
                          result.analytics.isSafeZone
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {result.analytics.isSafeZone
                          ? `SAFE ZONE: ${result.analytics.netPercent}% meets ${result.analytics.cutoffTargetPercent}% Preliminary Cut-Off`
                          : `BELOW CUT-OFF: ${result.analytics.netPercent}% vs ${result.analytics.cutoffTargetPercent}% Safe Target`}
                      </span>
                      <p className="mt-1.5 text-xs text-slate-600">
                        Negative Marks Deducted:{" "}
                        <strong className="text-rose-700">
                          -{result.analytics.penaltyLost}
                        </strong>{" "}
                        &bull; Subjects below 65% need targeted lecture review before your
                        next timed mock.
                      </p>
                    </div>
                    <Link
                      href="/study?tab=topics"
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      Open Topic Guru Sheets &rarr;
                    </Link>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {result.analytics.subjectBreakdown.map((subStat) => (
                      <div
                        key={subStat.subject}
                        className={`rounded-xl border p-3.5 space-y-2 ${
                          subStat.weak
                            ? "border-rose-200 bg-rose-50/40"
                            : "border-emerald-200 bg-emerald-50/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-extrabold text-slate-900">
                            {subStat.subject}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              subStat.weak
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {subStat.correct}/{subStat.total} ({subStat.accuracyPercent}
                            %{subStat.weak ? " • Weak" : ""})
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ease-in-out ${
                              subStat.weak ? "bg-rose-500" : "bg-emerald-600"
                            }`}
                            style={{ width: `${subStat.accuracyPercent}%` }}
                          />
                        </div>
                        {subStat.weak && (
                          <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => startSubjectDrill(subStat.subject)}
                              className="font-bold text-rose-800 hover:underline cursor-pointer"
                            >
                              Re-Drill 15 {subStat.subject} MCQs &rarr;
                            </button>
                            <Link
                              href={`/study?tab=topics&q=${encodeURIComponent(
                                subStat.subject.split(" ")[0]
                              )}`}
                              className="font-bold text-emerald-800 hover:underline"
                            >
                              Study Sheet
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Detailed Answer &amp; Explanation Review
                </h3>
                {result.review.map((item, idx) => {
                  const isSaved = bookmarkedQIds.has(item.questionId);
                  return (
                    <div
                      key={item.questionId}
                      className={`rounded-2xl border p-5 bg-white shadow-sm space-y-3 ${
                        item.status === "correct"
                          ? "border-emerald-300"
                          : item.status === "wrong"
                          ? "border-rose-300"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                        <span className="text-slate-500">
                          Q{idx + 1} • {item.subject}
                        </span>
                        <div className="flex items-center gap-3">
                          {!item.questionId.startsWith("ai-") && (
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleQuestionBookmark(item.questionId)
                              }
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold cursor-pointer ${
                                isSaved
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                              <span>{isSaved ? "Saved" : "Bookmark"}</span>
                            </button>
                          )}
                          {item.status === "correct" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" /> Correct (+1)
                            </span>
                          ) : item.status === "wrong" ? (
                            <span className="inline-flex items-center gap-1 text-rose-700">
                              <XCircle className="h-4 w-4" /> Wrong{" "}
                              {result.attempt.negativeMarkingEnabled
                                ? "(-0.50)"
                                : "(0)"}
                            </span>
                          ) : (
                            <span className="text-slate-500">Skipped (0)</span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        {item.question}
                      </p>

                      <div className="grid gap-2 sm:grid-cols-2 text-xs">
                        {item.options.map((opt, i) => {
                          const isRight = i === item.correctIndex;
                          const isChosen = i === item.selectedIndex;
                          return (
                            <div
                              key={opt}
                              className={`rounded-lg px-3 py-2 border font-semibold ${
                                isRight
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                  : isChosen
                                  ? "border-rose-400 bg-rose-50 text-rose-900"
                                  : "border-slate-200 text-slate-600"
                              }`}
                            >
                              {String.fromCharCode(65 + i)}. {opt}
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-slate-900">Explanation:</strong>{" "}
                        {item.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {attempts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-700" />
                Your Recent Mock Attempts
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Subject / Track</th>
                      <th className="py-2 pr-4">Net Score</th>
                      <th className="py-2 pr-4">Accuracy</th>
                      <th className="py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attempts.map((a) => (
                      <tr key={a._id}>
                        <td className="py-2.5 pr-4 text-slate-600">
                          {formatBdDateTime(a.createdAt)}
                        </td>
                        <td className="py-2.5 pr-4 font-semibold text-slate-900">
                          {a.subject} ({a.examTrack})
                        </td>
                        <td className="py-2.5 pr-4 font-bold text-emerald-700">
                          {a.netScore} / {a.maxScore}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-700">
                          {a.accuracyPercent}%
                        </td>
                        <td className="py-2.5 font-mono text-slate-600">
                          {formatTimer(a.durationSeconds)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: JOB SOLUTION ARCHIVE (READ PREVIOUS EXAM PAPERS WITH SOLUTIONS) */}
      {mode === "archive" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-emerald-700" />
                  BD Job Solution Archive — Previous Exam Sets
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Filter by exam track, read authentic past papers in Study Mode or test
                  yourself in Self-Test reveal mode.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setArchiveStudyMode("study")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      archiveStudyMode === "study"
                        ? "bg-emerald-700 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Study Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setArchiveStudyMode("selftest");
                      setRevealedArchiveIds(new Set());
                      setSelfTestPicks({});
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      archiveStudyMode === "selftest"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Self-Test Mode</span>
                  </button>
                </div>
                {archiveData && archiveData.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setExamSeries(archiveData.activeSeries);
                      setExamTrack("All");
                      setSubject("All");
                      setLimit(String(archiveData.items.length));
                      startMock(archiveData.items.map((i) => i._id));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Take Timed</span>
                  </button>
                )}
              </div>
            </div>

            {/* Exam Track Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">
                Track:
              </span>
              {[
                "All",
                "BCS Preliminary",
                "Grade 11-20",
                "Primary & NTRCA",
                "Bank Combined",
                "Govt Rules 2026",
              ].map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => {
                    setArchiveTrack(tr);
                    setArchivePaperQuery("");
                    loadArchive(undefined, tr);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer transition-colors ${
                    archiveTrack === tr
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tr === "Grade 11-20" ? "Post Office & Grade 11–20" : tr}
                </button>
              ))}
            </div>

            {/* Compact Paper Switcher + Smooth Expandable Archive Directory */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[230px]">
                  <label htmlFor="archive-series-select" className="sr-only">
                    Select Exam Paper Archive
                  </label>
                  <select
                    id="archive-series-select"
                    value={archiveData?.activeSeries ?? ""}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      loadArchive(
                        e.target.value,
                        archiveTrack !== "All" ? archiveTrack : undefined
                      );
                    }}
                    disabled={!archiveData || archiveGrouped.orderedSeries.length === 0}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {archiveGrouped.orderedSeries.length === 0 ? (
                      <option value="">Loading exam archives...</option>
                    ) : (
                      archiveGrouped.groups.map((group) => (
                        <optgroup key={group.track} label={group.label}>
                          {group.items.map((series) => (
                            <option
                              key={series.examSeries}
                              value={series.examSeries}
                            >
                              {series.examSeries} ({series.count} Qs)
                            </option>
                          ))}
                        </optgroup>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={activeSeriesIdx <= 0}
                    title={
                      activeSeriesIdx > 0
                        ? `Previous: ${archiveGrouped.orderedSeries[activeSeriesIdx - 1]?.examSeries}`
                        : "First archive in list"
                    }
                    onClick={() => {
                      const prev =
                        archiveGrouped.orderedSeries[activeSeriesIdx - 1];
                      if (prev) {
                        loadArchive(
                          prev.examSeries,
                          archiveTrack !== "All" ? archiveTrack : undefined
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  {archiveGrouped.orderedSeries.length > 0 && activeSeriesIdx >= 0 && (
                    <span className="hidden md:inline-block px-1.5 text-[11px] font-bold text-slate-500 tabular-nums">
                      {activeSeriesIdx + 1}/{archiveGrouped.orderedSeries.length}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={
                      activeSeriesIdx === -1 ||
                      activeSeriesIdx >= archiveGrouped.orderedSeries.length - 1
                    }
                    title={
                      activeSeriesIdx >= 0 &&
                      activeSeriesIdx < archiveGrouped.orderedSeries.length - 1
                        ? `Next: ${archiveGrouped.orderedSeries[activeSeriesIdx + 1]?.examSeries}`
                        : "Last archive in list"
                    }
                    onClick={() => {
                      const next =
                        archiveGrouped.orderedSeries[activeSeriesIdx + 1];
                      if (next) {
                        loadArchive(
                          next.examSeries,
                          archiveTrack !== "All" ? archiveTrack : undefined
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    aria-expanded={archiveDirectoryOpen}
                    onClick={() => setArchiveDirectoryOpen((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold cursor-pointer transition-colors ${
                      archiveDirectoryOpen
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>
                      Browse All ({archiveGrouped.orderedSeries.length})
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-300 ease-in-out ${
                        archiveDirectoryOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Smooth Ease-In / Ease-Out Collapsible Grouped Grid Directory */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  archiveDirectoryOpen
                    ? "grid-rows-[1fr] opacity-100 pt-2"
                    : "grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-slate-200 pt-3 space-y-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={archivePaperQuery}
                        onChange={(e) => setArchivePaperQuery(e.target.value)}
                        placeholder={`Search ${archiveGrouped.orderedSeries.length} exam papers (e.g. 46th BCS, Bank AD, Primary, NBR)...`}
                        className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                      />
                      {archivePaperQuery && (
                        <button
                          type="button"
                          onClick={() => setArchivePaperQuery("")}
                          aria-label="Clear paper search"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {filteredArchiveGroups.length === 0 ? (
                      <p className="py-4 text-center text-xs font-medium text-slate-500">
                        No exam archive matches &ldquo;{archivePaperQuery}&rdquo;.
                      </p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto pr-1 space-y-3">
                        {filteredArchiveGroups.map((group) => (
                          <div key={group.track} className="space-y-1.5">
                            <div className="flex items-center justify-between px-0.5">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                {group.label}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400">
                                {group.items.length}{" "}
                                {group.items.length === 1 ? "set" : "sets"}
                              </span>
                            </div>
                            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                              {group.items.map((series) => {
                                const isActive =
                                  archiveData?.activeSeries === series.examSeries;
                                return (
                                  <button
                                    key={series.examSeries}
                                    type="button"
                                    onClick={() => {
                                      loadArchive(
                                        series.examSeries,
                                        archiveTrack !== "All"
                                          ? archiveTrack
                                          : undefined
                                      );
                                      setArchiveDirectoryOpen(false);
                                    }}
                                    className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-bold transition-all cursor-pointer ${
                                      isActive
                                        ? "border-slate-900 bg-slate-900 text-white shadow-2xs"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40"
                                    }`}
                                  >
                                    <span className="line-clamp-1">
                                      {series.examSeries}
                                    </span>
                                    <span
                                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                                        isActive
                                          ? "bg-white/15 text-white"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {series.count} Qs
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {archiveStudyMode === "selftest" && archiveData && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                <span>
                  Self-Test Active: Click any option to check your answer immediately.
                </span>
                <span className="text-emerald-800">
                  Attempted: {Object.keys(selfTestPicks).length} /{" "}
                  {archiveData.items.length} &bull; Correct:{" "}
                  {
                    archiveData.items.filter(
                      (it) => selfTestPicks[it._id] === it.correctIndex
                    ).length
                  }
                </span>
              </div>
            )}
          </div>

          {loadingArchive ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Loading Job Solution paper...
            </div>
          ) : (
            <div className="space-y-4">
              {(archiveData?.items ?? []).map((item, idx) => {
                const isSaved = bookmarkedQIds.has(item._id);
                const isRevealed =
                  archiveStudyMode === "study" || revealedArchiveIds.has(item._id);
                const userPick = selfTestPicks[item._id];
                return (
                  <article
                    key={item._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800">
                        Q{idx + 1} • {item.subject}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{item.examSeries}</span>
                        {archiveStudyMode === "selftest" && !isRevealed && (
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedArchiveIds((prev) => {
                                const next = new Set(prev);
                                next.add(item._id);
                                return next;
                              })
                            }
                            className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                          >
                            Reveal Answer
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleQuestionBookmark(item._id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold cursor-pointer ${
                            isSaved
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                          <span>{isSaved ? "Saved" : "Save"}</span>
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {item.question}
                    </h3>

                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      {item.options.map((opt, optIdx) => {
                        const isRight = optIdx === item.correctIndex;
                        const isPickedWrong =
                          isRevealed && userPick === optIdx && !isRight;
                        const cls = !isRevealed
                          ? "border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/40"
                          : isRight
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                          : isPickedWrong
                          ? "border-rose-400 bg-rose-50 text-rose-900"
                          : "border-slate-200 bg-slate-50/50 text-slate-700";

                        if (archiveStudyMode === "selftest" && !isRevealed) {
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setSelfTestPicks((prev) => ({
                                  ...prev,
                                  [item._id]: optIdx,
                                }));
                                setRevealedArchiveIds((prev) => {
                                  const next = new Set(prev);
                                  next.add(item._id);
                                  return next;
                                });
                              }}
                              className={`rounded-lg px-3 py-2 border font-semibold text-left transition-colors cursor-pointer ${cls}`}
                            >
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </button>
                          );
                        }

                        return (
                          <div
                            key={opt}
                            className={`rounded-lg px-3 py-2 border font-semibold ${cls}`}
                          >
                            {String.fromCharCode(65 + optIdx)}. {opt}
                            {isRevealed && isRight && " ✓"}
                            {isPickedWrong && " ✗"}
                          </div>
                        );
                      })}
                    </div>

                    {item.explanation && (
                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                          isRevealed
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed">
                            <strong className="text-slate-900">Explanation:</strong>{" "}
                            {item.explanation}
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* MODE 3: SMART MCQ & TOPIC SEARCH */}
      {mode === "search" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-700" />
                Smart MCQ &amp; Concept Search
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Search any Bangla or English keyword (e.g., &ldquo;সন্ধি&rdquo;,
                &ldquo;Article 137&rdquo;, &ldquo;Conditional&rdquo;, &ldquo;CRR&rdquo;,
                &ldquo;Quota&rdquo;) across both Study Lecture Sheets and the MCQ Explanation Bank.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSmartSearch(searchQuery, searchSubject);
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type topic keyword, constitutional article, grammar term..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
              <select
                value={searchSubject}
                onChange={(e) => {
                  setSearchSubject(e.target.value);
                  runSmartSearch(searchQuery, e.target.value);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800"
              >
                {(subjects.length ? subjects : ["All"]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 cursor-pointer"
              >
                Search All
              </button>
            </form>
          </div>

          {loadingSearch ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Searching Lecture Sheets &amp; MCQ Explanations...
            </div>
          ) : (
            <div className="space-y-6">
              {(searchResults?.topics?.length ?? 0) > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                    Matching Lecture Sheets ({searchResults?.topics.length})
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {searchResults?.topics.map((t) => (
                      <Link
                        key={t._id}
                        href={`/study?tab=topics&topicSlug=${encodeURIComponent(
                          t.slug
                        )}`}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 hover:border-emerald-500 transition-colors"
                      >
                        <p className="text-[11px] font-bold text-emerald-800">
                          {t.subject} &bull; {t.unit}
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                          {t.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                          {t.highYieldSummary}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                  Matching Solved MCQs ({searchResults?.questions.length ?? 0})
                </h3>
                {(searchResults?.questions.length ?? 0) === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    No matching questions found. Try another keyword or choose Subject: All.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults?.questions.map((q) => {
                      const isSaved = bookmarkedQIds.has(q._id);
                      return (
                        <article
                          key={q._id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                            <span className="text-emerald-800">
                              {q.subject} &bull; {q.examSeries || q.examTrack}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleQuestionBookmark(q._id)}
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold cursor-pointer ${
                                isSaved
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                              <span>{isSaved ? "Saved" : "Bookmark"}</span>
                            </button>
                          </div>
                          <p className="text-sm font-extrabold text-slate-900">
                            {q.question}
                          </p>
                          {typeof q.correctIndex === "number" && (
                            <p className="text-xs font-bold text-emerald-800 bg-emerald-50 inline-block rounded-lg px-2.5 py-1">
                              Answer: {q.options[q.correctIndex]}
                            </p>
                          )}
                          {q.explanation && (
                            <p className="text-xs text-slate-600 leading-relaxed">
                              <strong>Explanation:</strong> {q.explanation}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* MODE 4: MISTAKE VAULT & BOOKMARKED FLASHCARDS */}
      {mode === "mistakes" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Mistake Vault &amp; Saved Hard Questions
              </h2>
              <p className="text-xs text-slate-700 mt-0.5">
                Every MCQ you miss during a Mock Test lands here automatically and clears as
                soon as you answer it correctly on retry.
              </p>
            </div>
            {vault.wrongQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => startMock(vault.wrongQuestions.map((q) => q._id))}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-rose-800 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>
                  Retry All {vault.wrongQuestions.length} Wrong Answers
                </span>
              </button>
            )}
          </div>

          {loadingVault ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Loading your Mistake Vault...
            </div>
          ) : (
            <div className="space-y-8">
              {/* Wrong Questions */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-800">
                  Questions Missed in Previous Mocks ({vault.wrongQuestions.length})
                </h3>
                {vault.wrongQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Your Mistake Vault is clean! Take a Timed Mock Simulator — any wrong
                    answers will appear here for targeted revision.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vault.wrongQuestions.map((q) => (
                      <article
                        key={q._id}
                        className="rounded-2xl border border-rose-200 bg-white p-5 shadow-xs space-y-2"
                      >
                        <p className="text-xs font-bold text-rose-700">
                          {q.subject} &bull; {q.examTrack}
                        </p>
                        <p className="text-sm font-extrabold text-slate-900">
                          {q.question}
                        </p>
                        {typeof q.correctIndex === "number" && (
                          <p className="text-xs font-bold text-emerald-800 bg-emerald-50 inline-block rounded-lg px-2.5 py-1">
                            Correct: {q.options[q.correctIndex]}
                          </p>
                        )}
                        {q.explanation && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {q.explanation}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {/* Bookmarked Flashcards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-800">
                    Bookmarked Flashcards ({vault.bookmarkedQuestions.length})
                  </h3>
                  {vault.bookmarkedQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        startMock(vault.bookmarkedQuestions.map((q) => q._id))
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Quiz Saved Questions</span>
                    </button>
                  )}
                </div>
                {vault.bookmarkedQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    No bookmarked questions yet. Star any tricky question in Smart Search,
                    Job Solution Archive, or Mock Review.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vault.bookmarkedQuestions.map((q) => (
                      <article
                        key={q._id}
                        className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-amber-800">
                            {q.subject} &bull; {q.examTrack}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleQuestionBookmark(q._id)}
                            className="text-xs font-bold text-slate-500 hover:text-rose-700 cursor-pointer"
                          >
                            Remove Bookmark
                          </button>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {q.question}
                        </p>
                        {typeof q.correctIndex === "number" && (
                          <p className="text-xs font-bold text-emerald-800 bg-emerald-50 inline-block rounded-lg px-2.5 py-1">
                            Answer: {q.options[q.correctIndex]}
                          </p>
                        )}
                        {q.explanation && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {q.explanation}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
