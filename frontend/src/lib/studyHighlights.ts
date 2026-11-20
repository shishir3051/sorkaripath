import type {
  DrawingPoint,
  HighlightColor,
  HighlightStyle,
  InkColor,
  SheetDrawingStroke,
  SheetStickyNote,
  StudyHighlight,
} from "@/lib/types";

export const HIGHLIGHT_STORAGE_KEY = "sorkaripath:study-highlights:v1";
export const DRAWING_STORAGE_KEY = "sorkaripath:study-drawings:v1";
export const NOTE_STORAGE_KEY = "sorkaripath:study-notes:v1";
export const MAX_LOCAL_HIGHLIGHTS = 400;
export const MAX_LOCAL_DRAWINGS = 600;
export const MAX_LOCAL_NOTES = 200;

export interface InkColorMeta {
  id: InkColor;
  label: string;
  strokeHex: string;
  swatchClass: string;
  noteCardClass: string;
}

export const INK_COLORS: InkColorMeta[] = [
  {
    id: "dark",
    label: "Black",
    strokeHex: "#0f172a",
    swatchClass: "bg-slate-900 border-slate-950",
    noteCardClass: "bg-white/95 border-slate-300 text-slate-900",
  },
  {
    id: "blue",
    label: "Blue",
    strokeHex: "#0284c7",
    swatchClass: "bg-sky-500 border-sky-700",
    noteCardClass: "bg-sky-50/95 border-sky-300 text-slate-900",
  },
  {
    id: "green",
    label: "Green",
    strokeHex: "#059669",
    swatchClass: "bg-emerald-500 border-emerald-700",
    noteCardClass: "bg-emerald-50/95 border-emerald-300 text-slate-900",
  },
  {
    id: "pink",
    label: "Red / Pink",
    strokeHex: "#e11d48",
    swatchClass: "bg-rose-500 border-rose-700",
    noteCardClass: "bg-rose-50/95 border-rose-300 text-slate-900",
  },
  {
    id: "yellow",
    label: "Amber",
    strokeHex: "#eab308",
    swatchClass: "bg-amber-400 border-amber-600",
    noteCardClass: "bg-amber-50/95 border-amber-300 text-slate-900",
  },
];

export const INK_COLOR_MAP: Record<InkColor, InkColorMeta> = {
  dark: INK_COLORS[0],
  blue: INK_COLORS[1],
  green: INK_COLORS[2],
  pink: INK_COLORS[3],
  yellow: INK_COLORS[4],
};

export const DRAW_WIDTH_OPTIONS = [
  { width: 2, label: "Fine" },
  { width: 4, label: "Medium" },
  { width: 10, label: "Marker" },
] as const;

export interface HighlightColorMeta {
  id: HighlightColor;
  label: string;
  labelBn: string;
  hint: string;
  markClass: string;
  underlineClass: string;
  wavyClass: string;
  boxClass: string;
  swatchClass: string;
  badgeClass: string;
  borderClass: string;
}

export interface HighlightStyleMeta {
  id: HighlightStyle;
  label: string;
  shortLabel: string;
  hint: string;
}

export const HIGHLIGHT_STYLES: HighlightStyleMeta[] = [
  {
    id: "highlight",
    label: "Marker",
    shortLabel: "Mark",
    hint: "Highlight background",
  },
  {
    id: "underline",
    label: "Underline",
    shortLabel: "Line",
    hint: "Solid pen underline",
  },
  {
    id: "wavy",
    label: "Wavy",
    shortLabel: "Wavy",
    hint: "Wavy emphasis underline",
  },
  {
    id: "box",
    label: "Box",
    shortLabel: "Box",
    hint: "Framed keyword box",
  },
];

