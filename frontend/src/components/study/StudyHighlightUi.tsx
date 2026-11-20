"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  BookmarkCheck,
  Check,
  ChevronDown,
  Eraser,
  Highlighter,
  MousePointer2,
  PenTool,
  Search,
  Sparkles,
  Square,
  StickyNote,
  Trash2,
  Type,
  Underline,
  Undo2,
  Waves,
  X,
} from "lucide-react";
import { useStudyHighlights } from "@/components/study/StudyHighlightContext";
import {
  DRAW_WIDTH_OPTIONS,
  getHighlightMarkClass,
  HIGHLIGHT_COLOR_MAP,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_STYLES,
  INK_COLORS,
} from "@/lib/studyHighlights";
import type { HighlightColor, HighlightStyle, StudyHighlight } from "@/lib/types";

function StyleIcon({ style }: { style: HighlightStyle }) {
  if (style === "underline") return <Underline className="h-3.5 w-3.5 shrink-0" />;
  if (style === "wavy") return <Waves className="h-3.5 w-3.5 shrink-0" />;
  if (style === "box") return <Square className="h-3 w-3 shrink-0" />;
  return <Highlighter className="h-3.5 w-3.5 shrink-0" />;
}

/**
 * Compact sticky-friendly Highlighter Marker Toolbar for Topic Guru sheets and Written/Viva lab.
 */
