import { AgeCalculator } from "@/components/tools/AgeCalculator";
import { PayScaleCalculator } from "@/components/tools/PayScaleCalculator";
import { BcsMarksSimulator } from "@/components/tools/BcsMarksSimulator";

export default function ToolsPage() {
  return (
    <div className="app-container py-5 sm:py-6 space-y-6">
      <div>
        <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
          Interactive Career Utilities
        </span>
        <h1 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          2026 Govt Job Calculators &amp; Simulators
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Calculate exact age eligibility under the 32-year rule, estimate monthly
          compensation under the 9th National Pay Scale 2026, and plan BCS merit targets.
        </p>
      </div>

      <AgeCalculator />
      <PayScaleCalculator />
      <BcsMarksSimulator />
    </div>
  );
}
