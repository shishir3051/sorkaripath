"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  MessageSquare,
  Minimize2,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  apiFetch,
  formatNoticeDate,
  safeExternalHref,
} from "@/lib/api";
import { OriginBadge, RecordTypeBadge } from "@/components/ui/Badges";
import type { JobOrigin, RecordType } from "@/lib/types";

interface MatchedAiCircular {
  _id: string;
  slug: string;
  title: string;
  titleBn?: string;
  origin: JobOrigin;
  recordType: RecordType;
  category: string;
  organization: string;
  organizationShort: string;
  publishedDate: string;
  publishedDateRaw?: string;
  deadlineDate?: string | null;
  deadlineRaw?: string;
  vacancies: string;
  applicationFee: string;
  applyUrl?: string;
  pdfUrl?: string;
  aiExtracted?: boolean;
}

interface AiDiscoverResponse {
  query: string;
  answerEn: string;
  answerBn?: string;
  highlights: string[];
  matchedCirculars: MatchedAiCircular[];
  followUpQueries: string[];
  meta: {
    modelUsed: string;
    keySlotUsed?: number;
    totalKeys?: number;
    groundedCount: number;
    sourcesRefreshed: number;
    checkedSourceNames: string[];
    generatedAt: string;
  };
  cached?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text?: string;
  result?: AiDiscoverResponse;
  error?: string;
}

const PRESET_PROMPTS = [
  "Bangladesh Post Office circular fee, posts & deadline",
  "Latest BD govt job circulars published right now",
  "Primary Assistant Teacher / NTRCA latest notices",
  "DG Food, LGED & Bangladesh Railway recent circulars",
];

const AI_CHAT_OPEN_EVENT = "sorkaripath:open-ai-chat";

export function openAiAssistantChat(query?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ query?: string }>(AI_CHAT_OPEN_EVENT, {
      detail: { query },
    })
  );
}

