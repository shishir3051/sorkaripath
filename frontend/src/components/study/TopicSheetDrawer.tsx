"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, GripVertical, Maximize2, Minimize2, X } from "lucide-react";
import { TopicLectureReader } from "@/components/study/TopicLectureReader";
import { useStudyHighlights } from "@/components/study/StudyHighlightContext";
import type { StudyHighlight, StudyTopic } from "@/lib/types";

interface TopicSheetDrawerProps {
  topic: StudyTopic | null;
  isCompleted: boolean;
  onToggleComplete: (slug: string) => void;
  onClose: () => void;
  jumpHighlight?: StudyHighlight | null;
  onJumpHandled?: () => void;
}

const DEFAULT_DRAWER_WIDTH = 820;
const WIDE_DRAWER_WIDTH = 1140;
const MIN_DRAWER_WIDTH = 420;
const VIEWPORT_MARGIN = 36;
const DRAWER_TRANSITION_MS = 300;
const DRAWER_WIDTH_STORAGE_KEY = "sorkaripath:topic-drawer-width";

function clampDrawerWidth(width: number): number {
  const maxWidth =
    typeof window === "undefined"
      ? WIDE_DRAWER_WIDTH
      : Math.max(480, window.innerWidth - VIEWPORT_MARGIN);
  return Math.round(Math.min(Math.max(width, MIN_DRAWER_WIDTH), maxWidth));
}

function persistDrawerWidth(width: number): void {
  try {
    window.localStorage.setItem(DRAWER_WIDTH_STORAGE_KEY, String(width));
  } catch {
    // Ignore storage quota / privacy mode failures
  }
}

