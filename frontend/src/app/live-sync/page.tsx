import { LiveSyncConsole } from "@/components/live-sync/LiveSyncConsole";

export default function LiveSyncPage() {
  return (
    <div className="app-container py-5 sm:py-6 space-y-5">
      <div>
        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
          Real-Time Web Intelligence
        </span>
        <h1 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Live Web Sync Console &amp; Circular Publisher
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl">
          Monitor every connected official Bangladesh government &amp; bank notice
          source, inspect sync audit logs, trigger on-demand scraping, or publish
          curated circulars.
        </p>
      </div>

      <LiveSyncConsole />
    </div>
  );
}