export function AiCircularAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [liveRefresh, setLiveRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(0);

  const nextId = () => {
    seqRef.current += 1;
    return `msg-${seqRef.current}`;
  };

  const runDiscover = useCallback(
    async (text: string, refresh = liveRefresh) => {
      const clean = text.trim();
      if (clean.length < 2) return;

      const userMsg: ChatMessage = {
        id: nextId(),
        role: "user",
        text: clean,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await apiFetch<AiDiscoverResponse>("/ai/discover", {
          method: "POST",
          body: JSON.stringify({ query: clean, liveRefresh: refresh }),
        });
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", result: res },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            error:
              err instanceof Error
                ? err.message
                : "Failed to run Gemini AI search",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [liveRefresh]
  );

  useEffect(() => {
    function handleOpenEvent(e: Event) {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      setOpen(true);
      const q = detail?.query?.trim();
      if (q && q.length >= 2) {
        void runDiscover(q, true);
      }
    }

    window.addEventListener(AI_CHAT_OPEN_EVENT, handleOpenEvent);
    return () => window.removeEventListener(AI_CHAT_OPEN_EVENT, handleOpenEvent);
  }, [runDiscover]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(focusTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !scrollBodyRef.current) return;
    scrollBodyRef.current.scrollTop = scrollBodyRef.current.scrollHeight;
  }, [open, messages, loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || input.trim().length < 2) return;
    void runDiscover(input, liveRefresh);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Gemini AI Live Circular Chat"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-700 to-teal-800 px-4 py-3 text-white shadow-xl shadow-emerald-950/25 ring-2 ring-white/80 hover:from-emerald-800 hover:to-teal-900 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
      >
        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
          <MessageSquare className="h-3.5 w-3.5 text-emerald-100" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-800" />
        </span>
        <span className="text-xs sm:text-sm font-extrabold tracking-tight">
          Ask Gemini AI
        </span>
        {messages.length > 0 && (
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
            {messages.filter((m) => m.role === "user").length}
          </span>
        )}
      </button>
    );
  }

  return (
    <section
      aria-label="Gemini AI Live Circular Chat"
      className="fixed inset-x-3 bottom-3 z-50 flex h-[min(82dvh,640px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/25 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:max-w-[calc(100vw-3rem)]"
    >
      {/* Floating Chat Header */}
      <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-emerald-800 to-teal-900 px-4 py-3 text-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Sparkles className="h-4 w-4 text-emerald-200" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold truncate">
              Gemini AI Circular Chat
            </h2>
            <p className="text-[11px] text-emerald-100/90 truncate">
              Gemini 4 + Live .gov.bd Web &amp; PDFs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              disabled={loading}
              title="Clear chat"
              aria-label="Clear chat conversation"
              className="rounded-lg p-1.5 text-emerald-100 hover:bg-white/15 hover:text-white disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Minimize chat"
            aria-label="Minimize chat window"
            className="rounded-lg p-1.5 text-emerald-100 hover:bg-white/15 hover:text-white cursor-pointer"
          >
            <Minimize2 className="h-4 w-4 hidden sm:block" />
            <X className="h-4 w-4 sm:hidden" />
          </button>
        </div>
      </div>

      {/* Live Web Toggle Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-emerald-50/50 px-4 py-2 text-[11px] shrink-0">
        <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={liveRefresh}
            onChange={(e) => setLiveRefresh(e.target.checked)}
            className="accent-emerald-700"
          />
          <Globe className="h-3.5 w-3.5 text-emerald-700" />
          <span>Check Live .gov.bd Web First</span>
        </label>
        <span className="font-bold text-emerald-800">40 Official Portals</span>
      </div>

      {/* Scrollable Chat Thread */}
      <div
        ref={scrollBodyRef}
        className="flex-1 overflow-y-auto bg-slate-50/70 p-3.5 sm:p-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 leading-relaxed shadow-xs">
                Ask me about any Bangladesh government job circular, total
                vacancies, Teletalk fee, age limit, or deadline. I refresh{" "}
                <code>.gov.bd</code> notice boards live and read official PDFs.
              </div>
            </div>

            <div className="space-y-1.5 pl-9">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Try asking:
              </p>
              <div className="flex flex-col gap-1.5">
                {PRESET_PROMPTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={loading}
                    onClick={() => void runDiscover(preset, liveRefresh)}
                    className="text-left rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-700 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-white shadow-xs">
                  {msg.text}
                </div>
              </div>
            );
          }

          if (msg.error) {
            return (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                  {msg.error}
                </div>
              </div>
            );
          }

          const result = msg.result;
          if (!result) return null;

          return (
            <div key={msg.id} className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mt-0.5">
                <Bot className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-3.5 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-white">
                    {result.meta.modelUsed}
                  </span>
                  {(result.meta.totalKeys ?? 0) > 1 && result.meta.keySlotUsed && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-800">
                      Key #{result.meta.keySlotUsed}/{result.meta.totalKeys}
                    </span>
                  )}
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                    {result.meta.groundedCount} records
                  </span>
                  {result.meta.sourcesRefreshed > 0 && (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-teal-800">
                      Live: {result.meta.checkedSourceNames.join(", ")}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-medium">
                    {result.answerEn}
                  </p>
                  {result.answerBn && (
                    <p className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2 text-xs text-emerald-950 leading-relaxed">
                      {result.answerBn}
                    </p>
                  )}
                </div>

                {result.highlights?.length > 0 && (
                  <ul className="space-y-1 text-[11px] text-slate-700">
                    {result.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {result.matchedCirculars?.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Matched Official Circulars
                    </p>
                    <div className="space-y-2">
                      {result.matchedCirculars.map((item) => {
                        const safePdf = safeExternalHref(item.pdfUrl, "");
                        return (
                          <div
                            key={item._id}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 space-y-2"
                          >
                            <div className="flex flex-wrap items-center gap-1">
                              <OriginBadge origin={item.origin} />
                              <RecordTypeBadge type={item.recordType} />
                              {item.organizationShort && (
                                <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                  {item.organizationShort}
                                </span>
                              )}
                            </div>

                            <Link
                              href={`/jobs/${item.slug}`}
                              onClick={() => setOpen(false)}
                              className="block text-xs font-bold text-slate-900 hover:text-emerald-700 line-clamp-2"
                            >
                              {item.title}
                            </Link>

                            <p className="text-[10px] text-slate-500">
                              Published:{" "}
                              {formatNoticeDate(
                                item.publishedDate,
                                item.publishedDateRaw
                              )}
                              {item.vacancies &&
                              item.vacancies !== "See Official Circular"
                                ? ` • ${item.vacancies}`
                                : ""}
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <Link
                                href={`/jobs/${item.slug}`}
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-800"
                              >
                                <span>
                                  {item.aiExtracted
                                    ? "View AI Details"
                                    : "Read PDF with AI"}
                                </span>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                              {safePdf && (
                                <a
                                  href={safePdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                                >
                                  <FileText className="h-3 w-3 text-rose-600" />
                                  <span>PDF</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {result.followUpQueries?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-100">
                    {result.followUpQueries.map((fq) => (
                      <button
                        key={fq}
                        type="button"
                        disabled={loading}
                        onClick={() => void runDiscover(fq, false)}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 cursor-pointer text-left"
                      >
                        {fq}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600">
              Checking live .gov.bd boards &amp; Gemini AI...
            </div>
          </div>
        )}
      </div>

      {/* Chat Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about any BD govt circular..."
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length < 2}
          aria-label="Send message to Gemini AI"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-45 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </section>
  );
}