export const HIGHLIGHT_COLORS: HighlightColorMeta[] = [
  {
    id: "yellow",
    label: "Yellow",
    labelBn: "হলুদ",
    hint: "Key Facts",
    markClass: "bg-yellow-200/90 text-slate-950",
    underlineClass: "bg-transparent underline decoration-amber-500 decoration-2 underline-offset-[3px]",
    wavyClass: "bg-transparent underline decoration-amber-500 decoration-wavy decoration-[1.5px] underline-offset-[3px]",
    boxClass: "bg-yellow-50/90 text-slate-950 ring-1 ring-inset ring-amber-400 px-0.5",
    swatchClass: "bg-yellow-300 border-yellow-500",
    badgeClass: "bg-yellow-100 text-yellow-950 border-yellow-300",
    borderClass: "border-l-yellow-400",
  },
  {
    id: "green",
    label: "Green",
    labelBn: "সবুজ",
    hint: "Rules & Formulas",
    markClass: "bg-emerald-200/85 text-slate-950",
    underlineClass: "bg-transparent underline decoration-emerald-600 decoration-2 underline-offset-[3px]",
    wavyClass: "bg-transparent underline decoration-emerald-600 decoration-wavy decoration-[1.5px] underline-offset-[3px]",
    boxClass: "bg-emerald-50/90 text-slate-950 ring-1 ring-inset ring-emerald-500 px-0.5",
    swatchClass: "bg-emerald-300 border-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-950 border-emerald-300",
    borderClass: "border-l-emerald-500",
  },
  {
    id: "pink",
    label: "Pink",
    labelBn: "গোলাপি",
    hint: "Exam Traps",
    markClass: "bg-rose-200/85 text-slate-950",
    underlineClass: "bg-transparent underline decoration-rose-500 decoration-2 underline-offset-[3px]",
    wavyClass: "bg-transparent underline decoration-rose-500 decoration-wavy decoration-[1.5px] underline-offset-[3px]",
    boxClass: "bg-rose-50/90 text-slate-950 ring-1 ring-inset ring-rose-400 px-0.5",
    swatchClass: "bg-rose-300 border-rose-500",
    badgeClass: "bg-rose-100 text-rose-950 border-rose-300",
    borderClass: "border-l-rose-400",
  },
  {
    id: "blue",
    label: "Blue",
    labelBn: "নীল",
    hint: "Examples & Refs",
    markClass: "bg-sky-200/85 text-slate-950",
    underlineClass: "bg-transparent underline decoration-sky-600 decoration-2 underline-offset-[3px]",
    wavyClass: "bg-transparent underline decoration-sky-600 decoration-wavy decoration-[1.5px] underline-offset-[3px]",
    boxClass: "bg-sky-50/90 text-slate-950 ring-1 ring-inset ring-sky-500 px-0.5",
    swatchClass: "bg-sky-300 border-sky-500",
    badgeClass: "bg-sky-100 text-sky-950 border-sky-300",
    borderClass: "border-l-sky-400",
  },
];

export const HIGHLIGHT_COLOR_MAP: Record<HighlightColor, HighlightColorMeta> = {
  yellow: HIGHLIGHT_COLORS[0],
  green: HIGHLIGHT_COLORS[1],
  pink: HIGHLIGHT_COLORS[2],
  blue: HIGHLIGHT_COLORS[3],
};

/**
 * Returns Tailwind classes for the given highlight color + pen style (highlight/underline/wavy/box).
 */
export function getHighlightMarkClass(
  color: HighlightColor,
  style: HighlightStyle = "highlight"
): string {
  const meta = HIGHLIGHT_COLOR_MAP[color] ?? HIGHLIGHT_COLOR_MAP.yellow;
  if (style === "underline") return meta.underlineClass;
  if (style === "wavy") return meta.wavyClass;
  if (style === "box") return meta.boxClass;
  return meta.markClass;
}

export interface TextSegment {
  start: number;
  end: number;
  text: string;
  highlight: StudyHighlight | null;
}

/**
 * Splits plain text into strictly non-overlapping segments covering [0, text.length).
 * Later highlights win on overlapping character ranges so React renders a flat mark list.
 */
export function resolveBlockSegments(
  text: string,
  highlights: StudyHighlight[]
): TextSegment[] {
  if (!text) return [];
  if (!highlights.length) {
    return [{ start: 0, end: text.length, text, highlight: null }];
  }

  const ordered = [...highlights].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );

  let segments: Array<{
    start: number;
    end: number;
    highlight: StudyHighlight | null;
  }> = [{ start: 0, end: text.length, highlight: null }];

  for (const hl of ordered) {
    let start = Math.max(0, Math.min(text.length, hl.start));
    let end = Math.max(0, Math.min(text.length, hl.end));

    if (end <= start || text.slice(start, end) !== hl.text) {
      const fallbackIdx = hl.text ? text.indexOf(hl.text) : -1;
      if (fallbackIdx !== -1) {
        start = fallbackIdx;
        end = fallbackIdx + hl.text.length;
      } else if (end <= start) {
        continue;
      }
    }

    const next: typeof segments = [];
    for (const seg of segments) {
      if (seg.end <= start || seg.start >= end) {
        next.push(seg);
        continue;
      }
      if (seg.start < start) {
        next.push({ start: seg.start, end: start, highlight: seg.highlight });
      }
      next.push({
        start: Math.max(seg.start, start),
        end: Math.min(seg.end, end),
        highlight: hl,
      });
      if (seg.end > end) {
        next.push({ start: end, end: seg.end, highlight: seg.highlight });
      }
    }
    segments = next;
  }

  const merged: TextSegment[] = [];
  for (const seg of segments) {
    if (seg.end <= seg.start) continue;
    const prev = merged[merged.length - 1];
    if (
      prev &&
      prev.end === seg.start &&
      prev.highlight?.id === seg.highlight?.id
    ) {
      prev.end = seg.end;
      prev.text = text.slice(prev.start, prev.end);
    } else {
      merged.push({
        start: seg.start,
        end: seg.end,
        text: text.slice(seg.start, seg.end),
        highlight: seg.highlight,
      });
    }
  }

  return merged;
}

