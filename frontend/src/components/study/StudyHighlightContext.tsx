"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Highlighter,
  Sparkles,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import {
  apiFetch,
  getOrCreateSessionId,
  invalidateApiCache,
} from "@/lib/api";
import {
  createHighlightId,
  extractSelectionSlices,
  HIGHLIGHT_COLOR_MAP,
  HIGHLIGHT_COLORS,
  loadLocalHighlights,
  MAX_LOCAL_HIGHLIGHTS,
  mergeHighlights,
  resolveBlockSegments,
  saveLocalHighlights,
  type ExtractedSelectionSlice,
} from "@/lib/studyHighlights";
import type {
  HighlightColor,
  LearnerProgress,
  StudyHighlight,
} from "@/lib/types";
import { useAuth } from "@/components/auth/AuthContext";

export type HighlightToolMode = "off" | "pen" | "eraser";
export type HighlightSyncState = "idle" | "saving" | "saved" | "offline";

interface HighlightContextValue {
  highlights: StudyHighlight[];
  toolMode: HighlightToolMode;
  activeColor: HighlightColor;
  syncState: HighlightSyncState;
  setToolMode: (mode: HighlightToolMode) => void;
  selectMarkerColor: (color: HighlightColor, activatePen?: boolean) => void;
  addHighlights: (
    items: Array<Omit<StudyHighlight, "id" | "createdAt">>
  ) => StudyHighlight[];
  updateHighlight: (
    id: string,
    patch: { color?: HighlightColor; note?: string }
  ) => void;
  deleteHighlight: (id: string) => void;
  clearScopeHighlights: (scopeKey: string) => void;
  getScopeHighlights: (scopeKey: string) => StudyHighlight[];
  getBlockHighlights: (scopeKey: string, blockId: string) => StudyHighlight[];
  scopeCounts: Map<string, number>;
}

const StudyHighlightContext = createContext<HighlightContextValue | null>(null);

interface ScopeContextValue {
  scopeKey: string;
  scopeTitle: string;
  onAskAi?: (text: string) => void;
}

const StudyHighlightScopeContext = createContext<ScopeContextValue | null>(
  null
);

export function jumpToHighlightMark(highlightId: string): void {
  if (typeof document === "undefined") return;
  const delays = [40, 180, 380];
  let found = false;

  const tryScroll = () => {
    if (found) return;
    const selector = `[data-hl-id="${CSS.escape(highlightId)}"]`;
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;
    found = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("study-hl-flash");
    void el.offsetWidth;
    el.classList.add("study-hl-flash");
    window.setTimeout(() => {
      el.classList.remove("study-hl-flash");
    }, 1600);
  };

  tryScroll();
  for (const delay of delays) {
    window.setTimeout(tryScroll, delay);
  }
}

