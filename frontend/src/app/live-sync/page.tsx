import { LiveSyncConsole } from "@/components/live-sync/LiveSyncConsole";

export default function LiveSyncPage() {
  return (
    <div className="app-container py-8 space-y-6">
      <div>
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          Real-Time Web Intelligence
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
          Live Web Sync Console &amp; Circular Publisher
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-3xl">
          Monitor every connected official Bangladesh government &amp; bank notice
          source, inspect sync audit logs, trigger on-demand scraping, or publish
          curated circulars.
        </p>
      </div>

      <LiveSyncConsole />
    </div>
  );
}
