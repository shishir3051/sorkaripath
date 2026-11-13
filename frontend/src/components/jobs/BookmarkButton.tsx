"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { apiFetch, getOrCreateSessionId } from "@/lib/api";
import type { LearnerProgress } from "@/lib/types";

export function BookmarkButton({ jobSlug }: { jobSlug: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sid = getOrCreateSessionId();
    apiFetch<LearnerProgress>(`/progress/${encodeURIComponent(sid)}`)
      .then((p) => {
        setBookmarked(p.bookmarkedJobSlugs.includes(jobSlug));
      })
      .catch(() => {});
  }, [jobSlug]);

  async function toggle() {
    setBusy(true);
    try {
      const sid = getOrCreateSessionId();
      const updated = await apiFetch<LearnerProgress>(
        `/progress/${encodeURIComponent(sid)}/toggle-bookmark`,
        {
          method: "POST",
          body: JSON.stringify({ jobSlug }),
        }
      );
      setBookmarked(updated.bookmarkedJobSlugs.includes(jobSlug));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer ${
        bookmarked
          ? "bg-amber-100 text-amber-900 border border-amber-300"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
      }`}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-amber-600 text-amber-600" : ""}`} />
      <span>{bookmarked ? "Saved in Bookmarks" : "Bookmark Notice"}</span>
    </button>
  );
}
