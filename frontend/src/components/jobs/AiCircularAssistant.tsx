"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  HelpCircle,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  Play,
  Send,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  VolumeX,
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

interface MatchedTopicSuggestion {
  slug: string;
  title: string;
  subject: string;
  unit: string;
}

interface AiDiscoverResponse {
  query: string;
  answerEn: string;
  answerBn?: string;
  highlights: string[];
  matchedCirculars: MatchedAiCircular[];
  matchedTopics?: MatchedTopicSuggestion[];
  recommendedPracticeUrl?: string | null;
  recommendedTrack?: string | null;
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

interface TutorChatResponse {
  topicTitle: string;
  subject: string;
  explanationEn: string;
  explanationBn: string;
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

type AssistantMode = "circular" | "tutor";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text?: string;
  result?: AiDiscoverResponse;
  tutorResult?: TutorChatResponse;
  error?: string;
}

const CIRCULAR_PRESETS = [
  "Bangladesh Post Office recruitment: which subjects should I study to crack the exam?",
  "Bangladesh Post Office circular fee, posts & deadline",
  "Latest BD govt job circulars published right now",
  "Primary Assistant Teacher / NTRCA: exam syllabus & latest notices",
];

const TUTOR_PRESETS = [
  "সমাস ও সন্ধি মনে রাখার সহজ শর্টকাট কী?",
  "Bangladesh Constitution Articles 1–47 & 137–141 high-yield points",
  "Profit-Loss & Percentage shortcut formulas with worked examples",
  "Bangladesh Post Office (UPU, PLI, RMS) & Postal GK cheat-sheet",
];

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

type VoiceLang = "en-US" | "bn-BD";

function getSpeechRecognitionCtor(): SpeechRecognitionConstructorLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function buildSpeechErrorText(code?: string): string {
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "Microphone permission blocked. Please allow mic access in your browser address bar and try again.";
  }
  if (code === "no-speech") {
    return "No speech detected. Tap the microphone again and speak clearly.";
  }
  if (code === "audio-capture") {
    return "No microphone found on this device. Connect a mic or type your question.";
  }
  return "Voice recognition could not complete. Tap the microphone to retry or type your question.";
}

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
  const pathname = usePathname() || "/";
  const isStudyRoute =
    pathname.startsWith("/study") ||
    pathname.startsWith("/learn") ||
    pathname.startsWith("/practice");

  const [open, setOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<AssistantMode | null>(null);
  const [input, setInput] = useState("");
  const [liveRefresh, setLiveRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Voice Input & Voice Reply state
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<VoiceLang>("en-US");
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const activeMode: AssistantMode =
    selectedMode ?? (isStudyRoute ? "tutor" : "circular");

  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const seqRef = useRef(0);

  const nextId = () => {
    seqRef.current += 1;
    return `msg-${seqRef.current}`;
  };

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  }, []);

  const speakText = useCallback(
    (primaryEn: string, primaryBn: string | undefined, messageId: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }
      const synth = window.speechSynthesis;
      synth.cancel();

      const voices = synth.getVoices();
      const bnVoice = voices.find((v) => v.lang.toLowerCase().startsWith("bn"));
      const preferBangla =
        (voiceLang === "bn-BD" || !primaryEn.trim()) &&
        Boolean(primaryBn?.trim()) &&
        Boolean(bnVoice);

      const textToSpeak = preferBangla
        ? String(primaryBn || "").trim()
        : String(primaryEn || primaryBn || "").trim();
      if (!textToSpeak) return;

      const utterance = new SpeechSynthesisUtterance(textToSpeak.slice(0, 700));
      if (preferBangla && bnVoice) {
        utterance.voice = bnVoice;
        utterance.lang = bnVoice.lang;
      } else {
        const enVoice = voices.find((v) =>
          v.lang.toLowerCase().startsWith("en")
        );
        if (enVoice) utterance.voice = enVoice;
        utterance.lang = "en-US";
      }
      utterance.rate = 1.02;
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);

      setSpeakingMsgId(messageId);
      synth.speak(utterance);
    },
    [voiceLang]
  );

  const runDiscover = useCallback(
    async (
      text: string,
      refresh = liveRefresh,
      forceMode?: AssistantMode,
      speakReply = false
    ) => {
      const clean = text.trim();
      if (clean.length < 2) return;

      const modeToRun = forceMode ?? activeMode;
      const userMsg: ChatMessage = {
        id: nextId(),
        role: "user",
        text: clean,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setVoiceNotice(null);
      setLoading(true);

      try {
        if (modeToRun === "tutor") {
          const tutorRes = await apiFetch<TutorChatResponse>("/ai/study-tutor", {
            method: "POST",
            body: JSON.stringify({
              subject: "All",
              question: clean,
            }),
          });
          const msgId = nextId();
          setMessages((prev) => [
            ...prev,
            { id: msgId, role: "assistant", tutorResult: tutorRes },
          ]);
          if (speakReply && autoSpeakReplies) {
            speakText(tutorRes.explanationEn, tutorRes.explanationBn, msgId);
          }
        } else {
          const res = await apiFetch<AiDiscoverResponse>("/ai/discover", {
            method: "POST",
            body: JSON.stringify({ query: clean, liveRefresh: refresh }),
          });
          const msgId = nextId();
          setMessages((prev) => [
            ...prev,
            { id: msgId, role: "assistant", result: res },
          ]);
          if (speakReply && autoSpeakReplies) {
            speakText(res.answerEn, res.answerBn, msgId);
          }
        }
      } catch (err) {
        const errText =
          err instanceof Error
            ? err.message
            : "Failed to run Gemini AI request";
        const msgId = nextId();
        setMessages((prev) => [
          ...prev,
          {
            id: msgId,
            role: "assistant",
            error: errText,
          },
        ]);
        if (speakReply && autoSpeakReplies) {
          speakText(errText, undefined, msgId);
        }
      } finally {
        setLoading(false);
      }
    },
    [activeMode, autoSpeakReplies, liveRefresh, speakText]
  );

  const stopVoiceListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore if already stopped
    }
    setIsListening(false);
  }, []);

  const startVoiceListening = useCallback(() => {
    if (loading) return;
    const SpeechCtor = getSpeechRecognitionCtor();
    if (!SpeechCtor) {
      setVoiceNotice(
        "Voice mic requires Chrome, Edge, or Android Chrome. Please type your question."
      );
      return;
    }

    stopSpeaking();
    setVoiceNotice(null);

    try {
      recognitionRef.current?.abort();
    } catch {
      // Ignore stale instance cleanup
    }

    const rec = new SpeechCtor();
    rec.lang = voiceLang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let finalTranscript = "";
    let submitted = false;

    rec.onresult = (event) => {
      let combined = "";
      let isFinal = false;
      for (let i = 0; i < event.results.length; i += 1) {
        const chunk = event.results[i];
        combined += chunk[0]?.transcript || "";
        if (chunk.isFinal) isFinal = true;
      }
      const trimmed = combined.trim();
      setInput(trimmed);
      if (isFinal && trimmed.length >= 2 && !submitted) {
        submitted = true;
        finalTranscript = trimmed;
        setIsListening(false);
        try {
          rec.stop();
        } catch {
          // Ignore stop race
        }
        void runDiscover(trimmed, liveRefresh, undefined, true);
      }
    };

    rec.onerror = (event) => {
      setIsListening(false);
      if (event.error !== "aborted") {
        setVoiceNotice(buildSpeechErrorText(event.error));
      }
    };

    rec.onend = () => {
      setIsListening(false);
      const pending = finalTranscript.trim();
      if (!submitted && pending.length >= 2) {
        submitted = true;
        void runDiscover(pending, liveRefresh, undefined, true);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setVoiceNotice("Could not start microphone. Please retry.");
    }
  }, [liveRefresh, loading, runDiscover, stopSpeaking, voiceLang]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    function handleOpenEvent(e: Event) {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      setOpen(true);
      const q = detail?.query?.trim();
      if (q && q.length >= 2) {
        setSelectedMode("circular");
        void runDiscover(q, true, "circular");
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
        aria-label="Open Gemini AI Live Circular and Study Chat"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-700 to-teal-800 px-4 py-3 text-white shadow-xl shadow-emerald-950/25 ring-2 ring-white/80 hover:from-emerald-800 hover:to-teal-900 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
      >
        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
          <MessageSquare className="h-3.5 w-3.5 text-emerald-100" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-800" />
        </span>
        <span className="text-xs sm:text-sm font-extrabold tracking-tight">
          {isStudyRoute ? "AI Study & Prep" : "Ask AI • Jobs & Study"}
        </span>
        {messages.length > 0 && (
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
            {messages.filter((m) => m.role === "user").length}
          </span>
        )}
      </button>
    );
  }

  const activePresets = activeMode === "tutor" ? TUTOR_PRESETS : CIRCULAR_PRESETS;

  return (
    <section
      aria-label="Gemini AI Study and Live Circular Chat"
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
              Gemini AI — Study &amp; Circulars
            </h2>
            <p className="text-[11px] text-emerald-100/90 truncate">
              Subject Tutor, Exam Prep &amp; Live .gov.bd Web
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (speakingMsgId) stopSpeaking();
              setAutoSpeakReplies((prev) => !prev);
            }}
            title={autoSpeakReplies ? "Auto-voice reply ON" : "Auto-voice reply OFF"}
            aria-label={autoSpeakReplies ? "Disable voice replies" : "Enable voice replies"}
            className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
              autoSpeakReplies
                ? "bg-white/20 text-white"
                : "text-emerald-100/70 hover:bg-white/15 hover:text-white"
            }`}
          >
            {autoSpeakReplies ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                setMessages([]);
              }}
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
            onClick={() => {
              stopVoiceListening();
              stopSpeaking();
              setOpen(false);
            }}
            title="Minimize chat"
            aria-label="Minimize chat window"
            className="rounded-lg p-1.5 text-emerald-100 hover:bg-white/15 hover:text-white cursor-pointer"
          >
            <Minimize2 className="h-4 w-4 hidden sm:block" />
            <X className="h-4 w-4 sm:hidden" />
          </button>
        </div>
      </div>

      {/* Mode Switcher + Live Web Toggle Bar */}
      <div className="border-b border-slate-100 bg-emerald-50/50 px-3.5 py-2 space-y-1.5 shrink-0">
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-white/90 p-1 border border-slate-200">
          <button
            type="button"
            disabled={loading}
            onClick={() => setSelectedMode("tutor")}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
              activeMode === "tutor"
                ? "bg-indigo-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <span>Study &amp; Subject Tutor</span>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setSelectedMode("circular")}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
              activeMode === "circular"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span>Circulars &amp; Prep Plan</span>
          </button>
        </div>

        {activeMode === "circular" && (
          <div className="flex items-center justify-between gap-2 px-1 text-[11px]">
            <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={liveRefresh}
                onChange={(e) => setLiveRefresh(e.target.checked)}
                className="accent-emerald-700"
              />
              <span>Check Live .gov.bd Web First</span>
            </label>
            <span className="font-bold text-emerald-800">40 Official Portals</span>
          </div>
        )}
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
                {activeMode === "tutor" ? (
                  <>
                    Ask any <strong>Bangla, English, Math, GK, ICT or Constitution</strong>{" "}
                    study doubt! I explain rules clearly in <strong>বাংলা + English</strong>{" "}
                    with worked examples &amp; exam shortcuts.
                  </>
                ) : (
                  <>
                    Ask me about any Bangladesh government job circular, fees, or
                    deadlines — or ask <strong>how to prepare &amp; which subjects to
                    study</strong> for Post Office, BCS, Bank, Primary, or Ministry
                    exams!
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pl-9">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Try asking:
              </p>
              <div className="flex flex-col gap-1.5">
                {activePresets.map((preset) => (
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

          const tutor = msg.tutorResult;
          if (tutor) {
            return (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 mt-0.5">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm border border-indigo-200 bg-white p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-bold">
                    <span className="rounded-full bg-indigo-800 px-2 py-0.5 text-white">
                      {tutor.subject}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {tutor.meta && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                          {tutor.meta.modelUsed} • Key #{tutor.meta.keySlotUsed}/
                          {tutor.meta.totalKeys}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          speakingMsgId === msg.id
                            ? stopSpeaking()
                            : speakText(tutor.explanationEn, tutor.explanationBn, msg.id)
                        }
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-800 hover:bg-indigo-100 cursor-pointer"
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <Square className="h-2.5 w-2.5 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900">
                    {tutor.topicTitle}
                  </p>
                  {tutor.explanationBn && (
                    <p className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2 text-xs text-emerald-950 leading-relaxed font-bangla">
                      {tutor.explanationBn}
                    </p>
                  )}
                  {tutor.explanationEn && (
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {tutor.explanationEn}
                    </p>
                  )}
                  {tutor.keyPoints?.length > 0 && (
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {tutor.keyPoints.map((pt) => (
                        <li key={pt} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {tutor.workedExamples?.length > 0 && (
                    <div className="space-y-1.5">
                      {tutor.workedExamples.map((ex, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px]"
                        >
                          <p className="font-bold text-slate-900">{ex.label}</p>
                          <p className="text-slate-600">{ex.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {tutor.memoryTip && (
                    <p className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11px] font-semibold text-amber-950">
                      Tip: {tutor.memoryTip}
                    </p>
                  )}
                  {tutor.followUpQuestions?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                      {tutor.followUpQuestions.map((fq) => (
                        <button
                          key={fq}
                          type="button"
                          disabled={loading}
                          onClick={() => void runDiscover(fq, false, "tutor")}
                          className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-800 hover:bg-indigo-100 cursor-pointer text-left"
                        >
                          {fq}
                        </button>
                      ))}
                    </div>
                  )}
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
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-bold">
                  <div className="flex flex-wrap items-center gap-1.5">
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
                  <button
                    type="button"
                    onClick={() =>
                      speakingMsgId === msg.id
                        ? stopSpeaking()
                        : speakText(result.answerEn, result.answerBn, msg.id)
                    }
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                  >
                    {speakingMsgId === msg.id ? (
                      <>
                        <Square className="h-2.5 w-2.5 fill-current" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3 w-3" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>
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

                {(result.matchedTopics?.length || result.recommendedPracticeUrl) && (
                  <div className="space-y-2 pt-1.5 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Recommended Study Plan Inside SorkariPath</span>
                      </p>
                      {result.recommendedPracticeUrl && (
                        <Link
                          href={result.recommendedPracticeUrl}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-indigo-800"
                        >
                          <Play className="h-2.5 w-2.5" />
                          <span>
                            {result.recommendedTrack || "Practice"} Mock
                          </span>
                        </Link>
                      )}
                    </div>
                    {result.matchedTopics && result.matchedTopics.length > 0 && (
                      <div className="space-y-1.5">
                        {result.matchedTopics.map((topic) => (
                          <Link
                            key={topic.slug}
                            href={`/study?tab=topics&topicSlug=${encodeURIComponent(
                              topic.slug
                            )}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-2.5 py-2 hover:bg-indigo-100/70 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-indigo-950 truncate">
                                {topic.title}
                              </p>
                              <p className="text-[10px] text-indigo-700 truncate">
                                {topic.subject} &bull; {topic.unit}
                              </p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-indigo-700" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
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

      {/* Voice Status & Error Banner */}
      {(isListening || voiceNotice) && (
        <div
          className={`flex items-center justify-between gap-2 border-t px-3.5 py-2 text-[11px] font-semibold shrink-0 ${
            isListening
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <span className="flex items-center gap-1.5 truncate">
            {isListening && (
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping shrink-0" />
            )}
            <span className="truncate">
              {isListening
                ? `Listening (${voiceLang === "bn-BD" ? "বাংলা" : "English"})... Speak now`
                : voiceNotice}
            </span>
          </span>
          {isListening && (
            <button
              type="button"
              onClick={stopVoiceListening}
              className="text-[10px] font-extrabold uppercase underline shrink-0 cursor-pointer"
            >
              Stop
            </button>
          )}
        </div>
      )}

      {/* Chat Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 border-t border-slate-200 bg-white p-3 shrink-0"
      >
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            setVoiceLang((prev) => (prev === "en-US" ? "bn-BD" : "en-US"))
          }
          title="Switch voice recognition language (English / বাংলা)"
          className="h-9 shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-extrabold text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          {voiceLang === "bn-BD" ? "বাংলা" : "EN"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            isListening ? stopVoiceListening() : startVoiceListening()
          }
          title={isListening ? "Stop listening" : "Speak with Gemini AI"}
          aria-label={isListening ? "Stop voice input" : "Speak with Gemini AI"}
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors cursor-pointer disabled:opacity-45 ${
            isListening
              ? "bg-rose-600 text-white animate-pulse"
              : "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          }`}
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            activeMode === "tutor"
              ? "Type or tap mic to ask study doubts..."
              : "Type or tap mic to ask about jobs & study..."
          }
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
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
