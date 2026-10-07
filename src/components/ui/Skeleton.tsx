export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div>
      <div className="flex h-10 items-center gap-6 border-b border-slate-200/80 bg-slate-50/70 px-5">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-3 flex-1 max-w-24" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-6 px-5 py-3.5">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton key={colIndex} className={`h-4 flex-1 ${colIndex === 0 ? "" : "max-w-32"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
