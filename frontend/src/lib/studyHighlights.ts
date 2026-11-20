import type {
  HighlightColor,
  HighlightStyle,
  StudyHighlight,
} from "@/lib/types";

export const HIGHLIGHT_STORAGE_KEY = "sorkaripath:study-highlights:v1";
export const MAX_LOCAL_HIGHLIGHTS = 400;

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
