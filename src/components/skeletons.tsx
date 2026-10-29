import { Skeleton } from "@/components/ui/skeleton";

// Placeholders shaped like the content they stand in for, so the page does not jump
// when data arrives. role="status" lets screen readers announce the wait.

export const ListSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-3" role="status" aria-label="Carregando">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="tile p-5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

export const PageSkeleton = () => (
  <div className="container-custom pt-24 pb-16 space-y-6" role="status" aria-label="Carregando">
    <Skeleton className="h-40 w-full rounded-3xl" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="aspect-[4/3] rounded-3xl" />
      ))}
    </div>
  </div>
);
