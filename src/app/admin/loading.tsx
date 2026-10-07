import { Card } from "@/components/ui/Card";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="space-y-3 p-4 sm:p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <div className="border-b border-slate-100 p-4">
          <Skeleton className="h-9 w-full sm:w-72" />
        </div>
        <TableSkeleton />
      </Card>
    </div>
  );
}