export interface ExtractedSelectionSlice {
  blockId: string;
  sectionLabel: string;
  text: string;
  start: number;
  end: number;
}

export interface ExtractedSelectionResult {
  slices: ExtractedSelectionSlice[];
  rect: DOMRect;
}

function getOffsetWithinElement(
  containerEl: HTMLElement,
  targetNode: Node,
  targetOffset: number
): number {
  const preRange = document.createRange();
  preRange.selectNodeContents(containerEl);
  preRange.setEnd(targetNode, targetOffset);
  return preRange.toString().length;
}

function findBlockAncestor(node: Node | null): HTMLElement | null {
  if (!node) return null;
  const el =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  return el?.closest<HTMLElement>("[data-hl-block]") ?? null;
}

function isInsideIgnoredElement(node: Node | null): boolean {
  if (!node) return false;
  const el =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  return Boolean(
    el?.closest("input, textarea, select, button, [data-hl-ignore='true']")
  );
}

/**
 * Extracts exact UTF-16 character offsets across one or more [data-hl-block] elements
 * for the current browser Selection, scoped strictly to `scopeKey`.
 */
export function extractSelectionSlices(
  selection: Selection | null,
  rootEl: HTMLElement | null,
  scopeKey: string
): ExtractedSelectionResult | null {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !rootEl) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!rootEl.contains(range.commonAncestorContainer)) {
    return null;
  }

  if (
    isInsideIgnoredElement(range.startContainer) ||
    isInsideIgnoredElement(range.endContainer)
  ) {
    return null;
  }

  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  const startBlock = findBlockAncestor(range.startContainer);
  const endBlock = findBlockAncestor(range.endContainer);

  let targetBlocks: HTMLElement[] = [];
  if (
    startBlock &&
    startBlock === endBlock &&
    startBlock.dataset.hlScope === scopeKey
  ) {
    targetBlocks = [startBlock];
  } else {
    const allBlocks = Array.from(
      rootEl.querySelectorAll<HTMLElement>("[data-hl-block]")
    );
    targetBlocks = allBlocks.filter(
      (el) => el.dataset.hlScope === scopeKey && range.intersectsNode(el)
    );
  }

  const slices: ExtractedSelectionSlice[] = [];
  for (const block of targetBlocks) {
    const blockId = block.dataset.hlBlock;
    if (!blockId) continue;

    const rawText = block.textContent ?? "";
    if (!rawText) continue;

    let start = 0;
    let end = rawText.length;

    try {
      if (block === startBlock && block.contains(range.startContainer)) {
        start = getOffsetWithinElement(
          block,
          range.startContainer,
          range.startOffset
        );
      }
      if (block === endBlock && block.contains(range.endContainer)) {
        end = getOffsetWithinElement(block, range.endContainer, range.endOffset);
      }
    } catch {
      continue;
    }

    start = Math.max(0, Math.min(rawText.length, start));
    end = Math.max(0, Math.min(rawText.length, end));
    if (end <= start) continue;

    // Trim surrounding whitespace without losing internal spacing
    while (start < end && /\s/.test(rawText[start])) start += 1;
    while (end > start && /\s/.test(rawText[end - 1])) end -= 1;
    if (end <= start) continue;

    const trimmedEnd = Math.min(end, start + 1200);
    const snippet = rawText.slice(start, trimmedEnd);
    if (!snippet.trim()) continue;

    slices.push({
      blockId,
      sectionLabel: block.dataset.hlSection ?? "",
      text: snippet,
      start,
      end: trimmedEnd,
    });
  }

  if (!slices.length) return null;
  return { slices, rect };
}

export function createHighlightId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `hl-${Date.now().toString(36)}-${rand}`;
}

export function getHighlightStorageKey(userId?: string | null): string {
  return userId
    ? `${HIGHLIGHT_STORAGE_KEY}:${userId}`
    : HIGHLIGHT_STORAGE_KEY;
}

export function loadLocalHighlights(userId?: string | null): StudyHighlight[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getHighlightStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StudyHighlight =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.scopeKey === "string" &&
        typeof item.blockId === "string" &&
        typeof item.text === "string" &&
        typeof item.start === "number" &&
        typeof item.end === "number" &&
        item.end > item.start
    );
  } catch {
    return [];
  }
}

export function saveLocalHighlights(
  items: StudyHighlight[],
  userId?: string | null
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getHighlightStorageKey(userId),
      JSON.stringify(items.slice(-MAX_LOCAL_HIGHLIGHTS))
    );
  } catch {
    // Ignore private mode / quota errors
  }
}

