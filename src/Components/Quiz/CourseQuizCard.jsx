import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import IndigoProgress from "../UI/IndigoProgress";
import StatusBadge from "../UI/StatusBadge";
import { mediaUrl } from "../../Services/apiConfig";

export default function CourseQuizCard({ course, to }) {
  const progress = course.progress ?? {};
  const pct = progress.percentage ?? 0;
  const completed = progress.completed ?? 0;
  const total = progress.total ?? 0;
  const categoryName = course.categoryId?.name;

  return (
    <Link
      to={to}
      className="group block glass-card rounded-2xl overflow-hidden hover:shadow-glow-indigo-soft transition-all duration-200"
    >
      <div className="relative h-36 overflow-hidden">
        {course.thumbnail ? (
          <img
            src={mediaUrl(course.thumbnail)}
            alt=""
            className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full bg-gradient-cta opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {categoryName ? (
          <StatusBadge status="processing" className="absolute top-3 left-3">
            {categoryName}
          </StatusBadge>
        ) : null}
        <span className="absolute top-3 right-3 text-xs font-mono bg-msl-glass backdrop-blur px-2 py-1 rounded-full text-msl-text border border-msl-border">
          {course.totalQuiz ?? 0} quiz{(course.totalQuiz ?? 0) === 1 ? "" : "zes"}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-brand mt-0.5 shrink-0" strokeWidth={1.75} />
          <h3 className="font-display font-semibold text-msl-text line-clamp-2 leading-snug">
            {course.title}
          </h3>
        </div>
        <p className="text-sm text-msl-muted line-clamp-2">{course.description}</p>
        {total > 0 ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-msl-muted">
              <span>
                {completed} / {total} lessons
              </span>
              <span className="font-mono tabular-nums text-brand">{pct}%</span>
            </div>
            <IndigoProgress value={pct} />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
