import { Card } from "@/components/ui/Card";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <Skeleton className="h-9 w-full sm:w-72" />
          <Skeleton className="h-9 w-full sm:w-40" />
        </div>
        <TableSkeleton />
      </Card>
    </div>
  );
}
