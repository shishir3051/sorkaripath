import { AgeCalculator } from "@/components/tools/AgeCalculator";
import { PayScaleCalculator } from "@/components/tools/PayScaleCalculator";
import { BcsMarksSimulator } from "@/components/tools/BcsMarksSimulator";

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
          Interactive Career Utilities
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
          2026 Govt Job Calculators &amp; Simulators
        </h1>
        <p className="mt-1 text-sm text-slate-600">
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
