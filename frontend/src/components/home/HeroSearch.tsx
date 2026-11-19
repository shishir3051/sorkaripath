"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-2.5 rounded-2xl bg-white p-2 shadow-xl shadow-slate-950/25 ring-1 ring-white/25">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3">
          <Search className="h-5 w-5 text-emerald-700 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search circulars, BCS, Bangladesh Bank, MOPA, Grade 9..."
            className="min-w-0 w-full py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
        >
          <span>Search Jobs</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
