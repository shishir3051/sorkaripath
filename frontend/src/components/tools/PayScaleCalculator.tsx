"use client";

import { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import {
  calculateEstimatedSalary,
  PAY_GRADES_2026,
  type CityTier,
  type PayPhase,
} from "@/lib/payScale2026";

export function PayScaleCalculator() {
  const [gradeNum, setGradeNum] = useState(9);
  const [phase, setPhase] = useState<PayPhase>("phase3");
  const [city, setCity] = useState<CityTier>("dhaka");

  const selectedGrade = useMemo(
    () => PAY_GRADES_2026.find((g) => g.grade === gradeNum) || PAY_GRADES_2026[8],
    [gradeNum]
  );

  const calc = useMemo(
    () => calculateEstimatedSalary(selectedGrade, phase, city),
    [selectedGrade, phase, city]
  );

  const fmt = (n: number) => `৳${n.toLocaleString("en-IN")}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            9th National Pay Scale 2026 Salary Estimator
          </h2>
          <p className="text-xs text-slate-500">
            Service (Pay and Allowances) Order, 2026 • Grades 1–20 phased rollout
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
            Pay Grade (1–20)
          </label>
          <select
            value={gradeNum}
            onChange={(e) => setGradeNum(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
          >
            {PAY_GRADES_2026.map((g) => (
              <option key={g.grade} value={g.grade}>
                {g.label} — {g.typicalRoles}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
            Rollout Phase
          </label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as PayPhase)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
          >
            <option value="phase1">Phase 1 (Jul–Dec 2026: 40% / 50%)</option>
            <option value="phase2">Phase 2 (Jan–Jun 2027: 70% / 75%)</option>
            <option value="phase3">Phase 3 (Jul 2027+: Full 100%)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
            Posting Location
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value as CityTier)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
          >
            <option value="dhaka">Dhaka Metropolitan</option>
            <option value="metro">Other City Corporations</option>
            <option value="district">District / Upazila</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
          <p className="text-[11px] font-bold uppercase text-slate-500">
            2015 Basic
          </p>
          <p className="mt-1 text-lg font-extrabold text-slate-700">
            {fmt(selectedGrade.basic2015)}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5">
          <p className="text-[11px] font-bold uppercase text-emerald-700">
            Active Basic ({calc.phasePercent}% Rise)
          </p>
          <p className="mt-1 text-lg font-extrabold text-emerald-900">
            {fmt(calc.activeBasic)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
          <p className="text-[11px] font-bold uppercase text-slate-500">
            House Rent + Allowances
          </p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">
            {fmt(calc.houseRent + calc.medicalAllowance + calc.otherAllowances)}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-900 p-3.5 text-white">
          <p className="text-[11px] font-bold uppercase text-emerald-300">
            Est. Gross Monthly
          </p>
          <p className="mt-1 text-xl font-extrabold">{fmt(calc.grossEstimate)}</p>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Note: Grades 1 (৳1,56,000), 9 (৳44,000), and 20 (৳20,000) reflect exact
        gazetted 2026 starting basics; intermediate grades reflect the official
        100% (Grades 1–11) and 115%–142% (Grades 12–20) scale bands. Final net
        pay varies with GPF, tax &amp; specific departmental allowances.
      </p>
    </div>
  );
}
