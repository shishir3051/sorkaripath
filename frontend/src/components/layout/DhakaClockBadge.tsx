"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface DhakaClockBadgeProps {
  variant?: "hero" | "light";
}

function formatDhakaLive(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  }).format(date);
}

export function DhakaClockBadge({ variant = "hero" }: DhakaClockBadgeProps) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    const update = () => setFormatted(formatDhakaLive(new Date()));
    const raf = requestAnimationFrame(update);
    const id = setInterval(update, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  const isHero = variant === "hero";

  return (
    <span
      suppressHydrationWarning
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        isHero
          ? "bg-white/10 text-emerald-100 ring-1 ring-white/20"
          : "bg-slate-100 text-slate-700 border border-slate-200"
      }`}
    >
      <Clock
        className={`h-3.5 w-3.5 ${isHero ? "text-emerald-300" : "text-emerald-700"}`}
      />
      <span>{formatted ? `${formatted} (BST)` : "Dhaka Time (BST)"}</span>
    </span>
  );
}