export function StudyHighlightProvider({
  serverHighlights,
  onProgressUpdated,
  children,
}: {
  serverHighlights?: StudyHighlight[];
  onProgressUpdated?: (progress: LearnerProgress) => void;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [highlights, setHighlights] = useState<StudyHighlight[]>([]);
  const [toolMode, setToolMode] = useState<HighlightToolMode>("off");
  const [activeColor, setActiveColor] = useState<HighlightColor>("yellow");
  const [syncState, setSyncState] = useState<HighlightSyncState>("idle");
  const localHydratedRef = useRef(false);
  const serverMergedRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);

  const flashSyncState = useCallback((next: HighlightSyncState) => {
    setSyncState(next);
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    if (next === "saved") {
      syncTimerRef.current = window.setTimeout(() => {
        setSyncState("idle");
        syncTimerRef.current = null;
      }, 2200);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  // Hydrate instant offline highlights from localStorage on client mount
  useEffect(() => {
    if (localHydratedRef.current) return;
    localHydratedRef.current = true;
    const localItems = loadLocalHighlights(userId);
    if (localItems.length > 0) {
      queueMicrotask(() => {
        setHighlights((prev) =>
          prev.length > 0 ? mergeHighlights(localItems, prev).merged : localItems
        );
      });
    }
  }, [userId]);

  // Merge MongoDB progress highlights once fetched, and push any unsynced local ones
  useEffect(() => {
    if (!serverHighlights || serverMergedRef.current) return;
    serverMergedRef.current = true;
    const localItems = loadLocalHighlights(userId);
    const { merged, unsyncedLocal } = mergeHighlights(
      localItems,
      serverHighlights
    );
    saveLocalHighlights(merged, userId);
    queueMicrotask(() => {
      setHighlights(merged);
    });

    if (unsyncedLocal.length > 0) {
      const sid = getOrCreateSessionId();
      const batch = unsyncedLocal.slice(-40);
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/highlights`,
        {
          method: "POST",
          body: JSON.stringify({ highlights: batch }),
        }
      )
        .then((res) => {
          invalidateApiCache(`/progress/${encodeURIComponent(sid)}`);
          onProgressUpdated?.(res);
        })
        .catch(() => {});
    }
  }, [serverHighlights, onProgressUpdated, userId]);

  const selectMarkerColor = useCallback(
    (color: HighlightColor, activatePen = true) => {
      setActiveColor(color);
      if (activatePen) {
        setToolMode("pen");
      }
    },
    []
  );

  const addHighlights = useCallback(
    (items: Array<Omit<StudyHighlight, "id" | "createdAt">>) => {
      if (!items.length) return [];
      const now = new Date().toISOString();
      const created: StudyHighlight[] = items.map((item) => ({
        ...item,
        id: createHighlightId(),
        createdAt: now,
      }));

      setHighlights((prev) => {
        const next = [...prev, ...created].slice(-MAX_LOCAL_HIGHLIGHTS);
        saveLocalHighlights(next, userId);
        return next;
      });

      const sid = getOrCreateSessionId();
      flashSyncState("saving");
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/highlights`,
        {
          method: "POST",
          body: JSON.stringify({ highlights: created }),
        }
      )
        .then((res) => {
          invalidateApiCache(`/progress/${encodeURIComponent(sid)}`);
          onProgressUpdated?.(res);
          flashSyncState("saved");
        })
        .catch(() => {
          flashSyncState("offline");
        });

      return created;
    },
    [flashSyncState, onProgressUpdated, userId]
  );

  const updateHighlight = useCallback(
    (id: string, patch: { color?: HighlightColor; note?: string }) => {
      setHighlights((prev) => {
        const next = prev.map((h) => (h.id === id ? { ...h, ...patch } : h));
        saveLocalHighlights(next, userId);
        return next;
      });

      const sid = getOrCreateSessionId();
      flashSyncState("saving");
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/highlights/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(patch),
        }
      )
        .then((res) => {
          invalidateApiCache(`/progress/${encodeURIComponent(sid)}`);
          onProgressUpdated?.(res);
          flashSyncState("saved");
        })
        .catch(() => {
          flashSyncState("offline");
        });
    },
    [flashSyncState, onProgressUpdated, userId]
  );

  const deleteHighlight = useCallback(
    (id: string) => {
      setHighlights((prev) => {
        const next = prev.filter((h) => h.id !== id);
        saveLocalHighlights(next, userId);
        return next;
      });

      const sid = getOrCreateSessionId();
      flashSyncState("saving");
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/highlights/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      )
        .then((res) => {
          invalidateApiCache(`/progress/${encodeURIComponent(sid)}`);
          onProgressUpdated?.(res);
          flashSyncState("saved");
        })
        .catch(() => {
          flashSyncState("offline");
        });
    },
    [flashSyncState, onProgressUpdated, userId]
  );

  const clearScopeHighlights = useCallback(
    (scopeKey: string) => {
      setHighlights((prev) => {
        const next = prev.filter((h) => h.scopeKey !== scopeKey);
        saveLocalHighlights(next, userId);
        return next;
      });

      const sid = getOrCreateSessionId();
      flashSyncState("saving");
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/highlights?scopeKey=${encodeURIComponent(scopeKey)}`,
        { method: "DELETE" }
      )
        .then((res) => {
          invalidateApiCache(`/progress/${encodeURIComponent(sid)}`);
          onProgressUpdated?.(res);
          flashSyncState("saved");
        })
        .catch(() => {
          flashSyncState("offline");
        });
    },
    [flashSyncState, onProgressUpdated, userId]
  );

  const indexes = useMemo(() => {
    const byScope = new Map<string, StudyHighlight[]>();
    const byScopeBlock = new Map<string, Map<string, StudyHighlight[]>>();
    const scopeCounts = new Map<string, number>();

    for (const hl of highlights) {
      const scopeList = byScope.get(hl.scopeKey) ?? [];
      scopeList.push(hl);
      byScope.set(hl.scopeKey, scopeList);
      scopeCounts.set(hl.scopeKey, scopeList.length);

      let blockMap = byScopeBlock.get(hl.scopeKey);
      if (!blockMap) {
        blockMap = new Map();
        byScopeBlock.set(hl.scopeKey, blockMap);
      }
      const blockList = blockMap.get(hl.blockId) ?? [];
      blockList.push(hl);
      blockMap.set(hl.blockId, blockList);
    }

    return { byScope, byScopeBlock, scopeCounts };
  }, [highlights]);

  const getScopeHighlights = useCallback(
    (scopeKey: string) => indexes.byScope.get(scopeKey) ?? [],
    [indexes.byScope]
  );

  const getBlockHighlights = useCallback(
    (scopeKey: string, blockId: string) =>
      indexes.byScopeBlock.get(scopeKey)?.get(blockId) ?? [],
    [indexes.byScopeBlock]
  );

  const value = useMemo<HighlightContextValue>(
    () => ({
      highlights,
      toolMode,
      activeColor,
      syncState,
      setToolMode,
      selectMarkerColor,
      addHighlights,
      updateHighlight,
      deleteHighlight,
      clearScopeHighlights,
      getScopeHighlights,
      getBlockHighlights,
      scopeCounts: indexes.scopeCounts,
    }),
    [
      highlights,
      toolMode,
      activeColor,
      syncState,
      selectMarkerColor,
      addHighlights,
      updateHighlight,
      deleteHighlight,
      clearScopeHighlights,
      getScopeHighlights,
      getBlockHighlights,
      indexes.scopeCounts,
    ]
  );

  return (
    <StudyHighlightContext.Provider value={value}>
      {children}
    </StudyHighlightContext.Provider>
  );
}

export function useStudyHighlights() {
  return useContext(StudyHighlightContext);
}

interface PendingSelectionState {
  slices: ExtractedSelectionSlice[];
  top: number;
  left: number;
  isTouch: boolean;
}

interface InspectorState {
  highlightId: string;
  top: number;
  left: number;
}

function clampPopoverPosition(rect: DOMRect, popoverWidth: number) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const centerX = rect.left + rect.width / 2;
  const half = popoverWidth / 2;
  const left = Math.max(12, Math.min(vw - popoverWidth - 12, centerX - half));
  const preferTop = rect.top > 72;
  const top = preferTop
    ? Math.max(12, rect.top - 48)
    : Math.min(vh - 56, rect.bottom + 10);
  return { left, top };
}

/**
 * Interactive scope wrapper around a Topic Guru lecture sheet or Written/Viva area.
 * Handles desktop mouse drag highlighting, mobile touch selection bar, and clicking
 * existing marks to recolor, add revision notes, Ask AI, or erase.
 */
export function StudyHighlightScope({
  scopeKey,
  scopeTitle,
  onAskAi,
  className,
  children,
}: {
  scopeKey: string;
  scopeTitle: string;
  onAskAi?: (text: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useStudyHighlights();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const inspectorRef = useRef<HTMLDivElement | null>(null);
  const lastPointerTouchRef = useRef(false);

  const [pendingSel, setPendingSel] = useState<PendingSelectionState | null>(
    null
  );
  const [inspector, setInspector] = useState<InspectorState | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNote, setEditingNote] = useState(false);

  const scopeValue = useMemo<ScopeContextValue>(
    () => ({ scopeKey, scopeTitle, onAskAi }),
    [scopeKey, scopeTitle, onAskAi]
  );

  const inspectedHighlight = useMemo(() => {
    if (!inspector || !ctx) return null;
    return ctx.highlights.find((h) => h.id === inspector.highlightId) ?? null;
  }, [inspector, ctx]);

  const applyPendingSlices = useCallback(
    (slices: ExtractedSelectionSlice[], color: HighlightColor) => {
      if (!ctx || !slices.length) return;
      ctx.addHighlights(
        slices.map((s) => ({
          scopeKey,
          scopeTitle,
          blockId: s.blockId,
          sectionLabel: s.sectionLabel,
          text: s.text,
          start: s.start,
          end: s.end,
          color,
        }))
      );
      window.getSelection()?.removeAllRanges();
      setPendingSel(null);
    },
    [ctx, scopeKey, scopeTitle]
  );

  // Listen to touch/keyboard selection changes so mobile users can adjust handles cleanly
  useEffect(() => {
    let timer: number | null = null;

    const handleSelectionChange = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setPendingSel(null);
          return;
        }
        // On desktop mouseup handles immediate Pen Mode & popover; touch relies on selectionchange
        if (!lastPointerTouchRef.current) return;
        const extracted = extractSelectionSlices(
          sel,
          containerRef.current,
          scopeKey
        );
        if (!extracted) {
          setPendingSel(null);
          return;
        }
        const pos = clampPopoverPosition(extracted.rect, 280);
        setInspector(null);
        setPendingSel({
          slices: extracted.slices,
          top: pos.top,
          left: pos.left,
          isTouch: true,
        });
      }, 160);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [scopeKey]);

  // Dismiss popovers on outside pointerdown or Escape
  useEffect(() => {
    if (!pendingSel && !inspector) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (popoverRef.current?.contains(target)) return;
      if (inspectorRef.current?.contains(target)) return;
      setPendingSel(null);
      setInspector(null);
      setEditingNote(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPendingSel(null);
        setInspector(null);
        setEditingNote(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pendingSel, inspector]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    lastPointerTouchRef.current = e.pointerType === "touch";
  }

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (!ctx || lastPointerTouchRef.current) return;
    if (e.button !== 0) return;

    const sel = window.getSelection();
    const extracted = extractSelectionSlices(
      sel,
      containerRef.current,
      scopeKey
    );
    if (!extracted) {
      setPendingSel(null);
      return;
    }

    if (ctx.toolMode === "pen") {
      applyPendingSlices(extracted.slices, ctx.activeColor);
      return;
    }

    if (ctx.toolMode === "eraser") {
      return;
    }

    const pos = clampPopoverPosition(extracted.rect, onAskAi ? 258 : 206);
    setInspector(null);
    setPendingSel({
      slices: extracted.slices,
      top: pos.top,
      left: pos.left,
      isTouch: false,
    });
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!ctx) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;

    const target = e.target as HTMLElement | null;
    const markEl = target?.closest<HTMLElement>("[data-hl-id]");
    if (!markEl) return;

    const hlId = markEl.dataset.hlId;
    if (!hlId) return;

    if (ctx.toolMode === "eraser") {
      e.preventDefault();
      e.stopPropagation();
      ctx.deleteHighlight(hlId);
      setInspector(null);
      return;
    }

    const existing = ctx.highlights.find((h) => h.id === hlId);
    if (!existing) return;

    const rect = markEl.getBoundingClientRect();
    const pos = clampPopoverPosition(rect, 272);
    setPendingSel(null);
    setNoteDraft(existing.note ?? "");
    setEditingNote(false);
    setInspector({
      highlightId: hlId,
      top: Math.max(12, Math.min(window.innerHeight - 190, rect.bottom + 8)),
      left: pos.left,
    });
  }

  const combinedPendingText = useMemo(
    () => pendingSel?.slices.map((s) => s.text).join(" ") ?? "",
    [pendingSel]
  );

  return (
    <StudyHighlightScopeContext.Provider value={scopeValue}>
      <div
        ref={containerRef}
        data-hl-pen-active={ctx?.toolMode === "pen" ? "true" : undefined}
        data-hl-eraser-active={ctx?.toolMode === "eraser" ? "true" : undefined}
        onPointerDown={handlePointerDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className={className}
      >
        {children}
      </div>

      {/* Floating Selection Popover (Desktop quick picker OR Mobile touch action bar) */}
      {pendingSel &&
        ctx &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            data-hl-ignore="true"
            role="toolbar"
            aria-label="Highlight selected text"
            style={
              pendingSel.isTouch
                ? undefined
                : {
                    top: `${pendingSel.top}px`,
                    left: `${pendingSel.left}px`,
                  }
            }
            className={
              pendingSel.isTouch
                ? "fixed inset-x-3 bottom-4 z-[80] mx-auto flex max-w-md flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-700 bg-slate-900/95 px-3.5 py-2.5 text-white shadow-2xl backdrop-blur print:hidden"
                : "fixed z-[80] flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/95 px-2.5 py-1.5 text-white shadow-xl backdrop-blur print:hidden"
            }
          >
            {pendingSel.isTouch && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  applyPendingSlices(pendingSel.slices, ctx.activeColor)
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                <Highlighter className="h-3.5 w-3.5" />
                <span>Highlight</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={`Highlight ${c.label} (${c.hint})`}
                  aria-label={`Highlight ${c.label}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    ctx.selectMarkerColor(c.id, ctx.toolMode === "pen");
                    applyPendingSlices(pendingSel.slices, c.id);
                  }}
                  className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                    c.swatchClass
                  } ${
                    ctx.activeColor === c.id
                      ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900"
                      : ""
                  }`}
                />
              ))}
            </div>

            {onAskAi && combinedPendingText.length >= 2 && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const snippet = combinedPendingText.slice(0, 220);
                  window.getSelection()?.removeAllRanges();
                  setPendingSel(null);
                  onAskAi(
                    `Explain this marked excerpt from "${scopeTitle}" clearly with exam tips:\n"${snippet}"`
                  );
                }}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-500 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Ask AI</span>
              </button>
            )}

            <button
              type="button"
              aria-label="Cancel highlight"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                window.getSelection()?.removeAllRanges();
                setPendingSel(null);
              }}
              className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>,
          document.body
        )}

      {/* Existing Highlight Inspector Popover (Recolor / Note / Ask AI / Erase) */}
      {inspector &&
        inspectedHighlight &&
        ctx &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={inspectorRef}
            data-hl-ignore="true"
            role="dialog"
            aria-label="Edit highlight"
            style={{
              top: `${inspector.top}px`,
              left: `${inspector.left}px`,
            }}
            className="fixed z-[80] w-[272px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl space-y-2.5 print:hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={`Switch to ${c.label}`}
                    aria-label={`Switch highlight to ${c.label}`}
                    onClick={() =>
                      ctx.updateHighlight(inspectedHighlight.id, { color: c.id })
                    }
                    className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                      c.swatchClass
                    } ${
                      inspectedHighlight.color === c.id
                        ? "ring-2 ring-slate-900 ring-offset-1"
                        : ""
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Add or edit revision note"
                  onClick={() => setEditingNote((v) => !v)}
                  className={`rounded-lg p-1.5 text-xs font-bold cursor-pointer ${
                    editingNote || inspectedHighlight.note
                      ? "bg-amber-100 text-amber-900"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <StickyNote className="h-3.5 w-3.5" />
                </button>
                {onAskAi && (
                  <button
                    type="button"
                    title="Ask Gemini AI about this highlight"
                    onClick={() => {
                      const snippet = inspectedHighlight.text.slice(0, 220);
                      setInspector(null);
                      onAskAi(
                        `Explain this highlighted point from "${scopeTitle}" with exam examples:\n"${snippet}"`
                      );
                    }}
                    className="rounded-lg p-1.5 text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  title="Remove highlight"
                  onClick={() => {
                    ctx.deleteHighlight(inspectedHighlight.id);
                    setInspector(null);
                  }}
                  className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Close highlight editor"
                  onClick={() => setInspector(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {!editingNote && inspectedHighlight.note && (
              <p className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs text-amber-950 font-bangla">
                {inspectedHighlight.note}
              </p>
            )}

            {editingNote && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ctx.updateHighlight(inspectedHighlight.id, {
                    note: noteDraft.trim(),
                  });
                  setEditingNote(false);
                }}
                className="space-y-2"
              >
                <textarea
                  rows={2}
                  maxLength={300}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Write a quick exam reminder or mnemonic..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none font-bangla"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingNote(false)}
                    className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    <Check className="h-3 w-3" />
                    Save Note
                  </button>
                </div>
              </form>
            )}
          </div>,
          document.body
        )}
    </StudyHighlightScopeContext.Provider>
  );
}

