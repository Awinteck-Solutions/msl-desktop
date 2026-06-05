export function Skeleton({ className = "" }) {
  return (
    <div
      className={`skeleton-shimmer rounded-msl ${className}`}
      aria-hidden
    />
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="w-[280px] glass-card overflow-hidden border border-msl-border/40">
      <Skeleton className="aspect-[4/3] rounded-none rounded-t-msl" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-1.5 w-full mt-2" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3 border border-msl-border/40 h-full">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 shrink-0" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function ProfileProgressSkeleton() {
  return (
    <div className="glass-card p-5 border border-msl-border/40 h-full">
      <Skeleton className="h-3 w-28 mb-4" />
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2 flex flex-col items-center">
          <Skeleton className="w-10 h-10" />
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-3 w-14" />
        </div>
        <div className="space-y-2 col-span-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="space-y-2 flex flex-col items-center">
          <Skeleton className="w-10 h-10" />
          <Skeleton className="h-8 w-10" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

export function ChallengePanelSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4 border border-msl-border/40 h-full">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-12" />
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-1.5 w-full" />
      </div>
    </div>
  );
}

export function ExploreCarouselSkeleton() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-[260px] shrink-0 glass-card overflow-hidden border border-msl-border/40">
            <Skeleton className="aspect-video rounded-none" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PracticeListSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-4 flex gap-4 border border-msl-border/40">
          <Skeleton className="w-24 h-24 shrink-0 rounded-msl" />
          <div className="flex-1 space-y-2.5 py-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-msl border border-msl-border/40 bg-msl-surface p-4 flex gap-3">
          <Skeleton className="w-9 h-9 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      <Skeleton className="h-16 w-full max-w-[85%] rounded-msl" />
      <div className="flex justify-end">
        <Skeleton className="h-10 w-56 rounded-2xl" />
      </div>
      <Skeleton className="h-24 w-full max-w-[85%] rounded-msl" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="glass-card p-6 border border-msl-border/40 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-6">
          <Skeleton className="w-20 h-20 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="glass-card p-6 border border-msl-border/40">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DotsLoader({ className = "" }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-label="Loading">
      <span className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
