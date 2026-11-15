"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  Globe,
  GraduationCap,
  Layers,
  Newspaper,
  PenTool,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import {
  apiFetch,
  formatBdDateTime,
  getOrCreateSessionId,
  safeExternalHref,
} from "@/lib/api";
import { TopicSheetDrawer } from "@/components/study/TopicSheetDrawer";
import { WrittenTypingVivaLab } from "@/components/study/WrittenTypingVivaLab";
import type {
  CurrentAffairsItem,
  LearnerProgress,
  StudyOverviewData,
  StudyResource,
  StudyRoutineData,
  StudyTopic,
} from "@/lib/types";

interface AffairsListResponse {
  items: CurrentAffairsItem[];
  topics: string[];
  total: number;
  page: number;
  totalPages: number;
}

type StudyTab =
  | "topics"
  | "batches"
  | "routine"
  | "written-viva"
  | "affairs"
  | "books"
  | "model-tests";

const AFFAIRS_TOPICS = [
  "All",
  "Bangladesh Affairs",
  "Economy & Banking",
  "International Affairs",
  "Science & ICT",
  "Governance & Policy",
  "Bangla Digest",
];

const TOPIC_SUBJECTS = [
  "All",
  "Bangla",
  "English",
  "Math & Mental Ability",
  "Bangladesh Affairs",
  "International Affairs",
  "General Science & ICT",
  "Ethics & Governance",
  "Geography & Environment",
  "Govt Job Rules & Banking",
];

const STUDY_TRACKS = [
  "BCS",
  "Bank & Financial",
  "Primary & NTRCA",
  "Grade 11-20",
];

const CORE_SUBJECT_PILLARS = [
  {
    title: "1. Bangla Language & Literature (বাংলা)",
    marksWeight: "BCS Prelims: 35 | Primary/Bank: 20–25",
    whatToCover: [
      "NCTB Class 9–10 Bangla Byakoron ( ধ্বনি, সন্ধি, সমাস, উপসর্গ, প্রত্যয়, কারক, বাগধারা )",
      "Classical & Modern Literature ( চর্যাপদ, মঙ্গলকাব্য, রবীন্দ্রনাথ, নজরুল, মুক্তিযুদ্ধভিত্তিক সাহিত্য )",
      "Bangla essay, official letter & translation practice for Written exams",
    ],
  },
  {
    title: "2. English Grammar, Vocabulary & Comprehension",
    marksWeight: "BCS Prelims: 35 | Bank MCQ: 25 | Primary: 20",
    whatToCover: [
      "Parts of speech, right form of verbs, clauses, conditionals, voice & narration",
      "High-frequency synonyms, antonyms, idioms, appropriate prepositions & analogies",
      "English-to-Bangla & Bangla-to-English newspaper editorial translation",
    ],
  },
  {
    title: "3. Math, Arithmetic & Mental Ability",
    marksWeight: "BCS Prelims: 30 | Bank MCQ: 25–30 | Primary: 20",
    whatToCover: [
      "NCTB Class 6–10 Math: percentage, profit-loss, interest, ratio, mixture, time & work",
      "Algebra, indices, logarithms, geometry basics & probability (BCS + Bank)",
      "Mental Ability: number series, clock/calendar, blood relations, mirror images & puzzles",
    ],
  },
  {
    title: "4. Bangladesh Affairs, Intl Affairs, Science, ICT & Current Affairs",
    marksWeight: "BCS Prelims: 100 combined | GK + ICT core across all ministries",
    whatToCover: [
      "Bangladesh Liberation War (1947–1971), Constitution Articles (1–153) & Fiscal Budget",
      "2026 Govt Rules: Age Limit 32 Ordinance, 2024 Quota Reform (93% Merit), Digital Services",
      "Daily live news tracking (BSS National, BB Policy, Prothom Alo, Intl Summits) + ICT",
    ],
  },
];

function resolveInitialTab(param: string | null): StudyTab {
  if (
    param === "topics" ||
    param === "batches" ||
    param === "routine" ||
    param === "written-viva" ||
    param === "affairs" ||
    param === "books" ||
    param === "model-tests"
  ) {
    return param;
  }
  return "topics";
}

