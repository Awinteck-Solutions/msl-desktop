import { BookOpen, CheckCircle2, FileText, GraduationCap, PlayCircle } from "lucide-react";
import { useMslAi } from "../../Context/MslAiContext";
import { useLocation } from "react-router-dom";

function scopeIcon(scope, isPdfPage) {
  if (isPdfPage || scope.resourceType === "pdf") return FileText;
  if (scope.resourceType === "video") return PlayCircle;
  if (scope.lessonId) return GraduationCap;
  if (scope.courseId) return BookOpen;
  return BookOpen;
}

function scopeSubtitle(scope, isPdfPage) {
  if (isPdfPage || scope.resourceType === "pdf") return "Generating from the PDF you are viewing";
  if (scope.resourceType === "video") return "Generating from the video currently in use";
  if (scope.lessonId && scope.s3Keys?.length) return "Generating from a specific lesson resource";
  if (scope.lessonId) return "Generating from this lesson";
  if (scope.courseId) return "Generating from the full course";
  return "";
}

export default function AiActiveScopeBanner() {
  const { scope } = useMslAi();
  const { pathname } = useLocation();
  const isPdfPage = pathname.startsWith("/preview/pdf/");

  if (!scope.courseId && !scope.s3Keys?.length) return null;

  const Icon = scopeIcon(scope, isPdfPage);
  const title = scope.label || (isPdfPage ? "Current PDF" : "Selected content");
  const subtitle = scopeSubtitle(scope, isPdfPage);

  return (
    <div className="rounded-xl border border-brand/25 bg-brand/5 px-4 py-3.5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Active source</p>
          <CheckCircle2 className="w-3.5 h-3.5 text-brand" strokeWidth={2} />
        </div>
        <p className="text-sm font-semibold text-msl-text mt-1 truncate">{title}</p>
        {subtitle ? <p className="text-xs text-msl-muted mt-0.5">{subtitle}</p> : null}
        {scope.lessonId ? (
          <p className="text-[11px] text-brand/80 mt-1.5 font-medium">Lesson scope is active</p>
        ) : null}
      </div>
    </div>
  );
}