export function mergeHighlights(
  localItems: StudyHighlight[],
  serverItems: StudyHighlight[]
): { merged: StudyHighlight[]; unsyncedLocal: StudyHighlight[] } {
  const serverIds = new Set(serverItems.map((h) => h.id));
  const byId = new Map<string, StudyHighlight>();

  for (const item of serverItems) {
    byId.set(item.id, item);
  }
  const unsyncedLocal: StudyHighlight[] = [];
  for (const item of localItems) {
    if (!serverIds.has(item.id)) {
      byId.set(item.id, item);
      unsyncedLocal.push(item);
    }
  }

  const merged = Array.from(byId.values())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-MAX_LOCAL_HIGHLIGHTS);

  return { merged, unsyncedLocal };
}

function getScopedStorageKey(base: string, userId?: string | null): string {
  return userId ? `${base}:${userId}` : base;
}

export function loadLocalDrawings(userId?: string | null): SheetDrawingStroke[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(
      getScopedStorageKey(DRAWING_STORAGE_KEY, userId)
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SheetDrawingStroke =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.scopeKey === "string" &&
        Array.isArray(item.points) &&
        item.points.length > 0
    );
  } catch {
    return [];
  }
}

export function saveLocalDrawings(
  items: SheetDrawingStroke[],
  userId?: string | null
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getScopedStorageKey(DRAWING_STORAGE_KEY, userId),
      JSON.stringify(items.slice(-MAX_LOCAL_DRAWINGS))
    );
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function mergeDrawings(
  localItems: SheetDrawingStroke[],
  serverItems: SheetDrawingStroke[]
): { merged: SheetDrawingStroke[]; unsyncedLocal: SheetDrawingStroke[] } {
  const serverIds = new Set(serverItems.map((d) => d.id));
  const byId = new Map<string, SheetDrawingStroke>();
  for (const item of serverItems) byId.set(item.id, item);

  const unsyncedLocal: SheetDrawingStroke[] = [];
  for (const item of localItems) {
    if (!serverIds.has(item.id)) {
      byId.set(item.id, item);
      unsyncedLocal.push(item);
    }
  }

  const merged = Array.from(byId.values())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-MAX_LOCAL_DRAWINGS);

  return { merged, unsyncedLocal };
}

export function loadLocalNotes(userId?: string | null): SheetStickyNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(
      getScopedStorageKey(NOTE_STORAGE_KEY, userId)
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SheetStickyNote =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.scopeKey === "string" &&
        typeof item.x === "number" &&
        typeof item.y === "number"
    );
  } catch {
    return [];
  }
}

export function saveLocalNotes(
  items: SheetStickyNote[],
  userId?: string | null
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getScopedStorageKey(NOTE_STORAGE_KEY, userId),
      JSON.stringify(items.slice(-MAX_LOCAL_NOTES))
    );
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function mergeNotes(
  localItems: SheetStickyNote[],
  serverItems: SheetStickyNote[]
): { merged: SheetStickyNote[]; unsyncedLocal: SheetStickyNote[] } {
  const serverIds = new Set(serverItems.map((n) => n.id));
  const byId = new Map<string, SheetStickyNote>();
  for (const item of serverItems) byId.set(item.id, item);

  const unsyncedLocal: SheetStickyNote[] = [];
  for (const item of localItems) {
    if (!serverIds.has(item.id)) {
      byId.set(item.id, item);
      unsyncedLocal.push(item);
    }
  }

  const merged = Array.from(byId.values())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-MAX_LOCAL_NOTES);

  return { merged, unsyncedLocal };
}

/**
 * Converts normalized drawing points (x in [0..1] of container width, y in px)
 * into a smooth SVG path string using midpoint quadratic Bezier smoothing.
 */
export function pointsToSmoothSvgPath(
  points: DrawingPoint[],
  containerWidth: number
): string {
  if (!points.length || containerWidth <= 0) return "";
  const toScreen = (pt: DrawingPoint) => ({
    x: Number((pt.x * containerWidth).toFixed(1)),
    y: Number(pt.y.toFixed(1)),
  });

  if (points.length === 1) {
    const p = toScreen(points[0]);
    return `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y + 0.1}`;
  }

  const first = toScreen(points[0]);
  if (points.length === 2) {
    const second = toScreen(points[1]);
    return `M ${first.x} ${first.y} L ${second.x} ${second.y}`;
  }

  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const curr = toScreen(points[i]);
    const next = toScreen(points[i + 1]);
    const midX = Number(((curr.x + next.x) / 2).toFixed(1));
    const midY = Number(((curr.y + next.y) / 2).toFixed(1));
    d += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`;
  }

  const last = toScreen(points[points.length - 1]);
  d += ` L ${last.x} ${last.y}`;
  return d;
}
