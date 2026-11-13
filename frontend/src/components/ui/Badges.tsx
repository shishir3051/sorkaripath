import type { JobOrigin, RecordType } from "@/lib/types";

export function OriginBadge({ origin }: { origin: JobOrigin }) {
  if (origin === "web_sync") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        Live Web Sync
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
      Curated Guide
    </span>
  );
}

const RECORD_STYLES: Record<RecordType, { label: string; cls: string }> = {
  circular: { label: "Circular", cls: "bg-blue-100 text-blue-800" },
  notice: { label: "Official Notice", cls: "bg-slate-100 text-slate-700" },
  result: { label: "Result", cls: "bg-purple-100 text-purple-800" },
  admit_card: { label: "Admit Card", cls: "bg-teal-100 text-teal-800" },
  exam_schedule: { label: "Exam / Viva Schedule", cls: "bg-rose-100 text-rose-800" },
};

export function RecordTypeBadge({ type }: { type: RecordType }) {
  const item = RECORD_STYLES[type] || RECORD_STYLES.notice;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${item.cls}`}
    >
      {item.label}
    </span>
  );
}