export function StudyHub({
  initialData,
}: {
  initialData: StudyOverviewData | null;
}) {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<StudyTab>(() =>
    resolveInitialTab(searchParams.get("tab"))
  );

  const [overview, setOverview] = useState<StudyOverviewData | null>(
    initialData
  );
  const [progress, setProgress] = useState<LearnerProgress | null>(null);

  // Topic Guru state
  const [topicSubject, setTopicSubject] = useState("All");
  const [topicTrack, setTopicTrack] = useState("All");
  const [topicQuery, setTopicQuery] = useState("");
  const [topicSearchState, setTopicSearchState] = useState<{
    key: string;
    items: StudyTopic[];
  } | null>(null);

  const trimmedTopicQuery = topicQuery.trim();
  const hasActiveTopicFilter =
    Boolean(trimmedTopicQuery) || topicSubject !== "All" || topicTrack !== "All";
  const activeFilterKey = hasActiveTopicFilter
    ? `${trimmedTopicQuery}::${topicSubject}::${topicTrack}`
    : "";
  const topicsLoading =
    hasActiveTopicFilter && topicSearchState?.key !== activeFilterKey;

  // Topic search runs on the server so it can match keyFacts and chapter text,
  // neither of which the trimmed list payload carries. Debounced so typing does
  // not fire a request per keystroke.
  useEffect(() => {
    if (!hasActiveTopicFilter) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (trimmedTopicQuery) params.set("q", trimmedTopicQuery);
        if (topicSubject !== "All") params.set("subject", topicSubject);
        if (topicTrack !== "All") params.set("track", topicTrack);
        const res = await apiFetch<{ items: StudyTopic[] }>(
          `/study/topics?${params.toString()}`
        );
        if (!cancelled) {
          setTopicSearchState({ key: activeFilterKey, items: res?.items ?? [] });
        }
      } catch {
        if (!cancelled) {
          setTopicSearchState({ key: activeFilterKey, items: [] });
        }
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [hasActiveTopicFilter, activeFilterKey, trimmedTopicQuery, topicSubject, topicTrack]);
  const [selectedTopic, setSelectedTopic] = useState<StudyTopic | null>(() => {
    const slug = searchParams.get("topicSlug");
    if (!slug || !initialData?.topics) return null;
    return initialData.topics.find((t) => t.slug === slug) ?? null;
  });

  // The list payload omits chapters, memory tricks and quick examples so that
  // /study/overview stays small. Fetch the full sheet once a topic is opened;
  // until it arrives the summary renders and the heavy sections stay hidden.
  useEffect(() => {
    const slug = selectedTopic?.slug;
    if (!slug || selectedTopic?.chapters) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{ topic: StudyTopic }>(
          `/study/topics/${encodeURIComponent(slug)}`
        );
        if (cancelled || !res?.topic) return;
        setSelectedTopic((current) =>
          current?.slug === slug ? { ...current, ...res.topic } : current
        );
      } catch {
        // Leave the summary view in place if the sheet cannot be loaded.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedTopic?.slug, selectedTopic?.chapters]);

  // 30-Day Routine state
  const [routineData, setRoutineData] = useState<StudyRoutineData | null>(
    initialData?.routine ?? null
  );
  const [routineTrack, setRoutineTrack] = useState(
    initialData?.routine?.track ?? "BCS"
  );
  const [loadingRoutine, setLoadingRoutine] = useState(false);

  // Current Affairs state
  const [affairsItems, setAffairsItems] = useState<CurrentAffairsItem[]>(
    initialData?.currentAffairs ?? []
  );
  const [affairsTotal, setAffairsTotal] = useState<number>(
    initialData?.stats.affairsCount ?? 0
  );
  const [topic, setTopic] = useState("All");
  const [language, setLanguage] = useState<"All" | "en" | "bn">("All");
  const [affairsQuery, setAffairsQuery] = useState("");
  const [loadingAffairs, setLoadingAffairs] = useState(false);

  // Books & sync state
  const [bookTrack, setBookTrack] = useState("All");
  const [bookSearch, setBookSearch] = useState("");
  const [syncingNews, setSyncingNews] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    const sid = getOrCreateSessionId();
    apiFetch<LearnerProgress>(`/progress/${encodeURIComponent(sid)}`)
      .then((res) => setProgress(res))
      .catch(() => {});

    if (!overview) {
      apiFetch<StudyOverviewData>("/study/overview")
        .then((res) => {
          setOverview(res);
          setAffairsItems(res.currentAffairs);
          setAffairsTotal(res.stats.affairsCount);
          setRoutineData(res.routine);
          const slug = searchParams.get("topicSlug");
          if (slug) {
            const matched = res.topics.find((t) => t.slug === slug);
            if (matched) setSelectedTopic(matched);
          }
        })
        .catch(() => {});
    }
  }, [overview, searchParams]);

  function openLectureSheet(sheet: StudyTopic) {
    setSelectedTopic(sheet);
  }

  const handleCloseTopic = useCallback(() => {
    setSelectedTopic(null);
  }, []);

  async function handleToggleTopicDone(slug: string) {
    const sid = getOrCreateSessionId();
    const res = await apiFetch<LearnerProgress>(
      `/progress/${encodeURIComponent(sid)}/toggle-topic`,
      {
        method: "POST",
        body: JSON.stringify({ topicSlug: slug }),
      }
    );
    setProgress(res);
  }

  async function handleSelectRoutineTrack(nextTrack: string) {
    setRoutineTrack(nextTrack);
    setLoadingRoutine(true);
    try {
      const res = await apiFetch<StudyRoutineData>(
        `/study/routine?track=${encodeURIComponent(nextTrack)}`
      );
      setRoutineData(res);
    } finally {
      setLoadingRoutine(false);
    }
  }

  async function handleToggleRoutineDay(dayNumber: number) {
    const sid = getOrCreateSessionId();
    const res = await apiFetch<LearnerProgress>(
      `/progress/${encodeURIComponent(sid)}/toggle-routine-day`,
      {
        method: "POST",
        body: JSON.stringify({ track: routineTrack, dayNumber }),
      }
    );
    setProgress(res);
  }

  async function fetchFilteredAffairs(
    nextTopic = topic,
    nextLang = language,
    nextQ = affairsQuery
  ) {
    setLoadingAffairs(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (nextTopic !== "All") params.set("topic", nextTopic);
      if (nextLang !== "All") params.set("language", nextLang);
      if (nextQ.trim()) params.set("q", nextQ.trim());

      const res = await apiFetch<AffairsListResponse>(
        `/study/current-affairs?${params.toString()}`
      );
      setAffairsItems(res.items);
      setAffairsTotal(res.total);
    } finally {
      setLoadingAffairs(false);
    }
  }

  async function handleSyncCurrentAffairs() {
    setSyncingNews(true);
    setSyncNotice(null);
    try {
      const res = await apiFetch<{
        log?: {
          totalFetched: number;
          newInserted: number;
          sourcesChecked: number;
        };
      }>("/sync/run", {
        method: "POST",
        body: JSON.stringify({ targetType: "current_affairs" }),
      });
      const freshOverview = await apiFetch<StudyOverviewData>("/study/overview");
      setOverview(freshOverview);
      await fetchFilteredAffairs(topic, language, affairsQuery);
      setSyncNotice(
        `Live RSS sync completed: checked ${res.log?.sourcesChecked ?? 5} feeds, fetched ${res.log?.totalFetched ?? 0} headlines (${res.log?.newInserted ?? 0} new).`
      );
    } catch (err) {
      setSyncNotice(
        err instanceof Error
          ? err.message
          : "Live news sync could not complete right now."
      );
    } finally {
      setSyncingNews(false);
    }
  }

  const completedTopicsSet = new Set(progress?.completedTopicSlugs ?? []);
  const completedDaysSet = new Set(progress?.completedRoutineDays ?? []);

  // Filtering happens on the server: the list payload no longer carries
  // keyFacts or chapter text, and /study/topics searches both. While no
  // filter is active (or while a new filtered fetch is debouncing) we fall back cleanly.
  const filteredTopics: StudyTopic[] = hasActiveTopicFilter
    ? topicSearchState?.key === activeFilterKey
      ? topicSearchState.items
      : overview?.topics ?? []
    : overview?.topics ?? [];

  const booksList: StudyResource[] = (overview?.books ?? []).filter((b) => {
    const matchTrack =
      bookTrack === "All" ||
      b.examTrack === bookTrack ||
      b.examTrack === "All Tracks";
    const q = bookSearch.trim().toLowerCase();
    const matchQ =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.subject.toLowerCase().includes(q) ||
      b.authorOrPublisher.toLowerCase().includes(q) ||
      b.whyStudy.toLowerCase().includes(q);
    return matchTrack && matchQ;
  });

  const routinePercent = Math.round((completedDaysSet.size / 30) * 100);

  return (
    <>
      <div className={selectedTopic ? "space-y-8 print:hidden" : "space-y-8"}>
      {/* Top Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Topic Guru Sheets
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">
            {overview?.stats.topicsCount ?? 0} Units
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {completedTopicsSet.size} sheets completed by you
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            30-Day Guided Routine
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {completedDaysSet.size} / 30 Days
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Active Track: {routineTrack} ({routinePercent}% done)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Live Current Affairs
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {overview?.stats.affairsCount ?? affairsTotal} Headlines
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Synced from {overview?.stats.affairsFeedCount ?? 5} live RSS feeds
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Questions &amp; Past Papers
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {overview?.stats.mcqCount ?? 0} MCQs
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {overview?.stats.pastPapersCount ?? 0} Past Archives &amp;{" "}
            {overview?.stats.booksCount ?? 0} Core Books
          </p>
        </div>
      </div>

      {/* 6-Tab Study Hub Switcher */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm print:hidden">
        {[
          { id: "topics", label: "Subject Lecture Sheets", icon: Layers },
          { id: "batches", label: "Course Batches & Classes", icon: GraduationCap },
          { id: "routine", label: "30-Day Study Plan", icon: CalendarCheck },
          { id: "written-viva", label: "Written, Typing & Viva", icon: PenTool },
          { id: "books", label: "Books, PDFs & Syllabus", icon: BookOpen },
          {
            id: "model-tests",
            label: "Model Tests & Past Papers",
            icon: ClipboardCheck,
          },
          { id: "affairs", label: "Current Affairs", icon: Newspaper },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as StudyTab)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: TOPIC GURU (ALL-IN-ONE SUBJECT LECTURE SHEETS) */}
      {activeTab === "topics" && (
        <section className="space-y-6">
          {/* Filters for Topic Guru */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 print:hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Topic Guru — Complete Subject Lecture Sheets
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Study Bangla, English, Math, Bangladesh Affairs, Constitution, Science
                  &amp; ICT directly inside SorkariPath without hunting scattered PDFs.
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={topicQuery}
                  onChange={(e) => setTopicQuery(e.target.value)}
                  placeholder="Search Sandhi, Article 137, Clock..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
                {topicsLoading && (
                  <p className="absolute left-0 top-full mt-1 text-[11px] font-semibold text-slate-500">
                    Searching every sheet&hellip;
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TOPIC_SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setTopicSubject(sub)}
                  className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${
                    topicSubject === sub
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-500 mr-1">Track:</span>
              {["All", ...STUDY_TRACKS].map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => setTopicTrack(tr)}
                  className={`rounded-lg px-2.5 py-1 font-semibold cursor-pointer ${
                    topicTrack === tr
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {tr}
                </button>
              ))}
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 print:hidden">
            {filteredTopics.map((item) => {
              const isDone = completedTopicsSet.has(item.slug);
              const isOpen = selectedTopic?.slug === item.slug;

              return (
                <article
                  key={item._id}
                  className={`rounded-2xl border bg-white p-5 shadow-xs flex flex-col justify-between gap-4 transition-all ${
                    isOpen
                      ? "border-emerald-600 ring-1 ring-emerald-600"
                      : "border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800">
                        {item.subject}
                      </span>
                      <div className="flex items-center gap-2">
                        {(item.chapterCount ?? item.chapters?.length ?? 0) > 0 && (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-800">
                            {item.chapterCount ?? item.chapters?.length} Chapters
                          </span>
                        )}
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Done
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {item.estimatedMinutes} min
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {item.unit}
                    </p>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {item.highYieldSummary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openLectureSheet(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      <span>{isOpen ? "Viewing Sheet" : "Open Lecture Sheet"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <Link
                      href={`/practice?subject=${encodeURIComponent(
                        item.mcqSubjectFilter && item.mcqSubjectFilter !== "All"
                          ? item.mcqSubjectFilter
                          : item.subject
                      )}&limit=15&autostart=1`}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      Quiz &rarr;
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredTopics.length === 0 && !topicsLoading && (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No topic sheets match that search.
            </p>
          )}
        </section>
      )}

      {/* TAB 2: COURSE BATCHES & STRUCTURED CLASSES */}
      {activeTab === "batches" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-700" />
              Structured Govt Job Course Batches &amp; Class Roadmaps
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Step-by-step track courses modeled after Biddabari &amp; Live MCQ batch
              plans. Open every class lecture sheet, track your mastery bar, and
              launch full-length mock tests for your target recruitment.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {(overview?.studyBatches ?? []).map((batch) => {
              const completedInBatch = batch.lessons.filter((l) =>
                completedTopicsSet.has(l.slug)
              ).length;
              const pct = batch.totalLessons
                ? Math.round((completedInBatch / batch.totalLessons) * 100)
                : 0;
              const hoursLabel = `${(batch.totalEstimatedMinutes / 60).toFixed(1)} hrs`;

              return (
                <article
                  key={batch.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between gap-5"
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-900">
                        {batch.badge}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                        {batch.weeklyHours} &bull; {hoursLabel} Sheets
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {batch.title}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                        Target: {batch.targetExam}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed mt-2">
                        {batch.syllabusSummary}
                      </p>
                    </div>

                    {/* Batch completion progress bar */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>
                          Batch Sheet Progress: {completedInBatch} / {batch.totalLessons}
                        </span>
                        <span className="text-emerald-700">{pct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Question Bank Ready: <strong>{batch.mcqPoolCount}</strong>{" "}
                        {batch.examTrack} MCQs
                      </p>
                    </div>

                    {/* Ordered Class / Sheet list */}
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        Class &amp; Lecture Sequence
                      </p>
                      {batch.lessons.map((lesson) => {
                        const isDone = completedTopicsSet.has(lesson.slug);
                        const matchedSheet = overview?.topics.find(
                          (t) => t.slug === lesson.slug
                        );
                        return (
                          <button
                            key={lesson.slug}
                            type="button"
                            disabled={!matchedSheet}
                            onClick={() => matchedSheet && openLectureSheet(matchedSheet)}
                            className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                                  isDone
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {isDone ? "✓" : lesson.step}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">
                                  {lesson.title}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {lesson.subject} &bull; {lesson.chaptersCount} ch &bull;{" "}
                                  {lesson.estimatedMinutes}m
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                          </button>
                        );
                      })}
                    </div>

                    {batch.matchingArchives.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500">
                          Past Archives:
                        </span>
                        {batch.matchingArchives.map((series) => (
                          <Link
                            key={series}
                            href={`/practice?mode=archive&examSeries=${encodeURIComponent(
                              series
                            )}`}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-emerald-400 hover:text-emerald-800"
                          >
                            {series}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    <Link
                      href={`/practice?examTrack=${encodeURIComponent(
                        batch.examTrack
                      )}&limit=30&autostart=1`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Start Batch Mock Test</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("routine");
                        handleSelectRoutineTrack(batch.trackKey);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      <span>30-Day Plan</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: GUIDED 30-DAY STUDY ROUTINE */}
      {activeTab === "routine" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-emerald-700" />
                  30-Day Guided Self-Study Routine
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Follow a structured daily study schedule linking each Topic Guru sheet,
                  Past Paper archive, Mistake Clearance, and Final Mock Test.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STUDY_TRACKS.map((tr) => (
                  <button
                    key={tr}
                    type="button"
                    onClick={() => handleSelectRoutineTrack(tr)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                      routineTrack === tr
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tr}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Your Routine Completion</span>
                <span>
                  {completedDaysSet.size} / 30 Days ({routinePercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${routinePercent}%` }}
                />
              </div>
            </div>
          </div>

          {loadingRoutine ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Loading {routineTrack} 30-day routine...
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(routineData?.days ?? []).map((item) => {
                const done = completedDaysSet.has(item.day);
                const matchingSheet = item.topicSlug
                  ? overview?.topics.find((t) => t.slug === item.topicSlug)
                  : undefined;

                return (
                  <div
                    key={item.day}
                    className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-3 transition-colors ${
                      done
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-white">
                            Day {item.day}
                          </span>
                          <span className="text-emerald-800">{item.phase}</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.focusSummary}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleRoutineDay(item.day)}
                        aria-label={`Mark Day ${item.day} completed`}
                        className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                          done
                            ? "bg-emerald-700 text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {done ? "Done ✓" : "Mark Done"}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                      {item.actionType === "topic" && matchingSheet && (
                        <button
                          type="button"
                          onClick={() => openLectureSheet(matchingSheet)}
                          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Read Sheet</span>
                        </button>
                      )}
                      {item.actionType === "topic" && (
                        <Link
                          href={`/practice?subject=${encodeURIComponent(
                            item.practiceSubject
                          )}&limit=10&autostart=1`}
                          className="ml-auto font-bold text-slate-700 hover:text-emerald-800"
                        >
                          Take 10-Q Drill &rarr;
                        </Link>
                      )}
                      {item.actionType === "archive" && item.examSeries && (
                        <Link
                          href={`/practice?mode=archive&examSeries=${encodeURIComponent(
                            item.examSeries
                          )}`}
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          Open Job Solution Paper &rarr;
                        </Link>
                      )}
                      {item.actionType === "mistakes" && (
                        <Link
                          href="/practice?mode=mistakes"
                          className="font-bold text-rose-700 hover:underline"
                        >
                          Open Mistake Vault &rarr;
                        </Link>
                      )}
                      {item.actionType === "search" && (
                        <Link
                          href="/practice?mode=search"
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          Open Smart MCQ Search &rarr;
                        </Link>
                      )}
                      {item.actionType === "mock" && (
                        <Link
                          href={`/practice?examTrack=${encodeURIComponent(
                            item.examTrack
                          )}&limit=25&autostart=1`}
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          Launch Timed Model Exam &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: LIVE CURRENT AFFAIRS */}
      {activeTab === "affairs" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-700" />
                  Live Bangladesh &amp; Global Current Affairs Digest
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Auto-classified by BCS/Bank GK topics (Bangladesh Affairs, Economy &amp;
                  Banking, International, Science &amp; ICT, Governance).
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncCurrentAffairs}
                disabled={syncingNews}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw
                  className={`h-4 w-4 ${syncingNews ? "animate-spin" : ""}`}
                />
                <span>{syncingNews ? "Syncing Feeds..." : "Sync Live News Now"}</span>
              </button>
            </div>

            {syncNotice && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900">
                {syncNotice}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchFilteredAffairs(topic, language, affairsQuery);
                }}
                className="relative flex-1 flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={affairsQuery}
                    onChange={(e) => setAffairsQuery(e.target.value)}
                    placeholder="Search Bangladesh Bank, GDP, summit, Prothom Alo, UN..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                >
                  Filter
                </button>
              </form>

              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 self-start">
                {[
                  { id: "All", label: "All Langs" },
                  { id: "en", label: "English" },
                  { id: "bn", label: "বাংলা" },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      const nextLang = l.id as "All" | "en" | "bn";
                      setLanguage(nextLang);
                      fetchFilteredAffairs(topic, nextLang, affairsQuery);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                      language === l.id
                        ? "bg-white text-emerald-800 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {AFFAIRS_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTopic(t);
                    fetchFilteredAffairs(t, language, affairsQuery);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                    topic === t
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {loadingAffairs ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Loading live Current Affairs headlines...
            </div>
          ) : affairsItems.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              No headlines match that filter yet. Click &quot;Sync Live News Now&quot; to
              fetch fresh feeds.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {affairsItems.map((item) => (
                <article
                  key={item._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800">
                        {item.topic}
                      </span>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="rounded bg-slate-100 px-2 py-0.5 uppercase">
                          {item.language}
                        </span>
                        <span>{formatBdDateTime(item.publishedDate)}</span>
                      </div>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {item.summary}
                      </p>
                    )}
                    {item.examRelevanceNote && (
                      <p className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-[11px] font-medium text-slate-700">
                        <span className="font-bold text-emerald-800">Exam Focus:</span>{" "}
                        {item.examRelevanceNote}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-500">
                      {item.sourceName}
                    </span>
                    {safeExternalHref(item.url, "") ? (
                      <a
                        href={safeExternalHref(item.url, "")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        <span>Read Original</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="font-semibold text-slate-400">
                        Verified Digest
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB: WRITTEN EXAM, TYPING SPEED SIMULATOR & VIVA VOCE PREP */}
      {activeTab === "written-viva" && (
        <section className="space-y-6">
          <WrittenTypingVivaLab />
        </section>
      )}

      {/* TAB 4: WHAT TO STUDY & BOOKLIST */}
      {activeTab === "books" && (
        <section className="space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-700" />
                  What to Study for Bangladesh Govt Jobs (4-Pillar Syllabus Map)
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Across BCS, Bank, Primary Teacher, NTRCA, and Ministry exams, ~85% of the
                  syllabus overlaps in these 4 core subjects.
                </p>
              </div>
              <Link
                href="/learn"
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Open 26 A–Z Guides &rarr;
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {CORE_SUBJECT_PILLARS.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {pillar.title}
                    </h3>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      {pillar.marksWeight}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {pillar.whatToCover.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {["All", "All Tracks", ...STUDY_TRACKS].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBookTrack(t)}
                    className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${
                      bookTrack === t
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Filter books, NCTB, Digest..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {booksList.map((book) => (
                <article
                  key={book._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-bold">
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-indigo-800">
                        {book.examTrack}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 ${
                          book.priority === "Must-Read Core"
                            ? "bg-emerald-100 text-emerald-800"
                            : book.priority === "High-Yield Practice"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {book.priority}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {book.resourceType} &bull; {book.subject}
                      </p>
                      <h3 className="mt-1 text-base font-extrabold text-slate-900 leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {book.authorOrPublisher}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {book.whyStudy}
                    </p>

                    {book.keyTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {book.keyTopics.map((topicTag) => (
                          <span
                            key={topicTag}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            {topicTag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                      <BookMarked className="h-3.5 w-3.5 text-emerald-700" />
                      Core Reading
                    </span>
                    {safeExternalHref(book.officialUrl, "") ? (
                      <a
                        href={safeExternalHref(book.officialUrl, "")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <Link
                        href="/practice"
                        className="font-bold text-emerald-700 hover:underline"
                      >
                        Practice Topic &rarr;
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: MODEL TESTS & PAST PAPER JOB SOLUTIONS */}
      {activeTab === "model-tests" && (
        <section className="space-y-8">
          {/* Past Exam Job Solution Archive Cards */}
          {(overview?.pastPapers?.length ?? 0) > 0 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5 text-emerald-700" />
                    Past Exam &ldquo;Job Solution&rdquo; Archives
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Read authentic past papers with full explanations or launch them directly as timed tests.
                  </p>
                </div>
                <Link
                  href="/practice?mode=archive"
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Browse Full Archive &rarr;
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {overview?.pastPapers.map((paper) => (
                  <article
                    key={paper.examSeries}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <span className="inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
                        {paper.examTrack}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {paper.examSeries}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">
                        {paper.count} solved questions with explanations
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/practice?mode=archive&examSeries=${encodeURIComponent(
                          paper.examSeries
                        )}`}
                        className="flex-1 text-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
                      >
                        Read Solutions
                      </Link>
                      <Link
                        href={`/practice?examSeries=${encodeURIComponent(
                          paper.examSeries
                        )}&limit=${paper.count}&autostart=1`}
                        className="flex-1 text-center rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                      >
                        Take Timed
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Timed Model Test Presets */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-700" />
                  Timed Model Tests &amp; Question Banks
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pick a track below to launch a timed, server-graded test inside MCQ Arena with real negative marking.
                </p>
              </div>
              <Link
                href="/practice"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
              >
                Open Full MCQ Arena &rarr;
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(overview?.modelTests ?? []).map((test) => {
                const query = new URLSearchParams({
                  examTrack: test.examTrack,
                  subject: test.subject,
                  limit: String(test.questionLimit),
                  autostart: "1",
                });

                return (
                  <article
                    key={test.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-rose-800">
                          {test.badge}
                        </span>
                        <span className="text-slate-500">
                          {test.durationMinutes} min target
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {test.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {test.subtitle}
                      </p>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1 text-[11px] text-slate-700">
                        <p>
                          <strong>Available Portal Qs:</strong>{" "}
                          {test.availableQuestions} (launching {test.questionLimit}{" "}
                          randomized Qs)
                        </p>
                        <p>
                          <strong>Official Pattern:</strong> {test.officialPattern}
                        </p>
                        <p>
                          <strong>Negative Marking:</strong> {test.negativeMarking}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/practice?${query.toString()}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      <span>Launch Model Test</span>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
      </div>

      <TopicSheetDrawer
        topic={selectedTopic}
        isCompleted={
          selectedTopic ? completedTopicsSet.has(selectedTopic.slug) : false
        }
        onToggleComplete={handleToggleTopicDone}
        onClose={handleCloseTopic}
      />
    </>
  );
}
