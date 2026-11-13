"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { apiFetch, getOrCreateSessionId } from "@/lib/api";
import type { LearnerProgress } from "@/lib/types";

export function LessonCompleteButton({ lessonSlug }: { lessonSlug: string }) {
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sid = getOrCreateSessionId();
    apiFetch<LearnerProgress>(`/progress/${encodeURIComponent(sid)}`)
      .then((p) => setCompleted(p.completedLessonSlugs.includes(lessonSlug)))
      .catch(() => {});
  }, [lessonSlug]);

  async function toggle() {
    setBusy(true);
    try {
      const sid = getOrCreateSessionId();
      const updated = await apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/toggle-lesson`,
        {
          method: "POST",
          body: JSON.stringify({ lessonSlug }),
        }
      );
      setCompleted(updated.completedLessonSlugs.includes(lessonSlug));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors cursor-pointer ${
        completed
          ? "bg-emerald-700 text-white hover:bg-emerald-800"
          : "border border-emerald-700 bg-white text-emerald-800 hover:bg-emerald-50"
      }`}
    >
      {completed ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          <span>Completed (Click to Undo)</span>
        </>
      ) : (
        <>
          <Circle className="h-4 w-4" />
          <span>Mark Module Complete</span>
        </>
      )}
    </button>
  );
}
