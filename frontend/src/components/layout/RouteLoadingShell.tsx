interface RouteLoadingShellProps {
  variant?: "cards" | "list" | "article" | "dashboard";
  includeHeader?: boolean;
}

/**
 * Shared instant-navigation skeleton so route switches commit in one frame
 * while server payloads stream from Express/MongoDB.
 */
export function RouteLoadingShell({
  variant = "cards",
  includeHeader = true,
}: RouteLoadingShellProps) {
  return (
    <div
      className={
        includeHeader
          ? "app-container py-8 space-y-6 animate-pulse"
          : "space-y-6 animate-pulse"
      }
      aria-busy="true"
      aria-label="Loading page content"
    >
      {includeHeader && (
        <div className="space-y-2.5">
          <div className="h-6 w-52 rounded-full bg-emerald-100" />
          <div className="h-8 w-full max-w-xl rounded-xl bg-slate-200" />
          <div className="h-4 w-full max-w-2xl rounded-lg bg-slate-100" />
        </div>
      )}

      {variant === "dashboard" && (
        <div className="space-y-8">
          <div className="rounded-3xl bg-emerald-900/15 p-8 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-3">
              <div className="h-7 w-64 rounded-full bg-emerald-200/70" />
              <div className="h-12 w-full max-w-xl rounded-xl bg-slate-200" />
              <div className="h-12 w-full max-w-lg rounded-xl bg-slate-200/80" />
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/80 border border-slate-200" />
              ))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl border border-slate-200 bg-white p-5" />
            ))}
          </div>
        </div>
      )}

      {variant === "list" && (
        <div className="space-y-5">
          <div className="h-32 rounded-2xl border border-slate-200 bg-white p-5" />
          <div className="grid gap-4 xl:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl border border-slate-200 bg-white p-5" />
            ))}
          </div>
        </div>
      )}

      {variant === "cards" && (
        <div className="space-y-5">
          <div className="h-16 rounded-2xl border border-slate-200 bg-white p-4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl border border-slate-200 bg-white p-5" />
            ))}
          </div>
        </div>
      )}

      {variant === "article" && (
        <div className="space-y-6">
          <div className="h-48 rounded-2xl border border-slate-200 bg-white p-6" />
          <div className="grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl border border-slate-200 bg-white p-6" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