/**
 * Renders plain text with deterministic React-managed <mark> highlight spans.
 * Never mutates DOM nodes directly and preserves exact UTF-16 character offsets for Bangla & English.
 */
export function HighlightableText({
  blockId,
  text,
  sectionLabel = "",
  as = "span",
  className,
}: {
  blockId: string;
  text: string;
  sectionLabel?: string;
  as?: "span" | "p" | "div" | "pre" | "li";
  className?: string;
}) {
  const ctx = useStudyHighlights();
  const scope = useContext(StudyHighlightScopeContext);

  const scopeKey = scope?.scopeKey ?? "";
  const getBlockHighlights = ctx?.getBlockHighlights;

  const segments = useMemo(() => {
    const blockHighlights =
      getBlockHighlights && scopeKey
        ? getBlockHighlights(scopeKey, blockId)
        : [];
    return resolveBlockSegments(text, blockHighlights);
  }, [text, getBlockHighlights, scopeKey, blockId]);

  const content = segments.map((seg) => {
    if (!seg.highlight) {
      return seg.text;
    }
    const meta = HIGHLIGHT_COLOR_MAP[seg.highlight.color] ?? HIGHLIGHT_COLOR_MAP.yellow;
    const hasNote = Boolean(seg.highlight.note);
    return (
      <mark
        key={`${seg.highlight.id}-${seg.start}`}
        data-hl-id={seg.highlight.id}
        title={
          hasNote
            ? `Note: ${seg.highlight.note} (click to edit)`
            : "Click to change color, add note, or remove"
        }
        className={`study-hl-mark cursor-pointer ${meta.markClass} ${
          hasNote
            ? "underline decoration-dotted decoration-slate-700/80 underline-offset-2"
            : ""
        }`}
      >
        {seg.text}
      </mark>
    );
  });

  const sharedProps = {
    "data-hl-block": blockId,
    "data-hl-scope": scopeKey,
    "data-hl-section": sectionLabel,
    className,
  };

  if (as === "p") return <p {...sharedProps}>{content}</p>;
  if (as === "div") return <div {...sharedProps}>{content}</div>;
  if (as === "pre") return <pre {...sharedProps}>{content}</pre>;
  if (as === "li") return <li {...sharedProps}>{content}</li>;
  return <span {...sharedProps}>{content}</span>;
}
