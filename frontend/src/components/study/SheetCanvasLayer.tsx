"use client";

import { useEffect, useState } from "react";
import { Check, GripHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  INK_COLOR_MAP,
  INK_COLORS,
  pointsToSmoothSvgPath,
} from "@/lib/studyHighlights";
import type { InkColor, SheetDrawingStroke, SheetStickyNote } from "@/lib/types";
import type { HighlightToolMode } from "@/components/study/StudyHighlightContext";

interface SheetCanvasLayerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  drawings: SheetDrawingStroke[];
  activeStroke: SheetDrawingStroke | null;
  notes: SheetStickyNote[];
  editingNoteId: string | null;
  toolMode: HighlightToolMode;
  onSetEditingNoteId: (id: string | null) => void;
  onDeleteDrawing: (id: string) => void;
  onSaveNote: (
    note: Omit<SheetStickyNote, "createdAt"> & { createdAt?: string }
  ) => void;
  onDeleteNote: (id: string) => void;
}

function SheetNoteCard({
  note,
  containerWidth,
  isEditing,
  isEraser,
  onStartEdit,
  onStopEdit,
  onSave,
  onDelete,
}: {
  note: SheetStickyNote;
  containerWidth: number;
  isEditing: boolean;
  isEraser: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onSave: (
    next: Omit<SheetStickyNote, "createdAt"> & { createdAt?: string }
  ) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(note.text);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const colorMeta = INK_COLOR_MAP[note.color] ?? INK_COLOR_MAP.yellow;

  const activeX = dragPos ? dragPos.x : note.x;
  const activeY = dragPos ? dragPos.y : note.y;
  const maxLeftPct = containerWidth > 420 ? 70 : 42;
  const clampedLeftPct = Math.max(1.5, Math.min(maxLeftPct, activeX * 100));

  function commitText(nextText: string) {
    const cleaned = nextText.trim();
    if (!cleaned) {
      onDelete();
      return;
    }
    onSave({
      ...note,
      text: cleaned,
    });
    onStopEdit();
  }

  function handleDragPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isEraser) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    e.stopPropagation();

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = note.x;
    const startY = note.y;
    const width = Math.max(containerWidth, 320);

    let latestX = startX;
    let latestY = startY;

    const handleMove = (moveEvent: PointerEvent) => {
      const dxRatio = (moveEvent.clientX - startClientX) / width;
      const dyPx = moveEvent.clientY - startClientY;
      latestX = Math.max(0.015, Math.min(0.75, startX + dxRatio));
      latestY = Math.max(12, startY + dyPx);
      setDragPos({ x: latestX, y: latestY });
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      setDragPos(null);
      if (latestX !== startX || latestY !== startY) {
        onSave({
          ...note,
          x: Number(latestX.toFixed(4)),
          y: Math.round(latestY),
        });
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  }

  return (
    <div
      data-sheet-note="true"
      data-hl-ignore="true"
      onClick={(e) => {
        e.stopPropagation();
        if (isEraser) {
          onDelete();
        }
      }}
      style={{
        left: `${clampedLeftPct}%`,
        top: `${Math.max(12, Math.round(activeY))}px`,
      }}
      className={`pointer-events-auto absolute z-30 w-56 sm:w-64 rounded-xl border shadow-md backdrop-blur-xs transition-shadow ${
        colorMeta.noteCardClass
      } ${
        isEraser
          ? "cursor-pointer hover:ring-2 hover:ring-rose-500 hover:opacity-80"
          : "hover:shadow-lg"
      }`}
    >
      {/* Top Drag & Color Bar */}
      <div
        onPointerDown={handleDragPointerDown}
        className={`flex items-center justify-between gap-1.5 border-b border-black/10 px-2.5 py-1.5 ${
          isEraser ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
        }`}
      >
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
          <GripHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <span>Note</span>
        </div>

        <div className="flex items-center gap-1 print:hidden">
          {INK_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              title={`Note color: ${c.label}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                onSave({ ...note, color: c.id as InkColor });
              }}
              className={`h-3 w-3 rounded-full border cursor-pointer ${
                c.swatchClass
              } ${note.color === c.id ? "ring-1 ring-slate-900 scale-110" : "opacity-65 hover:opacity-100"}`}
            />
          ))}
          {!isEditing && (
            <button
              type="button"
              title="Edit note"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setDraft(note.text);
                onStartEdit();
              }}
              className="ml-0.5 rounded p-0.5 text-slate-500 hover:bg-black/5 hover:text-slate-900 cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            title="Delete note"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-0.5 text-rose-600 hover:bg-rose-100 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Editable or Rendered Note Body */}
      <div className="p-2.5">
        {isEditing ? (
          <div className="space-y-1.5">
            <textarea
              autoFocus
              rows={3}
              maxLength={1500}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  if (!note.text.trim()) {
                    onDelete();
                  } else {
                    onStopEdit();
                  }
                } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  commitText(draft);
                }
              }}
              onBlur={() => commitText(draft)}
              placeholder="Write Bangla or English note here..."
              className="w-full resize-y rounded-lg border border-black/15 bg-white/85 px-2 py-1.5 text-xs text-slate-900 leading-relaxed focus:border-emerald-600 focus:outline-none font-bangla"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Ctrl+Enter to save</span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitText(draft)}
                className="inline-flex items-center gap-0.5 rounded bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-800 cursor-pointer"
              >
                <Check className="h-2.5 w-2.5" />
                <span>Done</span>
              </button>
            </div>
          </div>
        ) : (
          <p
            onDoubleClick={(e) => {
              e.stopPropagation();
              setDraft(note.text);
              onStartEdit();
            }}
            title="Double-click to edit"
            className="whitespace-pre-wrap break-words text-xs text-slate-900 leading-relaxed font-bangla"
          >
            {note.text}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Renders smooth freehand SVG ink strokes and draggable/editable typed sheet notes
 * cleanly over any StudyHighlightScope container without blocking button hovers/clicks.
 */
export function SheetCanvasLayer({
  containerRef,
  drawings,
  activeStroke,
  notes,
  editingNoteId,
  toolMode,
  onSetEditingNoteId,
  onDeleteDrawing,
  onSaveNote,
  onDeleteNote,
}: SheetCanvasLayerProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      setSize({
        width: el.clientWidth,
        height: el.scrollHeight,
      });
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  const allStrokes = activeStroke ? [...drawings, activeStroke] : drawings;
  const isEraser = toolMode === "eraser";

  return (
    <>
      {allStrokes.length > 0 && size.width > 0 && (
        <svg
          aria-hidden="true"
          width={size.width}
          height={Math.max(size.height, 200)}
          viewBox={`0 0 ${size.width} ${Math.max(size.height, 200)}`}
          className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
        >
          {allStrokes.map((stroke) => {
            const pathData = pointsToSmoothSvgPath(stroke.points, size.width);
            if (!pathData) return null;
            const colorHex =
              (INK_COLOR_MAP[stroke.color] ?? INK_COLOR_MAP.dark).strokeHex;
            const isMarkerWidth = stroke.width >= 8;

            return (
              <g key={stroke.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={colorHex}
                  strokeWidth={stroke.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={isMarkerWidth ? 0.42 : 0.92}
                />
                {isEraser && !activeStroke && (
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(16, stroke.width + 12)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: "stroke", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDrawing(stroke.id);
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      )}

      {notes.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
          {notes.map((note) => (
            <SheetNoteCard
              key={note.id}
              note={note}
              containerWidth={size.width}
              isEditing={editingNoteId === note.id}
              isEraser={isEraser}
              onStartEdit={() => onSetEditingNoteId(note.id)}
              onStopEdit={() => onSetEditingNoteId(null)}
              onSave={onSaveNote}
              onDelete={() => onDeleteNote(note.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
