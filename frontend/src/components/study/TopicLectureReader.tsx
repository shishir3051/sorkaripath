"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  Lightbulb,
  Play,
  Printer,
  Search,
  Sparkles,
  Table2,
  X,
} from "lucide-react";
import {
  HighlightableText,
  jumpToHighlightMark,
  StudyHighlightScope,
} from "@/components/study/StudyHighlightContext";
import {
  StudyHighlightsPanel,
  StudyHighlightToolbar,
} from "@/components/study/StudyHighlightUi";
import { TopicAiLab, type TopicAiLabHandle } from "@/components/study/TopicAiLab";
import type { StudyChapter, StudyHighlight, StudyTopic } from "@/lib/types";

interface TopicLectureReaderProps {
  topic: StudyTopic;
  isCompleted: boolean;
  onToggleComplete: (slug: string) => void;
  onClose: () => void;
  inDrawer?: boolean;
  jumpHighlight?: StudyHighlight | null;
  onJumpHandled?: () => void;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function ChapterPracticeCard({
  chapterIdx,
  sectionLabel,
  index,
  problem,
}: {
  chapterIdx: number;
  sectionLabel: string;
  index: number;
  problem: NonNullable<StudyChapter["practiceProblems"]>[number];
}) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="rounded-xl border border-indigo-200/80 bg-white p-4 space-y-2.5 shadow-2xs">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed font-bangla">
          <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-extrabold text-indigo-800">
            {index + 1}
          </span>
          <HighlightableText
            blockId={`ch-${chapterIdx}-prob-${index}-q`}
            sectionLabel={`${sectionLabel} • অনুশীলনী`}
            text={problem.question}
          />
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {problem.hint && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{showHint ? "ইঙ্গিত লুকান" : "ইঙ্গিত দেখুন (Hint)"}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowSolution((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-indigo-800 cursor-pointer"
        >
          {showSolution ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              <span>সমাধান লুকান</span>
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>ধাপে ধাপে সমাধান ও উত্তর দেখুন</span>
            </>
          )}
        </button>
      </div>

      {problem.hint && (
        <div
          aria-hidden={!showHint}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            showHint
              ? "grid-rows-[1fr] opacity-100 pt-0.5"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-950 font-bangla">
              <strong>ইঙ্গিত:</strong>{" "}
              <HighlightableText
                blockId={`ch-${chapterIdx}-prob-${index}-hint`}
                sectionLabel={`${sectionLabel} • ইঙ্গিত`}
                text={problem.hint}
              />
            </div>
          </div>
        </div>
      )}

      <div
        aria-hidden={!showSolution}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          showSolution
            ? "grid-rows-[1fr] opacity-100 pt-0.5 print:grid-rows-[1fr] print:opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none print:hidden"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-1.5 text-xs sm:text-sm text-emerald-950 font-bangla">
            <div className="space-y-1 leading-relaxed">
              {problem.solution.split("\n").map((line, lineIdx) => (
                <HighlightableText
                  key={lineIdx}
                  as="p"
                  blockId={`ch-${chapterIdx}-prob-${index}-sol-${lineIdx}`}
                  sectionLabel={`${sectionLabel} • সমাধান`}
                  text={line}
                />
              ))}
            </div>
            <p className="pt-1 border-t border-emerald-200 font-extrabold text-emerald-900">
              সঠিক উত্তর:{" "}
              <HighlightableText
                blockId={`ch-${chapterIdx}-prob-${index}-ans`}
                sectionLabel={`${sectionLabel} • উত্তর`}
                text={problem.answer}
              />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TopicLectureReader({
  topic,
  isCompleted,
  onToggleComplete,
  onClose,
  inDrawer = false,
  jumpHighlight = null,
  onJumpHandled,
}: TopicLectureReaderProps) {
  const chapters = topic.chapters ?? [];
  const [focusMode, setFocusMode] = useState(true);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [highlightsPanelOpen, setHighlightsPanelOpen] = useState(false);
  const chapterTopRef = useRef<HTMLDivElement | null>(null);
  const aiLabRef = useRef<TopicAiLabHandle | null>(null);

  const scopeKey = `topic:${topic.slug}`;

  function selectFocusChapter(nextIdx: number) {
    setActiveChapterIdx(nextIdx);
    chapterTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const handleJumpToHighlight = useCallback(
    (hl: StudyHighlight) => {
      const chMatch = hl.blockId.match(/^ch-(\d+)-/);
      if (chMatch) {
        const targetIdx = Number(chMatch[1]);
        if (Number.isFinite(targetIdx) && targetIdx >= 0) {
          setActiveChapterIdx(targetIdx);
        }
      }
      jumpToHighlightMark(hl.id);
    },
    []
  );

  useEffect(() => {
    if (!jumpHighlight || jumpHighlight.scopeKey !== scopeKey) return;
    const needsChapters = jumpHighlight.blockId.startsWith("ch-");
    if (needsChapters && chapters.length === 0) return;

    queueMicrotask(() => {
      handleJumpToHighlight(jumpHighlight);
      onJumpHandled?.();
    });
  }, [
    jumpHighlight,
    scopeKey,
    chapters.length,
    handleJumpToHighlight,
    onJumpHandled,
  ]);

  const handleAskAi = useCallback((prompt: string, highlightId?: string) => {
    aiLabRef.current?.focusWithPrompt(prompt, highlightId);
  }, []);

  const safeIdx = Math.min(activeChapterIdx, Math.max(0, chapters.length - 1));
  const visibleChapters =
    focusMode && chapters.length > 0
      ? [{ chapter: chapters[safeIdx], idx: safeIdx }]
      : chapters.map((chapter, idx) => ({ chapter, idx }));

  const isLoadingChapters =
    !topic.chapters && (topic.chapterCount ?? 0) > 0;

  const quizSubject =
    topic.mcqSubjectFilter && topic.mcqSubjectFilter !== "All"
      ? topic.mcqSubjectFilter
      : topic.subject;

  const annotationViewKey =
    focusMode && chapters.length > 0 ? `ch-${safeIdx}` : "all";

  return (
    <StudyHighlightScope
      scopeKey={scopeKey}
      scopeTitle={topic.title}
      annotationViewKey={annotationViewKey}
      onAskAi={handleAskAi}
      className={
        inDrawer
          ? "bg-white p-5 sm:p-7 space-y-6 print:p-0"
          : "rounded-2xl border-2 border-emerald-600/30 bg-white p-6 sm:p-8 shadow-md space-y-6"
      }
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-emerald-800">
              {topic.subject}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-slate-700 font-bangla">
              {topic.unit}
            </span>
            {chapters.length > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-0.5 text-amber-900">
                {chapters.length} Full Chapters
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {topic.estimatedMinutes} min read
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-bangla">
            <HighlightableText
              blockId="title"
              sectionLabel="Topic Title"
              text={topic.title}
            />
          </h2>
          <HighlightableText
            as="p"
            blockId="summary"
            sectionLabel="Overview Summary"
            text={topic.highYieldSummary}
            className="text-sm text-slate-600 leading-relaxed font-bangla"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => onToggleComplete(topic.slug)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold cursor-pointer ${
              isCompleted
                ? "bg-emerald-700 text-white"
                : "border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isCompleted ? "Completed" : "Mark Complete"}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF</span>
          </button>
          {!inDrawer && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close lecture sheet"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Highlighter Marker Toolbar & My Highlights Panel */}
      <div className="space-y-3 print:hidden">
        <StudyHighlightToolbar
          scopeKey={scopeKey}
          viewKey={annotationViewKey}
          panelOpen={highlightsPanelOpen}
          onTogglePanel={() => setHighlightsPanelOpen((v) => !v)}
        />
        <StudyHighlightsPanel
          scopeKey={scopeKey}
          open={highlightsPanelOpen}
          onJumpToHighlight={handleJumpToHighlight}
          onAskAi={handleAskAi}
        />
      </div>

      {/* Loading skeleton while full chapters fetch */}
      {isLoadingChapters && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3 animate-pulse print:hidden">
          <p className="text-xs font-bold text-emerald-800">
            Loading {topic.chapterCount} NCTB Bangla chapters &amp; practice problems...
          </p>
          <div className="h-4 w-2/3 rounded bg-emerald-200/70" />
          <div className="h-24 w-full rounded-xl bg-slate-200/70" />
        </div>
      )}

      {/* Elaborate Chapters Lecture View */}
      {chapters.length > 0 && (
        <div ref={chapterTopRef} className="space-y-5 scroll-mt-4">
          {/* Chapter Index & Reading Mode Bar */}
          <div
            data-hl-ignore="true"
            className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3 print:hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-emerald-700" />
                সম্পূর্ণ লেকচার সূচিপত্র ({chapters.length}টি অধ্যায় / সেকশন)
              </p>

              {chapters.length > 1 && (
                <div className="inline-flex rounded-lg border border-emerald-200 bg-white p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setFocusMode(true)}
                    className={`rounded-md px-2.5 py-1 transition-all duration-200 ease-in-out cursor-pointer ${
                      focusMode
                        ? "bg-emerald-700 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ১টি করে পড়ুন (Focus)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusMode(false)}
                    className={`rounded-md px-2.5 py-1 transition-all duration-200 ease-in-out cursor-pointer ${
                      !focusMode
                        ? "bg-emerald-700 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    সব অধ্যায় একসাথে
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {chapters.map((ch, idx) => {
                const cleanTitle = ch.heading.replace(
                  /^অধ্যায়\s+\S+:\s*|^Chapter\s+\d+:\s*/i,
                  ""
                );
                const isActiveFocus = focusMode && safeIdx === idx;
                if (focusMode) {
                  return (
                    <button
                      key={ch.heading}
                      type="button"
                      onClick={() => setActiveChapterIdx(idx)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer font-bangla ${
                        isActiveFocus
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-100"
                      }`}
                    >
                      {idx + 1}. {cleanTitle}
                    </button>
                  );
                }

                return (
                  <a
                    key={ch.heading}
                    href={`#topic-chapter-${idx}`}
                    className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-700 hover:text-white transition-colors font-bangla"
                  >
                    {idx + 1}. {cleanTitle}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            {visibleChapters.map(({ chapter: ch, idx }) => {
              const paragraphs = splitParagraphs(ch.explanation);

              return (
                <section
                  key={`${ch.heading}-${focusMode ? "focus" : "all"}`}
                  id={`topic-chapter-${idx}`}
                  className="animate-soft-reveal rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-5 scroll-mt-24"
                >
                  {/* Section Title & Elaborate Concept Walkthrough */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-block rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Section {idx + 1} of {chapters.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          aiLabRef.current?.focusWithPrompt(
                            `Break down "${ch.heading}" (${topic.title}) step-by-step with detailed বিশ্লেষণ/derivation, worked examples, common exam traps, and a quick-memory summary chart.`
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-800 transition-colors duration-200 ease-in-out hover:bg-indigo-50 cursor-pointer print:hidden"
                      >
                        <Sparkles className="h-3 w-3 text-indigo-600" />
                        <span>Ask AI on this section</span>
                      </button>
                    </div>
                    <h3 className="text-base sm:text-xl font-extrabold text-slate-900 font-bangla">
                      <HighlightableText
                        blockId={`ch-${idx}-heading`}
                        sectionLabel={ch.heading}
                        text={ch.heading}
                      />
                    </h3>
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 space-y-3">
                      {paragraphs.map((para, pIdx) => (
                        <HighlightableText
                          key={pIdx}
                          as="p"
                          blockId={`ch-${idx}-exp-${pIdx}`}
                          sectionLabel={ch.heading}
                          text={para}
                          className="text-sm sm:text-[15px] text-slate-800 leading-[1.8] font-bangla"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Formula & Rule Matrix */}
                  {ch.formulaBox && ch.formulaBox.length > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                        <Calculator className="h-4 w-4 text-emerald-700" />
                        মূল সূত্র ও সংক্ষিপ্ত নিয়মাবলি (Key Formulas &amp; Rules)
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {ch.formulaBox.map((item, fIdx) => (
                          <div
                            key={`${item.label}-${item.formula}`}
                            className="rounded-xl border border-emerald-200/80 bg-white p-3.5 space-y-1"
                          >
                            <HighlightableText
                              as="p"
                              blockId={`ch-${idx}-formula-${fIdx}-label`}
                              sectionLabel={`${ch.heading} • সূত্র`}
                              text={item.label}
                              className="text-xs font-extrabold text-emerald-800 font-bangla"
                            />
                            <HighlightableText
                              as="p"
                              blockId={`ch-${idx}-formula-${fIdx}-expr`}
                              sectionLabel={`${ch.heading} • সূত্র`}
                              text={item.formula}
                              className="text-sm font-bold text-slate-900 font-mono bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100"
                            />
                            {item.note && (
                              <HighlightableText
                                as="p"
                                blockId={`ch-${idx}-formula-${fIdx}-note`}
                                sectionLabel={`${ch.heading} • সূত্র`}
                                text={item.note}
                                className="text-[11px] text-slate-600 leading-relaxed font-bangla"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comparison Table */}
                  {ch.comparisonTable && ch.comparisonTable.headers?.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      {ch.comparisonTable.title && (
                        <div className="flex items-center gap-1.5 bg-slate-100 px-4 py-2.5 text-xs font-extrabold text-slate-900 font-bangla border-b border-slate-200">
                          <Table2 className="h-4 w-4 text-emerald-700" />
                          <HighlightableText
                            blockId={`ch-${idx}-tbl-title`}
                            sectionLabel={`${ch.heading} • ছক`}
                            text={ch.comparisonTable.title}
                          />
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm font-bangla">
                          <thead className="bg-emerald-900 text-white">
                            <tr>
                              {ch.comparisonTable.headers.map((header, hIdx) => (
                                <th
                                  key={`${hIdx}-${header}`}
                                  className="px-4 py-2.5 font-bold whitespace-nowrap"
                                >
                                  <HighlightableText
                                    blockId={`ch-${idx}-tbl-h-${hIdx}`}
                                    sectionLabel={`${ch.heading} • ছক হেডার`}
                                    text={header}
                                  />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {ch.comparisonTable.rows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className={rIdx % 2 === 1 ? "bg-slate-50/70" : "bg-white"}
                              >
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`px-4 py-2.5 leading-relaxed ${
                                      cIdx === 0
                                        ? "font-bold text-slate-900"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    <HighlightableText
                                      blockId={`ch-${idx}-tbl-${rIdx}-${cIdx}`}
                                      sectionLabel={`${ch.heading} • ছক`}
                                      text={cell}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Core Detailed Points */}
                  {ch.points && ch.points.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        বিস্তারিত নিয়ম ও ধাপে ধাপে আলোচনা (Concept Breakdown)
                      </p>
                      <ul className="space-y-2.5">
                        {ch.points.map((pt, ptIdx) => (
                          <HighlightableText
                            key={pt}
                            as="li"
                            blockId={`ch-${idx}-pt-${ptIdx}`}
                            sectionLabel={ch.heading}
                            text={pt}
                            className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 text-xs sm:text-sm text-slate-800 leading-[1.75] font-bangla"
                          />
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Step-by-step Worked Examples */}
                  {ch.workedExamples && ch.workedExamples.length > 0 && (
                    <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 sm:p-5 space-y-3">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-teal-900">
                        ধাপে ধাপে সমাধানসহ উদাহরণ (Worked Examples &amp; Exam Distinctions)
                      </p>
                      <div className="space-y-2.5">
                        {ch.workedExamples.map((ex, exIdx) => (
                          <div
                            key={`${exIdx}-${ex.slice(0, 32)}`}
                            className="rounded-xl border border-teal-200/80 bg-white p-3.5 text-xs sm:text-sm text-teal-950 leading-[1.75] space-y-1 font-bangla"
                          >
                            {ex.split("\n").map((line, lIdx) => (
                              <HighlightableText
                                key={lIdx}
                                as="p"
                                blockId={`ch-${idx}-ex-${exIdx}-${lIdx}`}
                                sectionLabel={`${ch.heading} • উদাহরণ`}
                                text={line}
                                className={lIdx === 0 ? "font-bold text-slate-900" : ""}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common Mistakes & Exam Traps */}
                  {ch.commonMistakes && ch.commonMistakes.length > 0 && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-2">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        সতর্কতা: পরীক্ষায় সচরাচর ভুল ও ফাঁদ (Common Traps)
                      </p>
                      <ul className="space-y-1.5 text-xs sm:text-sm text-rose-950 leading-relaxed font-bangla">
                        {ch.commonMistakes.map((mistake, mIdx) => (
                          <li key={mistake}>
                            &bull;{" "}
                            <HighlightableText
                              blockId={`ch-${idx}-mistake-${mIdx}`}
                              sectionLabel={`${ch.heading} • সতর্কতা`}
                              text={mistake}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interactive Practice Problems */}
                  {ch.practiceProblems && ch.practiceProblems.length > 0 && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5 space-y-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                          নিজে সমাধান করুন — অধ্যায়ভিত্তিক অনুশীলনী (Try Yourself)
                        </p>
                        <p className="text-[11px] text-indigo-900/80 mt-0.5 font-bangla">
                          আগে নিজে খাতায় সমাধান করুন, তারপর &ldquo;সমাধান ও উত্তর দেখুন&rdquo; বাটনে ক্লিক করে মিলিয়ে নিন।
                        </p>
                      </div>
                      <div className="space-y-3">
                        {ch.practiceProblems.map((prob, pIdx) => (
                          <ChapterPracticeCard
                            key={`${idx}-${pIdx}`}
                            chapterIdx={idx}
                            sectionLabel={ch.heading}
                            index={pIdx}
                            problem={prob}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {focusMode && chapters.length > 1 && (
            <div className="flex items-center justify-between gap-3 pt-1 print:hidden">
              <button
                type="button"
                disabled={safeIdx === 0}
                onClick={() => selectFocusChapter(Math.max(0, safeIdx - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>পূর্ববর্তী অধ্যায়</span>
              </button>
              <span className="text-xs font-bold text-slate-500">
                Section {safeIdx + 1} / {chapters.length}
              </span>
              <button
                type="button"
                disabled={safeIdx >= chapters.length - 1}
                onClick={() =>
                  selectFocusChapter(Math.min(chapters.length - 1, safeIdx + 1))
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-40 cursor-pointer"
              >
                <span>পরবর্তী অধ্যায়</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Core Exam Facts (Rapid Revision Summary) */}
      {(topic.keyFacts?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            Rapid Revision Capsule &amp; High-Yield Facts
          </h3>
          <ul className="space-y-2.5">
            {topic.keyFacts?.map((fact, fIdx) => (
              <li
                key={fact}
                className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-800 leading-relaxed font-bangla"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-1" />
                <HighlightableText
                  blockId={`fact-${fIdx}`}
                  sectionLabel="Rapid Revision Facts"
                  text={fact}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Memory Tricks & Traps */}
      {(topic.memoryTricks?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 space-y-2.5">
          <h3 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            Shortcuts, Memory Tricks &amp; Common Exam Traps
          </h3>
          <ul className="space-y-1.5 text-xs sm:text-sm text-amber-950/90 font-bangla">
            {topic.memoryTricks?.map((trick, tIdx) => (
              <li key={trick} className="leading-relaxed">
                &bull;{" "}
                <HighlightableText
                  blockId={`trick-${tIdx}`}
                  sectionLabel="Shortcuts & Traps"
                  text={trick}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Examples Table */}
      {(topic.quickExamples?.length ?? 0) > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            Quick Examples &amp; High-Frequency Pairs
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {topic.quickExamples?.map((ex, qIdx) => (
              <div
                key={ex.label}
                className="rounded-xl border border-slate-200 bg-white p-3.5"
              >
                <HighlightableText
                  as="p"
                  blockId={`qex-${qIdx}-label`}
                  sectionLabel="Quick Examples"
                  text={ex.label}
                  className="text-xs font-extrabold text-emerald-800 font-bangla"
                />
                <HighlightableText
                  as="p"
                  blockId={`qex-${qIdx}-detail`}
                  sectionLabel="Quick Examples"
                  text={ex.detail}
                  className="mt-1 text-xs sm:text-sm text-slate-700 leading-relaxed font-bangla"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <TopicAiLab key={topic.slug} topic={topic} ref={aiLabRef} />

      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-xs text-slate-500 font-medium">
          Done reading this sheet? Immediately test your retention on{" "}
          <strong>{quizSubject}</strong> MCQs.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/practice?mode=search&subject=${encodeURIComponent(quizSubject)}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Smart Search Topic Qs</span>
          </Link>
          <Link
            href={`/practice?subject=${encodeURIComponent(
              quizSubject
            )}&limit=15&autostart=1`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Quiz {quizSubject} Now</span>
          </Link>
        </div>
      </div>
    </StudyHighlightScope>
  );
}