export function StudyHighlightToolbar({
  scopeKey,
  viewKey = "default",
  panelOpen,
  onTogglePanel,
  compact = false,
}: {
  scopeKey: string;
  viewKey?: string;
  panelOpen: boolean;
  onTogglePanel: () => void;
  compact?: boolean;
}) {
  const ctx = useStudyHighlights();
  const [confirmClearInk, setConfirmClearInk] = useState(false);

  if (!ctx) return null;

  const scopeItems = ctx.getScopeHighlights(scopeKey);
  const viewDrawings = ctx.getViewDrawings(scopeKey, viewKey);
  const viewNotes = ctx.getViewNotes(scopeKey, viewKey);
  const count = scopeItems.length;
  const isOff = ctx.toolMode === "off";
  const isPen = ctx.toolMode === "pen";
  const isDraw = ctx.toolMode === "draw";
  const isWrite = ctx.toolMode === "write";
  const isEraser = ctx.toolMode === "eraser";

  const modes = [
    {
      id: "off" as const,
      label: "Normal",
      title: "Normal mouse pointer and text selection",
      icon: MousePointer2,
      activeClass: "bg-slate-900 text-white shadow-2xs",
    },
    {
      id: "pen" as const,
      label: "Mark / Line",
      title: "Highlight, underline, wavy-line, or box any text",
      icon: Highlighter,
      activeClass: "bg-emerald-700 text-white shadow-2xs",
    },
    {
      id: "draw" as const,
      label: "Draw",
      title: "Draw freehand shapes, arrows, circles, or handwrite anywhere",
      icon: PenTool,
      activeClass: "bg-indigo-700 text-white shadow-2xs",
    },
    {
      id: "write" as const,
      label: "Write Note",
      title: "Click anywhere on the sheet to write a typed Bangla/English note",
      icon: Type,
      activeClass: "bg-amber-600 text-white shadow-2xs",
    },
    {
      id: "eraser" as const,
      label: "Eraser",
      title: "Click any mark, drawing stroke, or sticky note to remove it",
      icon: Eraser,
      activeClass: "bg-rose-700 text-white shadow-2xs",
    },
  ];

  return (
    <div
      data-hl-ignore="true"
      className={`rounded-xl border transition-colors space-y-2 print:hidden ${
        isPen
          ? "border-emerald-300 bg-emerald-50/60"
          : isDraw
          ? "border-indigo-300 bg-indigo-50/60"
          : isWrite
          ? "border-amber-300 bg-amber-50/70"
          : isEraser
          ? "border-rose-300 bg-rose-50/70"
          : "border-slate-200 bg-slate-50/80"
      } ${compact ? "px-3 py-2" : "px-3.5 py-2.5"}`}
    >
      {/* Row 1: Plain-English Tool Selector + My Highlights */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1"
          role="group"
          aria-label="Sheet pen and writing mode"
        >
          {modes.map((m) => {
            const Icon = m.icon;
            const active = ctx.toolMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                title={m.title}
                aria-pressed={active}
                onClick={() => {
                  setConfirmClearInk(false);
                  ctx.setToolMode(m.id);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? m.activeClass
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {(viewDrawings.length > 0 || viewNotes.length > 0) && (
            <span className="hidden sm:inline text-[11px] font-semibold text-slate-500">
              {viewDrawings.length > 0 ? `${viewDrawings.length} strokes` : ""}
              {viewDrawings.length > 0 && viewNotes.length > 0 ? " • " : ""}
              {viewNotes.length > 0 ? `${viewNotes.length} notes` : ""}
            </span>
          )}
          {ctx.syncState === "saving" && (
            <span className="text-[11px] font-semibold text-slate-400">
              Syncing...
            </span>
          )}
          {ctx.syncState === "saved" && (
            <span className="text-[11px] font-semibold text-emerald-700">
              Saved
            </span>
          )}
          {ctx.syncState === "offline" && (
            <span
              title="Saved in browser storage; will sync when online"
              className="text-[11px] font-semibold text-amber-700"
            >
              Saved locally
            </span>
          )}

          <button
            type="button"
            onClick={onTogglePanel}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              panelOpen
                ? "bg-emerald-700 text-white"
                : count > 0
                ? "border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <BookmarkCheck className="h-3.5 w-3.5" />
            <span>My Highlights ({count})</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                panelOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Row 2: Contextual Sub-Options for Normal / Mark / Draw / Write / Eraser */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        {isPen && (
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5"
              role="group"
              aria-label="Pen marking style"
            >
              {HIGHLIGHT_STYLES.map((st) => {
                const selected = ctx.activeStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    title={`${st.label} — ${st.hint}`}
                    aria-pressed={selected}
                    onClick={() => ctx.selectMarkerStyle(st.id, true)}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                      selected
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <StyleIcon style={st.id} />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1"
              role="group"
              aria-label="Highlight marker color"
            >
              {HIGHLIGHT_COLORS.map((c) => {
                const selected = ctx.activeColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={`${c.label} (${c.labelBn}) — ${c.hint}`}
                    aria-label={`${c.label} pen ink (${c.hint})`}
                    aria-pressed={selected}
                    onClick={() => ctx.selectMarkerColor(c.id, true)}
                    className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                      c.swatchClass
                    } ${
                      selected
                        ? "ring-2 ring-slate-900 ring-offset-1 scale-105"
                        : "opacity-80 hover:opacity-100"
                    }`}
                  />
                );
              })}
            </div>

            <span className="hidden lg:inline text-[11px] font-medium text-slate-600">
              {ctx.activeStyle === "underline"
                ? "Drag text to underline • Click mark to edit"
                : ctx.activeStyle === "wavy"
                ? "Drag text for wavy underline • Click mark to edit"
                : ctx.activeStyle === "box"
                ? "Drag text to box keywords • Click mark to edit"
                : "Drag text to highlight • Click mark to edit"}
            </span>
          </div>
        )}

        {isDraw && (
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1"
              role="group"
              aria-label="Drawing ink color"
            >
              {INK_COLORS.map((c) => {
                const selected = ctx.inkColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={`Ink: ${c.label}`}
                    aria-label={`${c.label} drawing ink`}
                    aria-pressed={selected}
                    onClick={() => ctx.setInkColor(c.id)}
                    className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                      c.swatchClass
                    } ${
                      selected
                        ? "ring-2 ring-indigo-700 ring-offset-1 scale-105"
                        : "opacity-80 hover:opacity-100"
                    }`}
                  />
                );
              })}
            </div>

            <div
              className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5"
              role="group"
              aria-label="Stroke thickness"
            >
              {DRAW_WIDTH_OPTIONS.map((opt) => (
                <button
                  key={opt.width}
                  type="button"
                  onClick={() => ctx.setStrokeWidth(opt.width)}
                  className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                    ctx.strokeWidth === opt.width ||
                    (opt.width === 4 && ctx.strokeWidth === 3)
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={viewDrawings.length === 0}
              onClick={() => ctx.undoLastDrawing(scopeKey, viewKey)}
              title="Undo last drawing stroke (Ctrl+Z)"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Undo</span>
            </button>

            {viewDrawings.length > 0 &&
              (confirmClearInk ? (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      ctx.clearViewDrawings(scopeKey, viewKey);
                      setConfirmClearInk(false);
                    }}
                    className="rounded-lg bg-rose-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-800 cursor-pointer"
                  >
                    Clear {viewDrawings.length} strokes?
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearInk(false)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearInk(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear Drawings</span>
                </button>
              ))}

            <span className="hidden xl:inline text-[11px] font-medium text-indigo-900/80">
              Drag anywhere to handwrite, circle, or draw arrows
            </span>
          </div>
        )}

        {isWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1"
              role="group"
              aria-label="Sticky note color"
            >
              {INK_COLORS.map((c) => {
                const selected = ctx.inkColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={`Note color: ${c.label}`}
                    aria-label={`${c.label} note color`}
                    aria-pressed={selected}
                    onClick={() => ctx.setInkColor(c.id)}
                    className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                      c.swatchClass
                    } ${
                      selected
                        ? "ring-2 ring-amber-700 ring-offset-1 scale-105"
                        : "opacity-80 hover:opacity-100"
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[11px] font-medium text-amber-950/90">
              Click anywhere on the sheet to write a note in Bangla or English • Drag grip to move
            </span>
          </div>
        )}

        {isEraser && (
          <span className="text-[11px] font-medium text-rose-900">
            Click any highlight, underline, freehand stroke, or note card to erase it
          </span>
        )}

        {isOff && (
          <span className="text-[11px] font-medium text-slate-600">
            Normal cursor • Drag any text for quick mark/underline, or choose Mark / Draw / Write Note above
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Collapsible per-sheet "My Highlights" revision panel with color filter, inline notes, jump-to-mark & clear.
 */
export function StudyHighlightsPanel({
  scopeKey,
  open,
  onJumpToHighlight,
  onAskAi,
}: {
  scopeKey: string;
  open: boolean;
  onJumpToHighlight: (hl: StudyHighlight) => void;
  onAskAi?: (text: string) => void;
}) {
  const ctx = useStudyHighlights();
  const [colorFilter, setColorFilter] = useState<"all" | HighlightColor>("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const scopeItems = useMemo(() => {
    if (!ctx) return [];
    return [...ctx.getScopeHighlights(scopeKey)].reverse();
  }, [ctx, scopeKey]);

  const filtered = useMemo(() => {
    if (colorFilter === "all") return scopeItems;
    return scopeItems.filter((h) => h.color === colorFilter);
  }, [scopeItems, colorFilter]);

  if (!ctx || !open) return null;

  return (
    <div
      data-hl-ignore="true"
      className="animate-soft-reveal rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs print:hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setColorFilter("all")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
              colorFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All ({scopeItems.length})
          </button>
          {HIGHLIGHT_COLORS.map((c) => {
            const cCount = scopeItems.filter((h) => h.color === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setColorFilter(c.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                  colorFilter === c.id
                    ? c.badgeClass
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full border ${c.swatchClass}`} />
                <span>
                  {c.label} ({cCount})
                </span>
              </button>
            );
          })}
        </div>

        {scopeItems.length > 0 && (
          <div className="flex items-center gap-1.5">
            {confirmClear ? (
              <>
                <span className="text-[11px] font-semibold text-rose-700">
                  Clear {scopeItems.length} marks?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    ctx.clearScopeHighlights(scopeKey);
                    setConfirmClear(false);
                  }}
                  className="rounded-lg bg-rose-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-800 cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-100 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear Sheet</span>
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center text-xs text-slate-500 font-bangla">
          {scopeItems.length === 0
            ? "এখনো কোনো লাইন হাইলাইট করা হয়নি। উপরে Highlighter চালু করে বা যেকোনো লেখা সিলেক্ট করে রঙ বেছে নিন।"
            : "No highlights in this color filter yet."}
        </p>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {filtered.map((hl) => {
            const meta = HIGHLIGHT_COLOR_MAP[hl.color] ?? HIGHLIGHT_COLOR_MAP.yellow;
            const isEditing = editingNoteId === hl.id;
            return (
              <div
                key={hl.id}
                className={`rounded-xl border border-slate-200 border-l-4 ${meta.borderClass} bg-slate-50/60 p-3 space-y-2`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500 font-bangla truncate max-w-[260px]">
                    {hl.sectionLabel || hl.scopeTitle || "Marked Excerpt"}
                  </span>
                  <div className="flex items-center gap-1">
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        title={`Change to ${c.label}`}
                        onClick={() => ctx.updateHighlight(hl.id, { color: c.id })}
                        className={`h-3.5 w-3.5 rounded-full border cursor-pointer ${
                          c.swatchClass
                        } ${hl.color === c.id ? "ring-1 ring-slate-900" : "opacity-60 hover:opacity-100"}`}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => onJumpToHighlight(hl)}
                      className="ml-1 inline-flex items-center gap-0.5 rounded-md bg-emerald-700 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-emerald-800 cursor-pointer"
                    >
                      <span>Jump</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      title="Edit note"
                      onClick={() => {
                        if (isEditing) {
                          setEditingNoteId(null);
                        } else {
                          setEditingNoteId(hl.id);
                          setNoteDraft(hl.note ?? "");
                        }
                      }}
                      className="rounded-md p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800 cursor-pointer"
                    >
                      <StickyNote className="h-3.5 w-3.5" />
                    </button>
                    {onAskAi && (
                      <button
                        type="button"
                        title="Ask AI on this highlight"
                        onClick={() =>
                          onAskAi(
                            `Explain this highlighted excerpt clearly for Bangladesh Govt Job exams:\n"${hl.text.slice(0, 220)}"`
                          )
                        }
                        className="rounded-md p-1 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Delete highlight"
                      onClick={() => ctx.deleteHighlight(hl.id)}
                      className="rounded-md p-1 text-rose-600 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-bangla">
                  <span
                    className={`rounded px-1 py-0.5 ${getHighlightMarkClass(
                      hl.color,
                      hl.style
                    )}`}
                  >
                    {hl.text}
                  </span>
                </p>

                {!isEditing && hl.note && (
                  <p className="text-[11px] font-medium text-amber-950 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 font-bangla">
                    <strong>Note:</strong> {hl.note}
                  </p>
                )}

                {isEditing && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      ctx.updateHighlight(hl.id, { note: noteDraft.trim() });
                      setEditingNoteId(null);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      maxLength={300}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Add a short exam reminder..."
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs focus:border-emerald-600 focus:outline-none font-bangla"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                      Save
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Study Hub-wide "My Highlights" Revision Notebook Modal showing highlights
 * across all Topic Guru Lecture Sheets + Written/Viva Model Answers.
 */
export function GlobalHighlightsModal({
  open,
  onClose,
  onOpenHighlight,
}: {
  open: boolean;
  onClose: () => void;
  onOpenHighlight: (hl: StudyHighlight) => void;
}) {
  const ctx = useStudyHighlights();
  const [query, setQuery] = useState("");
  const [colorFilter, setColorFilter] = useState<"all" | HighlightColor>("all");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    if (!ctx) return [];
    const q = query.trim().toLowerCase();
    return [...ctx.highlights]
      .reverse()
      .filter((hl) => {
        if (colorFilter !== "all" && hl.color !== colorFilter) return false;
        if (!q) return true;
        return (
          hl.text.toLowerCase().includes(q) ||
          (hl.note ?? "").toLowerCase().includes(q) ||
          (hl.scopeTitle ?? "").toLowerCase().includes(q) ||
          (hl.sectionLabel ?? "").toLowerCase().includes(q)
        );
      });
  }, [ctx, query, colorFilter]);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { scopeKey: string; scopeTitle: string; items: StudyHighlight[] }
    >();
    for (const hl of filtered) {
      const existing = map.get(hl.scopeKey);
      if (existing) {
        existing.items.push(hl);
      } else {
        map.set(hl.scopeKey, {
          scopeKey: hl.scopeKey,
          scopeTitle:
            hl.scopeTitle ||
            (hl.scopeKey === "written-viva"
              ? "Written & Viva Lab"
              : hl.scopeKey.replace(/^topic:/, "")),
          items: [hl],
        });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  if (!open || !ctx || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-highlights-title"
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px] p-4 print:hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div>
            <h3
              id="global-highlights-title"
              className="text-base font-extrabold text-slate-900 flex items-center gap-2"
            >
              <Highlighter className="h-4 w-4 text-emerald-700" />
              <span>My Study Hub Highlights ({ctx.highlights.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              All marked lines across Topic Guru lecture sheets &amp; Written/Viva
              model answers — synced to your progress.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close highlights notebook"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-3 space-y-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your highlights, notes, or topic titles..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs sm:text-sm focus:border-emerald-600 focus:bg-white focus:outline-none font-bangla"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setColorFilter("all")}
              className={`rounded-full px-3 py-1 text-[11px] font-bold cursor-pointer ${
                colorFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All ({ctx.highlights.length})
            </button>
            {HIGHLIGHT_COLORS.map((c) => {
              const count = ctx.highlights.filter((h) => h.color === c.id).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorFilter(c.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                    colorFilter === c.id
                      ? c.badgeClass
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full border ${c.swatchClass}`} />
                  <span>
                    {c.label} ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {grouped.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center space-y-1.5">
              <p className="text-sm font-bold text-slate-700">
                {ctx.highlights.length === 0
                  ? "No highlights saved yet"
                  : "No highlights match your filter"}
              </p>
              <p className="text-xs text-slate-500 font-bangla">
                Open any Topic Guru Lecture Sheet or Written/Viva Model Answer,
                select text or turn on the Highlighter pen to build your personal
                last-night revision notebook.
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.scopeKey} className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 font-bangla">
                    {group.scopeTitle}
                  </h4>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                    {group.items.length} marked
                  </span>
                </div>

                <div className="space-y-2">
                  {group.items.map((hl) => {
                    const meta =
                      HIGHLIGHT_COLOR_MAP[hl.color] ?? HIGHLIGHT_COLOR_MAP.yellow;
                    return (
                      <div
                        key={hl.id}
                        className={`rounded-xl border border-slate-200 border-l-4 ${meta.borderClass} bg-white p-3.5 space-y-2 shadow-2xs`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-slate-500 font-bangla">
                            {hl.sectionLabel || "Excerpt"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenHighlight(hl);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 font-bold text-white hover:bg-emerald-800 cursor-pointer"
                            >
                              <span>Open &amp; Jump</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              title="Remove highlight"
                              onClick={() => ctx.deleteHighlight(hl.id)}
                              className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-bangla">
                          <span
                            className={`rounded px-1 py-0.5 ${getHighlightMarkClass(
                              hl.color,
                              hl.style
                            )}`}
                          >
                            {hl.text}
                          </span>
                        </p>

                        {hl.note && (
                          <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-950 font-bangla">
                            <strong>Note:</strong> {hl.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