export function TopicSheetDrawer({
  topic,
  isCompleted,
  onToggleComplete,
  onClose,
  jumpHighlight,
  onJumpHandled,
}: TopicSheetDrawerProps) {
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [closingTopic, setClosingTopic] = useState<StudyTopic | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const panelRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const displayTopic = topic ?? closingTopic;
  const isOpen = Boolean(topic);
  const activeSlug = displayTopic?.slug ?? null;
  const highlightCtx = useStudyHighlights();
  const setToolMode = highlightCtx?.setToolMode;

  // Automatically enable Pen Mode when Topic Guru Sheet opens and restore normal cursor on close
  useEffect(() => {
    if (!setToolMode) return;
    if (isOpen) {
      setToolMode("pen");
      return () => {
        setToolMode("off");
      };
    }
    setToolMode("off");
  }, [isOpen, topic?.slug, setToolMode]);

  const requestClose = useCallback(() => {
    if (topic) {
      setClosingTopic(topic);
    }
    setIsVisible(false);

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setClosingTopic(null);
      closeTimerRef.current = null;
    }, DRAWER_TRANSITION_MS);

    onClose();
  }, [topic, onClose]);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      let raf1 = 0;
      let raf2 = 0;
      raf1 = window.requestAnimationFrame(() => {
        setClosingTopic(null);
        raf2 = window.requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });

      return () => {
        window.cancelAnimationFrame(raf1);
        window.cancelAnimationFrame(raf2);
      };
    }

    const hideRaf = window.requestAnimationFrame(() => {
      setIsVisible(false);
    });
    return () => {
      window.cancelAnimationFrame(hideRaf);
    };
  }, [isOpen]);

  useEffect(() => {
    const restoreRaf = window.requestAnimationFrame(() => {
      try {
        const raw = window.localStorage.getItem(DRAWER_WIDTH_STORAGE_KEY);
        const parsed = raw ? Number(raw) : NaN;
        if (Number.isFinite(parsed) && parsed >= MIN_DRAWER_WIDTH) {
          setDrawerWidth(clampDrawerWidth(parsed));
        }
      } catch {
        // Ignore storage read failures
      }
    });
    return () => {
      window.cancelAnimationFrame(restoreRaf);
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      dragCleanupRef.current?.();
      dragCleanupRef.current = null;
    };
  }, [isOpen, requestClose]);

  useEffect(() => {
    if (activeSlug && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeSlug]);

  const handleToggleWide = useCallback(() => {
    setDrawerWidth((current) => {
      const targetWide = clampDrawerWidth(
        typeof window === "undefined"
          ? WIDE_DRAWER_WIDTH
          : Math.max(WIDE_DRAWER_WIDTH, Math.round(window.innerWidth * 0.88))
      );
      const isCurrentlyWide = current >= targetWide - 40;
      const next = isCurrentlyWide
        ? clampDrawerWidth(DEFAULT_DRAWER_WIDTH)
        : targetWide;
      persistDrawerWidth(next);
      return next;
    });
  }, []);

  const handleResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();

      const startX = event.clientX;
      const startWidth =
        panelRef.current?.getBoundingClientRect().width ?? drawerWidth;

      const prevCursor = document.body.style.cursor;
      const prevUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      setIsResizing(true);

      let latestWidth = startWidth;
      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = startX - moveEvent.clientX;
        latestWidth = clampDrawerWidth(startWidth + delta);
        setDrawerWidth(latestWidth);
      };

      const stopResize = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", stopResize);
        window.removeEventListener("pointercancel", stopResize);
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevUserSelect;
        setIsResizing(false);
        persistDrawerWidth(latestWidth);
        dragCleanupRef.current = null;
      };

      dragCleanupRef.current?.();
      dragCleanupRef.current = stopResize;

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", stopResize);
      window.addEventListener("pointercancel", stopResize);
    },
    [drawerWidth]
  );

  const handleResizeKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const step = event.shiftKey ? 96 : 40;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setDrawerWidth((w) => {
          const next = clampDrawerWidth(w + step);
          persistDrawerWidth(next);
          return next;
        });
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setDrawerWidth((w) => {
          const next = clampDrawerWidth(w - step);
          persistDrawerWidth(next);
          return next;
        });
      } else if (event.key === "Home") {
        event.preventDefault();
        const next = clampDrawerWidth(MIN_DRAWER_WIDTH);
        persistDrawerWidth(next);
        setDrawerWidth(next);
      } else if (event.key === "End") {
        event.preventDefault();
        const next = clampDrawerWidth(
          typeof window === "undefined"
            ? WIDE_DRAWER_WIDTH
            : window.innerWidth - VIEWPORT_MARGIN
        );
        persistDrawerWidth(next);
        setDrawerWidth(next);
      }
    },
    []
  );

  if (!displayTopic) return null;

  const chaptersCount =
    displayTopic.chapters?.length ?? displayTopic.chapterCount ?? 0;
  const isWide = drawerWidth >= 920;

  return (
    <div
      data-printable-drawer="true"
      className={`fixed inset-0 z-[60] flex justify-end print:static print:inset-auto print:block print:z-auto ${
        isVisible ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Dimmed Backdrop with smooth ease-in-out fade */}
      <div
        aria-hidden="true"
        onClick={requestClose}
        className={`fixed inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out motion-reduce:transition-none print:hidden ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Right Side Sheet Panel with smooth ease-in-out open/close & expand/collapse */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={displayTopic.title}
        style={
          {
            "--drawer-w": `${drawerWidth}px`,
          } as React.CSSProperties
        }
        className={`relative z-10 flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-950/30 will-change-[transform,width] sm:w-[var(--drawer-w)] sm:max-w-[96vw] print:h-auto print:w-full print:max-w-none print:translate-x-0 print:border-0 print:shadow-none ${
          isVisible ? "translate-x-0" : "translate-x-full"
        } ${
          isResizing
            ? "select-none transition-none"
            : "transition-[transform,width] duration-300 ease-in-out motion-reduce:transition-none"
        }`}
      >
        {/* Left-Edge Drag Resize Handle (Desktop / Tablet) */}
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label="Resize lecture sheet drawer width"
          aria-valuemin={MIN_DRAWER_WIDTH}
          aria-valuenow={drawerWidth}
          title="Drag left or right to resize • Double-click to toggle wide view"
          onPointerDown={handleResizePointerDown}
          onDoubleClick={handleToggleWide}
          onKeyDown={handleResizeKeyDown}
          className="group absolute inset-y-0 -left-2 z-20 hidden w-4 cursor-col-resize touch-none items-center justify-center focus:outline-none sm:flex print:hidden"
        >
          <span
            className={`h-full w-0.5 transition-colors duration-200 ease-in-out ${
              isResizing
                ? "bg-emerald-600"
                : "bg-transparent group-hover:bg-emerald-500/80 group-focus-visible:bg-emerald-600"
            }`}
          />
          <span
            className={`absolute flex h-12 w-4 items-center justify-center rounded-full border shadow-sm transition-colors duration-200 ease-in-out ${
              isResizing
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-slate-300 bg-white text-slate-400 group-hover:border-emerald-500 group-hover:bg-emerald-50 group-hover:text-emerald-700"
            }`}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* Live Width Badge While Resizing */}
        {isResizing && (
          <div className="pointer-events-none absolute left-4 top-14 z-30 rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-md print:hidden">
            {drawerWidth}px
          </div>
        )}

        {/* Sticky Top Chrome Bar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2.5 backdrop-blur sm:px-6 print:hidden">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-extrabold text-emerald-900">
              <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
              <span>Topic Guru Sheet</span>
            </span>
            <span className="hidden truncate font-semibold text-slate-500 sm:inline">
              {displayTopic.subject}
              {chaptersCount > 0 ? ` • ${chaptersCount} Chapters` : ""}
            </span>
            <span className="hidden text-[11px] font-medium text-slate-400 lg:inline">
              • Drag left border to resize
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleToggleWide}
              title={isWide ? "Collapse to default width" : "Expand drawer wider"}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors duration-200 ease-in-out hover:bg-slate-100 cursor-pointer sm:inline-flex"
            >
              {isWide ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Expand</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={requestClose}
              aria-label="Close lecture sheet drawer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors duration-200 ease-in-out hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Close</span>
              <kbd className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 md:inline">
                Esc
              </kbd>
            </button>
          </div>
        </div>

        {/* Scrollable Sheet Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain print:overflow-visible"
        >
          <TopicLectureReader
            key={displayTopic.slug}
            topic={displayTopic}
            isCompleted={isCompleted}
            onToggleComplete={onToggleComplete}
            onClose={requestClose}
            inDrawer
            jumpHighlight={jumpHighlight}
            onJumpHandled={onJumpHandled}
          />
        </div>
      </aside>
    </div>
  );
}
