"use client";

import { useImperativeHandle, useRef, useState } from "react";
import type { Ref } from "react";
import {
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ListOrdered,
  Loader2,
  Sparkles,
  Table2,
  XCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { McqQuestion, StudyTopic } from "@/lib/types";

interface TutorRuleStep {
  stepNumber: number;
  ruleTitle: string;
  formula: string;
  exampleHeader: string;
  breakdownLines: string[];
  moreExamples: string[];
}

interface TutorSummaryTable {
  title: string;
  headers: string[];
  rows: string[][];
}

interface TutorResult {
  topicTitle: string;
  subject: string;
  explanationEn: string;
  explanationBn: string;
  ruleSteps?: TutorRuleStep[];
  summaryTable?: TutorSummaryTable | null;
  keyPoints: string[];
  workedExamples: Array<{ label: string; detail: string }>;
  memoryTip: string;
  followUpQuestions: string[];
  meta?: {
    modelUsed: string;
    keySlotUsed: number;
    totalKeys: number;
  };
}

function formatSummaryTableTitle(rawTitle?: string): string {
  const trimmed = rawTitle?.trim() ?? "";
  if (!trimmed) return "সংক্ষেপে মনে রাখার চার্ট";
  return trimmed.includes("সংক্ষেপে মনে রাখার চার্ট")
    ? trimmed
    : `সংক্ষেপে মনে রাখার চার্ট — ${trimmed}`;
}

function TutorRuleStepsSection({ steps }: { steps: TutorRuleStep[] }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
        <ListOrdered className="h-4 w-4 text-indigo-600 shrink-0" />
        <span>ধাপে ধাপে সূত্র ও বিশ্লেষণ (Step-by-Step Rule Breakdown)</span>
      </p>
      <div className="space-y-2.5">
        {steps.map((step, sIdx) => {
          const breakdownLines = (step.breakdownLines ?? []).filter(
            (line) => line.trim().length > 0
          );
          const moreExamples = (step.moreExamples ?? []).filter(
            (ex) => ex.trim().length > 0
          );

          return (
            <div
              key={`${step.stepNumber}-${sIdx}`}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-[11px] font-extrabold text-white">
                    {step.stepNumber || sIdx + 1}
                  </span>
                  <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 font-bangla">
                    {step.ruleTitle}
                  </h5>
                </div>
                {step.formula?.trim() && (
                  <code className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] sm:text-xs font-bold text-indigo-900 font-mono whitespace-pre-wrap">
                    {step.formula}
                  </code>
                )}
              </div>

              {step.exampleHeader?.trim() && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs sm:text-sm font-bold text-emerald-950 font-bangla">
                  <span className="text-emerald-800 mr-1.5">উদাহরণ:</span>
                  <span>{step.exampleHeader}</span>
                </div>
              )}

              {breakdownLines.length > 0 && (
                <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 space-y-1.5">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-bangla">
                    বিশ্লেষণ:
                  </p>
                  <ol className="space-y-1 text-xs sm:text-sm text-slate-800 leading-relaxed font-bangla">
                    {breakdownLines.map((line, lIdx) => (
                      <li key={lIdx} className="flex items-start gap-2">
                        <span
                          className="mt-0.5 text-indigo-600 font-bold shrink-0"
                          aria-hidden="true"
                        >
                          &rarr;
                        </span>
                        <span className="whitespace-pre-line">{line}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {moreExamples.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 font-bangla">
                  <span className="text-[11px] font-bold text-slate-600">
                    একইভাবে:
                  </span>
                  {moreExamples.map((ex, eIdx) => (
                    <span
                      key={eIdx}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-800"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TutorSummaryTableCard({ table }: { table: TutorSummaryTable }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 bg-slate-100 px-4 py-2.5 text-xs font-extrabold text-slate-900 font-bangla border-b border-slate-200">
        <Table2 className="h-4 w-4 text-emerald-700 shrink-0" />
        <span>{formatSummaryTableTitle(table.title)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm font-bangla">
          <thead className="bg-emerald-900 text-white">
            <tr>
              {table.headers.map((header, hIdx) => (
                <th
                  key={`${header}-${hIdx}`}
                  className="px-4 py-2.5 font-bold whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {table.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={rIdx % 2 === 1 ? "bg-slate-50/70" : "bg-white"}
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-4 py-2.5 leading-relaxed whitespace-pre-line ${
                      cIdx === 0
                        ? "font-bold text-slate-900"
                        : "text-slate-700"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface GeneratedQuizResult {
  topicTitle: string;
  subject: string;
  examTrack: string;
  questions: (McqQuestion & { correctIndex: number; explanation: string })[];
  meta?: {
    modelUsed: string;
    keySlotUsed: number;
    totalKeys: number;
  };
}

export interface TopicAiLabHandle {
  focusWithPrompt: (prompt: string) => void;
}

export function TopicAiLab({
  topic,
  ref,
}: {
  topic: StudyTopic;
  ref?: Ref<TopicAiLabHandle>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const questionInputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState("");
  const [askingTutor, setAskingTutor] = useState(false);
  const [tutorAction, setTutorAction] = useState<
    "breakdown" | "shortcut" | "ask" | null
  >(null);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [tutorData, setTutorData] = useState<TutorResult | null>(null);

  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<GeneratedQuizResult | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  useImperativeHandle(ref, () => ({
    focusWithPrompt(prompt: string) {
      setQuestion(prompt);
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => questionInputRef.current?.focus(), 220);
    },
  }));

  async function handleAskTutor(
    customQuestion?: string,
    action: "breakdown" | "shortcut" | "ask" = "ask"
  ) {
    const qText = (customQuestion ?? question).trim();
    setTutorAction(action);
    setAskingTutor(true);
    setTutorError(null);
    try {
      const data = await apiFetch<TutorResult>("/ai/study-tutor", {
        method: "POST",
        body: JSON.stringify({
          topicSlug: topic.slug,
          subject: topic.subject,
          question: qText,
        }),
      });
      setTutorData(data);
    } catch (err) {
      setTutorError(
        err instanceof Error ? err.message : "Could not reach Gemini Tutor right now."
      );
    } finally {
      setAskingTutor(false);
      setTutorAction(null);
    }
  }

  async function handleGenerateQuiz() {
    setGeneratingQuiz(true);
    setQuizError(null);
    setSelectedAnswers({});
    try {
      const data = await apiFetch<GeneratedQuizResult>("/ai/generate-mcqs", {
        method: "POST",
        body: JSON.stringify({
          topicSlug: topic.slug,
          subject: topic.subject,
          topicTitle: topic.title,
          examTrack:
            topic.targetTracks?.includes("Bank & Financial") &&
            !topic.targetTracks.includes("BCS")
              ? "Bank Combined"
              : "BCS Preliminary",
          count: 5,
        }),
      });
      setQuizData(data);
    } catch (err) {
      setQuizError(
        err instanceof Error ? err.message : "Failed to generate fresh MCQs."
      );
    } finally {
      setGeneratingQuiz(false);
    }
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = quizData
    ? quizData.questions.filter((q) => selectedAnswers[q._id] === q.correctIndex).length
    : 0;

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-emerald-50/50 p-5 space-y-4 print:hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Gemini AI Mentor &amp; Fresh 5-MCQ Lab
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Ask any doubt on <strong>{topic.title}</strong> or generate 5 brand-new exam
            MCQs grounded in this lecture sheet.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={askingTutor}
            onClick={() =>
              handleAskTutor(
                `Break down every main rule of "${topic.title}" step-by-step with detailed বিশ্লেষণ/derivation and a quick summary chart.`,
                "breakdown"
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
          >
            {askingTutor && tutorAction === "breakdown" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ListOrdered className="h-3.5 w-3.5" />
            )}
            <span>Step-by-Step Breakdown</span>
          </button>

          <button
            type="button"
            disabled={askingTutor}
            onClick={() => handleAskTutor("", "shortcut")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-50 disabled:opacity-60 cursor-pointer"
          >
            {askingTutor && tutorAction === "shortcut" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Lightbulb className="h-3.5 w-3.5" />
            )}
            <span>Shortcut &amp; Traps Summary</span>
          </button>

          <button
            type="button"
            disabled={generatingQuiz}
            onClick={handleGenerateQuiz}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-60 cursor-pointer"
          >
            {generatingQuiz ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>{generatingQuiz ? "Generating 5 MCQs..." : "Generate 5 AI MCQs"}</span>
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskTutor();
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          ref={questionInputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask e.g. 'নে + অন = নয়ন কীভাবে হয়?' or 'Explain Conditional / Profit-Loss step-by-step'"
          className="flex-1 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={askingTutor || question.trim().length < 2}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
        >
          {askingTutor && tutorAction === "ask" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <HelpCircle className="h-3.5 w-3.5" />
          )}
          <span>Ask Gemini Tutor</span>
        </button>
      </form>

      {tutorError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
          {tutorError}
        </p>
      )}

      {tutorData && (
        <div className="rounded-xl border border-indigo-200 bg-white p-4 space-y-3.5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-800">
              {tutorData.topicTitle}
            </p>
            {tutorData.meta && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                {tutorData.meta.modelUsed} • Key {tutorData.meta.keySlotUsed}/
                {tutorData.meta.totalKeys}
              </span>
            )}
          </div>

          {tutorData.explanationBn && (
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 mb-1">
                বাংলা সহজ ব্যাখ্যা ও কৌশল
              </p>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-bangla whitespace-pre-line">
                {tutorData.explanationBn}
              </p>
            </div>
          )}

          {tutorData.explanationEn && (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {tutorData.explanationEn}
            </p>
          )}

          {tutorData.ruleSteps && tutorData.ruleSteps.length > 0 && (
            <TutorRuleStepsSection steps={tutorData.ruleSteps} />
          )}

          {tutorData.summaryTable &&
            (tutorData.summaryTable.headers?.length ?? 0) > 0 &&
            (tutorData.summaryTable.rows?.length ?? 0) > 0 && (
              <TutorSummaryTableCard table={tutorData.summaryTable} />
            )}

          {(tutorData.keyPoints?.length ?? 0) > 0 && (
            <ul className="space-y-1 text-xs text-slate-700 font-bangla">
              {tutorData.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">&bull;</span>
                  <span className="whitespace-pre-line">{pt}</span>
                </li>
              ))}
            </ul>
          )}

          {(tutorData.workedExamples?.length ?? 0) > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {tutorData.workedExamples.map((ex, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs"
                >
                  <p className="font-bold text-slate-900 font-bangla">{ex.label}</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed font-bangla whitespace-pre-line">
                    {ex.detail}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tutorData.memoryTip && (
            <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-950 font-semibold font-bangla whitespace-pre-line">
              Memory Tip: {tutorData.memoryTip}
            </p>
          )}

          {(tutorData.followUpQuestions?.length ?? 0) > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500">Next ask:</span>
              {tutorData.followUpQuestions.map((fq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuestion(fq);
                    handleAskTutor(fq, "ask");
                  }}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-800 hover:bg-indigo-100 cursor-pointer"
                >
                  {fq}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {quizError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
          {quizError}
        </p>
      )}

      {quizData && (
        <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                Fresh AI Practice Set ({quizData.questions.length} MCQs)
              </p>
              <p className="text-[11px] text-slate-500">
                Tap an option to see instant answer &amp; explanation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {answeredCount > 0 && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                  Score: {correctCount} / {answeredCount}
                </span>
              )}
              {quizData.meta && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  {quizData.meta.modelUsed}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {quizData.questions.map((q, qIdx) => {
              const picked = selectedAnswers[q._id];
              const isAnswered = typeof picked === "number";
              return (
                <div
                  key={q._id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5"
                >
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    Q{qIdx + 1}. {q.question}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oIdx) => {
                      const isCorrectOpt = oIdx === q.correctIndex;
                      const isPicked = picked === oIdx;
                      let btnStyle =
                        "border-slate-200 bg-white text-slate-800 hover:bg-slate-100";
                      if (isAnswered) {
                        if (isCorrectOpt) {
                          btnStyle =
                            "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                        } else if (isPicked) {
                          btnStyle =
                            "border-rose-400 bg-rose-50 text-rose-900 font-semibold";
                        } else {
                          btnStyle = "border-slate-200 bg-white text-slate-500";
                        }
                      }
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={isAnswered}
                          onClick={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [q._id]: oIdx,
                            }))
                          }
                          className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors cursor-pointer disabled:cursor-default ${btnStyle}`}
                        >
                          <span>
                            <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                          </span>
                          {isAnswered && isCorrectOpt && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          )}
                          {isAnswered && isPicked && !isCorrectOpt && (
                            <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {isAnswered && (
                    <p className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-emerald-800">Explanation:</strong>{" "}
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
