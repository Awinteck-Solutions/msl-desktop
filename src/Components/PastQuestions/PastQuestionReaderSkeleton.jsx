import { Skeleton } from "../UI/Skeleton";

function QuestionBlockSkeleton() {
  return (
    <div className="rounded-msl border border-msl-border/50 bg-msl-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14 ml-auto" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export default function PastQuestionReaderSkeleton() {
  return (
    <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-200">
      <header className="shrink-0 px-5 py-4 border-b border-msl-border bg-msl-surface space-y-3">
        <Skeleton className="h-6 w-2/3 max-w-md" />
        <Skeleton className="h-3 w-48" />
        <div className="flex flex-wrap gap-2 pt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 max-w-3xl">
        <Skeleton className="h-10 w-full rounded-msl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <QuestionBlockSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
