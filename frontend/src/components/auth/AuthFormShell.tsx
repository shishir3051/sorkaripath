import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

const UNLOCKED_PERKS = [
  {
    icon: GraduationCap,
    title: "Study Hub & 50+ Topic Guru Lecture Sheets",
    desc: "Complete 9-subject sheets, 30-day routine, Written/Typing/Viva Lab & highlighter sync.",
  },
  {
    icon: BookOpen,
    title: "A–Z Govt Career Academy (26 Modules)",
    desc: "Step-by-step mastery from Teletalk setup to Police Verification & Gazette joining.",
  },
  {
    icon: Target,
    title: "MCQ Arena, Past Papers & Mistake Vault",
    desc: "Timed mock tests with -0.50 negative marking, attempt history & weak-question tracking.",
  },
  {
    icon: Sparkles,
    title: "Gemini AI Study Tutor & 5-MCQ Generator",
    desc: "Ask Bangla/English concepts and generate fresh exam questions from any sheet.",
  },
];

export function AuthFormShell({
  badge,
  title,
  subtitle,
  children,
}: {
  badge: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-container py-8 sm:py-12">
      <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Study Lock Info Panel */}
        <div className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-6 sm:p-8 text-white shadow-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200 ring-1 ring-white/20">
            <LockKeyhole className="h-3.5 w-3.5 text-emerald-300" />
            <span>{badge}</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
              {title}
            </h1>
            <p className="mt-2 text-sm text-emerald-100/85 leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="space-y-3.5 pt-2 border-t border-white/15">
            {UNLOCKED_PERKS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-emerald-100/75 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl bg-black/20 p-4 text-xs text-emerald-100/90 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              <span>Public Portal Stays Open</span>
            </div>
            <p className="leading-relaxed">
              Live job circulars, official notices, and 2026 Age/Pay Calculators remain
              open to browse.{" "}
              <Link href="/jobs" className="underline text-white font-semibold">
                Browse Circulars
              </Link>
              .
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-200/80">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Your progress, highlights &amp; Mistake Vault sync securely across devices.</span>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
