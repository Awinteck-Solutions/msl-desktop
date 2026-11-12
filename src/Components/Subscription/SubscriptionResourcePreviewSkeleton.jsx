import { Skeleton } from "../UI/Skeleton";

export default function SubscriptionResourcePreviewSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] min-h-0 animate-in fade-in duration-200">
      <aside className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-msl-border bg-msl-surface p-4 space-y-4">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <div className="pt-2 space-y-2">
          <Skeleton className="h-3 w-16" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </aside>
      <main className="flex-1 min-h-[420px] p-6 space-y-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[min(70vh,640px)] w-full max-w-3xl mx-auto rounded-msl" />
      </main>
    </div>
  );
}
