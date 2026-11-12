import { Skeleton } from "../UI/Skeleton";

export default function PastQuestionBrowseSkeleton() {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="rounded-msl border border-msl-border/50 bg-msl-surface p-4 space-y-3">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-msl border border-msl-border/50 bg-msl-surface p-4 space-y-2"
        >
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}
