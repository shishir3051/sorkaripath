"use client";

import { useMemo, useState } from "react";
import { Award } from "lucide-react";

export function BcsMarksSimulator() {
  const [bangla, setBangla] = useState(120);
  const [english, setEnglish] = useState(125);
  const [bdAffairs, setBdAffairs] = useState(120);
  const [intlAffairs, setIntlAffairs] = useState(62);
  const [mathMental, setMathMental] = useState(76);
  const [scienceIct, setScienceIct] = useState(68);
  const [viva, setViva] = useState(68);

  const summary = useMemo(() => {
    const writtenTotal =
      bangla + english + bdAffairs + intlAffairs + mathMental + scienceIct;
    const grandTotal = writtenTotal + viva;
    const writtenPassed = writtenTotal >= 450;
    const vivaPassed = viva >= 50;
    const qualified = writtenPassed && vivaPassed;

    let band = "Needs Improvement (Below 50% Pass Threshold)";
    if (qualified && grandTotal >= 680) {
      band = "Highly Competitive for Top General Cadres (Admin / Foreign / Police)";
    } else if (qualified && grandTotal >= 610) {
      band = "Strong Cadre / High-Tier Non-Cadre Zone";
    } else if (qualified) {
      band = "Qualified Merit Pool (Eligible for Cadre / Non-Cadre Recommendation)";
    }

    return { writtenTotal, grandTotal, writtenPassed, vivaPassed, qualified, band };
  }, [bangla, english, bdAffairs, intlAffairs, mathMental, scienceIct, viva]);

  const sliders = [
    { label: "Bangla (200)", val: bangla, set: setBangla, max: 200 },
    { label: "English (200)", val: english, set: setEnglish, max: 200 },
    { label: "Bangladesh Affairs (200)", val: bdAffairs, set: setBdAffairs, max: 200 },
    { label: "International Affairs (100)", val: intlAffairs, set: setIntlAffairs, max: 100 },
    { label: "Math & Mental Ability (100)", val: mathMental, set: setMathMental, max: 100 },
    { label: "General Science & Tech (100)", val: scienceIct, set: setScienceIct, max: 100 },
    { label: "Viva Voce (100)", val: viva, set: setViva, max: 100 },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Award className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            BCS 1,000-Mark Merit Simulator (900 Written + 100 Viva)
          </h2>
          <p className="text-xs text-slate-500">
            Simulate subject targets and verify mandatory 50% pass thresholds
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sliders.map((s) => (
          <div key={s.label} className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>{s.label}</span>
              <span className="text-emerald-700">
                {s.val} / {s.max}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={s.max}
              value={s.val}
              onChange={(e) => s.set(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-slate-900 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-400">
            Simulated Total Merit Score
          </p>
          <p className="text-3xl font-extrabold mt-0.5">
            {summary.grandTotal} <span className="text-base text-slate-400">/ 1000</span>
          </p>
          <p className="mt-1 text-xs text-slate-300">{summary.band}</p>
        </div>
        <div className="space-y-1 text-xs font-bold">
          <p className={summary.writtenPassed ? "text-emerald-400" : "text-rose-400"}>
            Written: {summary.writtenTotal} / 900 (Min 450)
          </p>
          <p className={summary.vivaPassed ? "text-emerald-400" : "text-rose-400"}>
            Viva Voce: {viva} / 100 (Min 50)
          </p>
        </div>
      </div>
    </div>
  );
}
