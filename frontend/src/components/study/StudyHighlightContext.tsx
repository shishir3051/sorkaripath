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
  getHighlightMarkClass,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_STYLES,
  loadLocalDrawings,
  loadLocalHighlights,
  loadLocalNotes,
  MAX_LOCAL_DRAWINGS,
  MAX_LOCAL_HIGHLIGHTS,
  MAX_LOCAL_NOTES,
  mergeDrawings,
  mergeHighlights,
  mergeNotes,
  resolveBlockSegments,
  saveLocalDrawings,
  saveLocalHighlights,
  saveLocalNotes,
  type ExtractedSelectionSlice,
} from "@/lib/studyHighlights";
import { SheetCanvasLayer } from "@/components/study/SheetCanvasLayer";
import type {
  DrawingPoint,
  HighlightColor,
  HighlightStyle,
  InkColor,
  LearnerProgress,
  SheetDrawingStroke,
  SheetStickyNote,
  StudyHighlight,
} from "@/lib/types";
import { useAuth } from "@/components/auth/AuthContext";

export type HighlightToolMode = "off" | "pen" | "draw" | "write" | "eraser";
export type HighlightSyncState = "idle" | "saving" | "saved" | "offline";

interface HighlightContextValue {
  highlights: StudyHighlight[];
  drawings: SheetDrawingStroke[];
  notes: SheetStickyNote[];
  toolMode: HighlightToolMode;
  activeColor: HighlightColor;
  activeStyle: HighlightStyle;
  inkColor: InkColor;
  strokeWidth: number;
  syncState: HighlightSyncState;
  setToolMode: (mode: HighlightToolMode) => void;
  setInkColor: (color: InkColor) => void;
  setStrokeWidth: (width: number) => void;
  selectMarkerColor: (color: HighlightColor, activatePen?: boolean) => void;
  selectMarkerStyle: (style: HighlightStyle, activatePen?: boolean) => void;
  addHighlights: (
    items: Array<Omit<StudyHighlight, "id" | "createdAt">>
  ) => StudyHighlight[];
  updateHighlight: (
    id: string,
    patch: { color?: HighlightColor; style?: HighlightStyle; note?: string }
  ) => void;
  deleteHighlight: (id: string) => void;
  clearScopeHighlights: (scopeKey: string) => void;
  getScopeHighlights: (scopeKey: string) => StudyHighlight[];
  getBlockHighlights: (scopeKey: string, blockId: string) => StudyHighlight[];
  addDrawing: (
    stroke: Omit<SheetDrawingStroke, "id" | "createdAt">
  ) => SheetDrawingStroke;
  undoLastDrawing: (scopeKey: string, viewKey?: string) => void;
  deleteDrawing: (id: string) => void;
  clearViewDrawings: (scopeKey: string, viewKey?: string) => void;
  saveNote: (
    note: Omit<SheetStickyNote, "createdAt"> & { createdAt?: string }
  ) => SheetStickyNote;
  deleteNote: (id: string) => void;
  getViewDrawings: (scopeKey: string, viewKey?: string) => SheetDrawingStroke[];
  getViewNotes: (scopeKey: string, viewKey?: string) => SheetStickyNote[];
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
  serverDrawings,
  serverNotes,
  onProgressUpdated,
  children,
}: {
  serverHighlights?: StudyHighlight[];
  serverDrawings?: SheetDrawingStroke[];
  serverNotes?: SheetStickyNote[];
  onProgressUpdated?: (progress: LearnerProgress) => void;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [highlights, setHighlights] = useState<StudyHighlight[]>([]);
  const [drawings, setDrawings] = useState<SheetDrawingStroke[]>([]);
  const [notes, setNotes] = useState<SheetStickyNote[]>([]);
  const [toolMode, setToolMode] = useState<HighlightToolMode>("off");
  const [activeColor, setActiveColor] = useState<HighlightColor>("yellow");
  const [activeStyle, setActiveStyle] = useState<HighlightStyle>("highlight");
  const [inkColor, setInkColor] = useState<InkColor>("dark");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [syncState, setSyncState] = useState<HighlightSyncState>("idle");
  const localHydratedRef = useRef(false);
  const serverMergedRef = useRef(false);
  const drawingsMergedRef = useRef(false);
  const notesMergedRef = useRef(false);
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

  // Hydrate instant offline highlights, drawings, and written notes from localStorage on client mount
  useEffect(() => {
    if (localHydratedRef.current) return;
    localHydratedRef.current = true;
    const localItems = loadLocalHighlights(userId);
    const localDrawings = loadLocalDrawings(userId);
    const localNotes = loadLocalNotes(userId);
    if (localItems.length > 0 || localDrawings.length > 0 || localNotes.length > 0) {
      queueMicrotask(() => {
        if (localItems.length > 0) {
          setHighlights((prev) =>
            prev.length > 0 ? mergeHighlights(localItems, prev).merged : localItems
          );
        }
        if (localDrawings.length > 0) {
          setDrawings((prev) =>
            prev.length > 0 ? mergeDrawings(localDrawings, prev).merged : localDrawings
          );
        }
        if (localNotes.length > 0) {
          setNotes((prev) =>
            prev.length > 0 ? mergeNotes(localNotes, prev).merged : localNotes
          );
        }
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

  // Merge MongoDB drawings once fetched
  useEffect(() => {
    if (!serverDrawings || drawingsMergedRef.current) return;
    drawingsMergedRef.current = true;
    const localItems = loadLocalDrawings(userId);
    const { merged, unsyncedLocal } = mergeDrawings(localItems, serverDrawings);
    saveLocalDrawings(merged, userId);
    queueMicrotask(() => {
      setDrawings(merged);
    });
    if (unsyncedLocal.length > 0) {
      const sid = getOrCreateSessionId();
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/drawings`,
        {
          method: "POST",
          body: JSON.stringify({ drawings: unsyncedLocal.slice(-40) }),
        }
      )
        .then((res) => {
          invalidateApiCache(`/progress/${encodeURIComponent(sid)}`);
          onProgressUpdated?.(res);
        })
        .catch(() => {});
    }
  }, [serverDrawings, onProgressUpdated, userId]);

  // Merge MongoDB sticky notes once fetched
  useEffect(() => {
    if (!serverNotes || notesMergedRef.current) return;
    notesMergedRef.current = true;
    const localItems = loadLocalNotes(userId);
    const { merged, unsyncedLocal } = mergeNotes(localItems, serverNotes);
    saveLocalNotes(merged, userId);
    queueMicrotask(() => {
      setNotes(merged);
    });
    for (const note of unsyncedLocal.slice(-20)) {
      const sid = getOrCreateSessionId();
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/notes`,
        {
          method: "POST",
          body: JSON.stringify({ note }),
        }
      )
        .then((res) => {
          invalidateApiCache(`/progress/${encodeURIComponent(sid)}`);
          onProgressUpdated?.(res);
        })
        .catch(() => {});
    }
  }, [serverNotes, onProgressUpdated, userId]);

  const selectMarkerColor = useCallback(
    (color: HighlightColor, activatePen = true) => {
      setActiveColor(color);
      if (activatePen) {
        setToolMode("pen");
      }
    },
    []
  );

  const selectMarkerStyle = useCallback(
    (style: HighlightStyle, activatePen = true) => {
      setActiveStyle(style);
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
    (
      id: string,
      patch: { color?: HighlightColor; style?: HighlightStyle; note?: string }
    ) => {
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

  const addDrawing = useCallback(
    (stroke: Omit<SheetDrawingStroke, "id" | "createdAt">) => {
      const created: SheetDrawingStroke = {
        ...stroke,
        id: createHighlightId(),
        createdAt: new Date().toISOString(),
      };
      setDrawings((prev) => {
        const next = [...prev, created].slice(-MAX_LOCAL_DRAWINGS);
        saveLocalDrawings(next, userId);
        return next;
      });
      const sid = getOrCreateSessionId();
      flashSyncState("saving");
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/drawings`,
        {
          method: "POST",
          body: JSON.stringify({ drawings: [created] }),
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

  const deleteDrawing = useCallback(
    (id: string) => {
      setDrawings((prev) => {
        const next = prev.filter((d) => d.id !== id);
        saveLocalDrawings(next, userId);
        return next;
      });
      const sid = getOrCreateSessionId();
      flashSyncState("saving");
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/drawings/${encodeURIComponent(id)}`,
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

  const undoLastDrawing = useCallback(
    (scopeKey: string, viewKey = "default") => {
      const matching = drawings.filter(
        (d) => d.scopeKey === scopeKey && (d.viewKey || "default") === viewKey
      );
      const last = matching[matching.length - 1];
      if (last) {
        deleteDrawing(last.id);
      }
    },
    [drawings, deleteDrawing]
  );

  const clearViewDrawings = useCallback(
    (scopeKey: string, viewKey = "default") => {
      setDrawings((prev) => {
        const next = prev.filter(
          (d) => !(d.scopeKey === scopeKey && (d.viewKey || "default") === viewKey)
        );
        saveLocalDrawings(next, userId);
        return next;
      });
      const sid = getOrCreateSessionId();
      flashSyncState("saving");
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/drawings?scopeKey=${encodeURIComponent(scopeKey)}&viewKey=${encodeURIComponent(viewKey)}`,
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

  const saveNote = useCallback(
    (note: Omit<SheetStickyNote, "createdAt"> & { createdAt?: string }) => {
      const saved: SheetStickyNote = {
        ...note,
        createdAt: note.createdAt || new Date().toISOString(),
      };
      setNotes((prev) => {
        const without = prev.filter((n) => n.id !== saved.id);
        const next = [...without, saved].slice(-MAX_LOCAL_NOTES);
        saveLocalNotes(next, userId);
        return next;
      });
      const sid = getOrCreateSessionId();
      flashSyncState("saving");
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/notes`,
        {
          method: "POST",
          body: JSON.stringify({ note: saved }),
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
      return saved;
    },
    [flashSyncState, onProgressUpdated, userId]
  );

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        saveLocalNotes(next, userId);
        return next;
      });
      const sid = getOrCreateSessionId();
      flashSyncState("saving");
      apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/notes/${encodeURIComponent(id)}`,
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

  const getViewDrawings = useCallback(
    (scopeKey: string, viewKey = "default") =>
      drawings.filter(
        (d) => d.scopeKey === scopeKey && (d.viewKey || "default") === viewKey
      ),
    [drawings]
  );

  const getViewNotes = useCallback(
    (scopeKey: string, viewKey = "default") =>
      notes.filter(
        (n) => n.scopeKey === scopeKey && (n.viewKey || "default") === viewKey
      ),
    [notes]
  );

  const value = useMemo<HighlightContextValue>(
    () => ({
      highlights,
      drawings,
      notes,
      toolMode,
      activeColor,
      activeStyle,
      inkColor,
      strokeWidth,
      syncState,
      setToolMode,
      setInkColor,
      setStrokeWidth,
      selectMarkerColor,
      selectMarkerStyle,
      addHighlights,
      updateHighlight,
      deleteHighlight,
      clearScopeHighlights,
      getScopeHighlights,
      getBlockHighlights,
      addDrawing,
      undoLastDrawing,
      deleteDrawing,
      clearViewDrawings,
      saveNote,
      deleteNote,
      getViewDrawings,
      getViewNotes,
      scopeCounts: indexes.scopeCounts,
    }),
    [
      highlights,
      drawings,
      notes,
      toolMode,
      activeColor,
      activeStyle,
      inkColor,
      strokeWidth,
      syncState,
      selectMarkerColor,
      selectMarkerStyle,
      addHighlights,
      updateHighlight,
      deleteHighlight,
      clearScopeHighlights,
      getScopeHighlights,
      getBlockHighlights,
      addDrawing,
      undoLastDrawing,
      deleteDrawing,
      clearViewDrawings,
      saveNote,
      deleteNote,
      getViewDrawings,
      getViewNotes,
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
  annotationViewKey = "default",
  onAskAi,
  className,
  children,
}: {
  scopeKey: string;
  scopeTitle: string;
  annotationViewKey?: string;
  onAskAi?: (text: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useStudyHighlights();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const inspectorRef = useRef<HTMLDivElement | null>(null);
  const lastPointerTouchRef = useRef(false);
  const drawingPointerIdRef = useRef<number | null>(null);
  const activePointsRef = useRef<DrawingPoint[]>([]);
  const lastScreenPtRef = useRef<{ x: number; y: number } | null>(null);

  const [pendingSel, setPendingSel] = useState<PendingSelectionState | null>(
    null
  );
  const [inspector, setInspector] = useState<InspectorState | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNote, setEditingNote] = useState(false);
  const [activeStroke, setActiveStroke] = useState<SheetDrawingStroke | null>(null);
  const [editingSheetNoteId, setEditingSheetNoteId] = useState<string | null>(null);

  const viewDrawings = useMemo(
    () => (ctx ? ctx.getViewDrawings(scopeKey, annotationViewKey) : []),
    [ctx, scopeKey, annotationViewKey]
  );
  const viewNotes = useMemo(
    () => (ctx ? ctx.getViewNotes(scopeKey, annotationViewKey) : []),
    [ctx, scopeKey, annotationViewKey]
  );

  const scopeValue = useMemo<ScopeContextValue>(
    () => ({ scopeKey, scopeTitle, onAskAi }),
    [scopeKey, scopeTitle, onAskAi]
  );

  const inspectedHighlight = useMemo(() => {
    if (!inspector || !ctx) return null;
    return ctx.highlights.find((h) => h.id === inspector.highlightId) ?? null;
  }, [inspector, ctx]);

  const applyPendingSlices = useCallback(
    (
      slices: ExtractedSelectionSlice[],
      color: HighlightColor,
      style?: HighlightStyle
    ) => {
      if (!ctx || !slices.length) return;
      const chosenStyle = style ?? ctx.activeStyle;
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
          style: chosenStyle,
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

  // Ctrl+Z / Cmd+Z shortcut to undo last freehand drawing while in Draw mode
  useEffect(() => {
    if (!ctx || ctx.toolMode !== "draw") return;
    const handleUndoKey = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        ctx.undoLastDrawing(scopeKey, annotationViewKey);
      }
    };
    window.addEventListener("keydown", handleUndoKey);
    return () => window.removeEventListener("keydown", handleUndoKey);
  }, [ctx, scopeKey, annotationViewKey]);

  function isInteractiveOrIgnored(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return Boolean(
      el?.closest(
        "button, a, input, textarea, select, [role='button'], [data-hl-ignore='true'], [data-sheet-note='true']"
      )
    );
  }

  function toNormalizedPoint(clientX: number, clientY: number): DrawingPoint | null {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, clientY - rect.top);
    return { x: Number(x.toFixed(4)), y: Number(y.toFixed(1)) };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    lastPointerTouchRef.current = e.pointerType === "touch";
    if (!ctx || ctx.toolMode !== "draw") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isInteractiveOrIgnored(e.target)) return;

    const pt = toNormalizedPoint(e.clientX, e.clientY);
    if (!pt) return;

    e.preventDefault();
    drawingPointerIdRef.current = e.pointerId;
    activePointsRef.current = [pt];
    lastScreenPtRef.current = { x: e.clientX, y: e.clientY };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic pointer capture edge cases
    }

    setActiveStroke({
      id: "draft-stroke",
      scopeKey,
      viewKey: annotationViewKey,
      color: ctx.inkColor,
      width: ctx.strokeWidth,
      points: [pt],
      createdAt: "",
    });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (drawingPointerIdRef.current !== e.pointerId || !ctx) return;
    const prev = lastScreenPtRef.current;
    if (prev) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (dx * dx + dy * dy < 6.25) return; // >= 2.5px step keeps strokes smooth and lightweight
    }

    const pt = toNormalizedPoint(e.clientX, e.clientY);
    if (!pt) return;
    lastScreenPtRef.current = { x: e.clientX, y: e.clientY };
    activePointsRef.current = [...activePointsRef.current, pt];
    setActiveStroke((curr) =>
      curr
        ? { ...curr, points: activePointsRef.current }
        : null
    );
  }

  function finishDrawingStroke(e: React.PointerEvent<HTMLDivElement>) {
    if (drawingPointerIdRef.current !== e.pointerId) return;
    drawingPointerIdRef.current = null;
    lastScreenPtRef.current = null;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }

    const points = activePointsRef.current;
    activePointsRef.current = [];
    setActiveStroke(null);

    if (ctx && points.length > 0) {
      ctx.addDrawing({
        scopeKey,
        viewKey: annotationViewKey,
        color: ctx.inkColor,
        width: ctx.strokeWidth,
        points: points.slice(0, 1500),
      });
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (!ctx || lastPointerTouchRef.current) return;
    if (e.button !== 0) return;
    if (ctx.toolMode === "draw" || ctx.toolMode === "write") return;

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
      applyPendingSlices(extracted.slices, ctx.activeColor, ctx.activeStyle);
      return;
    }

    if (ctx.toolMode === "eraser") {
      return;
    }

    const pos = clampPopoverPosition(extracted.rect, onAskAi ? 340 : 280);
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

    if (ctx.toolMode === "write") {
      if (isInteractiveOrIgnored(e.target)) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      const pt = toNormalizedPoint(e.clientX, e.clientY);
      if (!pt) return;

      const noteId = createHighlightId();
      ctx.saveNote({
        id: noteId,
        scopeKey,
        viewKey: annotationViewKey,
        x: Math.min(0.7, Math.max(0.02, pt.x)),
        y: Math.max(16, pt.y - 12),
        text: "",
        color: ctx.inkColor,
      });
      setEditingSheetNoteId(noteId);
      return;
    }

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

  const penOrDrawCursorActive =
    ctx?.toolMode === "pen" || ctx?.toolMode === "draw";
  const cursorInkColor =
    ctx?.toolMode === "draw"
      ? ctx.inkColor
      : ctx?.toolMode === "pen"
      ? ctx.activeColor
      : undefined;

  return (
    <StudyHighlightScopeContext.Provider value={scopeValue}>
      <div
        ref={containerRef}
        data-hl-pen-active={penOrDrawCursorActive ? "true" : undefined}
        data-hl-draw-active={ctx?.toolMode === "draw" ? "true" : undefined}
        data-hl-write-active={ctx?.toolMode === "write" ? "true" : undefined}
        data-hl-pen-color={cursorInkColor}
        data-hl-pen-style={ctx?.toolMode === "pen" ? ctx.activeStyle : undefined}
        data-hl-eraser-active={ctx?.toolMode === "eraser" ? "true" : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawingStroke}
        onPointerCancel={finishDrawingStroke}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className={`relative ${
          ctx?.toolMode === "draw" ? "select-none touch-none" : ""
        } ${className ?? ""}`}
      >
        {children}
        {ctx && (
          <SheetCanvasLayer
            containerRef={containerRef}
            drawings={viewDrawings}
            activeStroke={activeStroke}
            notes={viewNotes}
            editingNoteId={editingSheetNoteId}
            toolMode={ctx.toolMode}
            onSetEditingNoteId={setEditingSheetNoteId}
            onDeleteDrawing={ctx.deleteDrawing}
            onSaveNote={ctx.saveNote}
            onDeleteNote={ctx.deleteNote}
          />
        )}
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
                  applyPendingSlices(
                    pendingSel.slices,
                    ctx.activeColor,
                    ctx.activeStyle
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                <Highlighter className="h-3.5 w-3.5" />
                <span>Apply</span>
              </button>
            )}

            <div className="flex items-center gap-1 pr-1 border-r border-slate-700">
              {HIGHLIGHT_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  title={st.hint}
                  aria-label={st.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    ctx.selectMarkerStyle(st.id, ctx.toolMode === "pen");
                    applyPendingSlices(pendingSel.slices, ctx.activeColor, st.id);
                  }}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                    ctx.activeStyle === st.id
                      ? "bg-white text-slate-900"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {st.shortLabel}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={`${HIGHLIGHT_STYLES.find((s) => s.id === ctx.activeStyle)?.label ?? "Mark"} ${c.label} (${c.hint})`}
                  aria-label={`Mark ${c.label}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    ctx.selectMarkerColor(c.id, ctx.toolMode === "pen");
                    applyPendingSlices(pendingSel.slices, c.id, ctx.activeStyle);
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

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {HIGHLIGHT_STYLES.map((st) => {
                const active =
                  (inspectedHighlight.style ?? "highlight") === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    title={st.hint}
                    onClick={() =>
                      ctx.updateHighlight(inspectedHighlight.id, { style: st.id })
                    }
                    className={`flex-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
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

  const isSheetCursorMode =
    ctx?.toolMode === "pen" ||
    ctx?.toolMode === "draw" ||
    ctx?.toolMode === "write";

  const content = segments.map((seg) => {
    if (!seg.highlight) {
      return seg.text;
    }
    const styleKind = seg.highlight.style ?? "highlight";
    const markClass = getHighlightMarkClass(seg.highlight.color, styleKind);
    const hasNote = Boolean(seg.highlight.note);
    const noteClass = hasNote
      ? styleKind === "underline" || styleKind === "wavy"
        ? "bg-amber-100/45"
        : "underline decoration-dotted decoration-slate-700/80 underline-offset-2"
      : "";
    return (
      <mark
        key={`${seg.highlight.id}-${seg.start}`}
        data-hl-id={seg.highlight.id}
        data-hl-style={styleKind}
        title={
          hasNote
            ? `Note: ${seg.highlight.note} (click to edit)`
            : "Click to change style/color, add note, or remove"
        }
        className={`study-hl-mark ${isSheetCursorMode ? "" : "cursor-pointer"} ${markClass} ${noteClass}`}
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
