"use client";

import { useMemo, useState } from "react";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";

function computeExactAge(dobStr: string, cutoffStr: string) {
  const dob = new Date(dobStr);
  const cutoff = new Date(cutoffStr);
  if (Number.isNaN(dob.getTime()) || Number.isNaN(cutoff.getTime()) || dob > cutoff) {
    return null;
  }

  let years = cutoff.getFullYear() - dob.getFullYear();
  let months = cutoff.getMonth() - dob.getMonth();
  let days = cutoff.getDate() - dob.getDate();

  if (days < 0) {
    const prevMonthLastDay = new Date(
      cutoff.getFullYear(),
      cutoff.getMonth(),
      0
    ).getDate();
    days += prevMonthLastDay;
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const decimalYears = years + months / 12 + days / 365.25;
  return { years, months, days, decimalYears };
}

export function AgeCalculator() {
  const [dob, setDob] = useState("1997-05-15");
  const [cutoff, setCutoff] = useState("2026-11-13");

  const age = useMemo(() => computeExactAge(dob, cutoff), [dob, cutoff]);

  const tracks = useMemo(() => {
    if (!age) return [];
    const withinMax32 =
      age.years < 32 || (age.years === 32 && age.months === 0 && age.days === 0);
    return [
      {
        name: "BCS Cadre & Non-Cadre (Grade 9–12)",
        rule: "21 to 32 years (Unlimited Attempts)",
        eligible: age.years >= 21 && withinMax32,
      },
      {
        name: "State-Owned Banks (BB / BSC Officer & AD)",
        rule: "21 to 32 years (Standard Entry)",
        eligible: age.years >= 21 && withinMax32,
      },
      {
        name: "Ministries & Directorates (Grades 11–20)",
        rule: "18 to 32 years (Entry Staff)",
        eligible: age.years >= 18 && withinMax32,
      },
      {
        name: "Primary Assistant Teacher (DPE)",
        rule: "21 to 32 years",
        eligible: age.years >= 21 && withinMax32,
      },
      {
        name: "Specialized / Senior Technical Posts (where 35+ applies)",
        rule: "Up to 35 / 40 years per specific gazette",
        eligible: age.years >= 21 && age.years <= 35,
      },
    ];
  }, [age]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Govt Job Age &amp; Eligibility Calculator (2026 Rules)
          </h2>
          <p className="text-xs text-slate-500">
            Exact Years, Months &amp; Days calculated against your circular cut-off date
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
            Date of Birth (As per SSC Certificate)
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
            Circular Cut-Off Date
          </label>
          <input
            type="date"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
          />
        </div>
      </div>

      {age ? (
        <>
          <div className="rounded-xl bg-emerald-950 p-4 text-white flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-300 uppercase">
                Calculated Exact Age
              </p>
              <p className="text-2xl font-extrabold mt-0.5">
                {age.years} Years, {age.months} Months, {age.days} Days
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">
              Max Statutory Limit: 32 Years
            </span>
          </div>

          <div className="space-y-2">
            {tracks.map((t) => (
              <div
                key={t.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-slate-500">{t.rule}</p>
                </div>
                {t.eligible ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 shrink-0">
                    <CheckCircle2 className="h-4 w-4" /> Eligible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700 shrink-0">
                    <XCircle className="h-4 w-4" /> Outside Window
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-rose-600 font-semibold">
          Please enter a valid Birth Date earlier than the Cut-Off Date.
        </p>
      )}
    </div>
  );
}
