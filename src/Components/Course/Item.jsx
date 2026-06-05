import { Link } from "react-router-dom";
import IndigoProgress from "../UI/IndigoProgress";

export default function Item({
  image,
  title,
  description = "",
  route = "/course/general/",
  progress,
}) {
  const pct = progress?.percentage ?? 0;
  const completed = progress?.completed ?? 0;
  const total = progress?.total ?? 0;

  return (
    <div className="w-[280px] glass-card overflow-hidden hover:shadow-glow-indigo-soft transition group">
      <div className="aspect-[4/3] bg-brand/10 overflow-hidden">
        <img
          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
          src={image}
          alt=""
        />
      </div>
      <div className="p-4 space-y-2">
        <p className="font-display font-semibold text-msl-text line-clamp-2">{title}</p>
        <p className="text-sm text-msl-muted line-clamp-2">
          {(description || "").substring(0, 100)}
          {(description || "").length > 100 ? "…" : ""}
        </p>
        {total > 0 ? (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-msl-muted">
              <span>
                {completed} / {total} lessons
              </span>
              <span className="font-mono tabular-nums text-brand">{Math.round(pct)}%</span>
            </div>
            <IndigoProgress value={pct} />
          </div>
        ) : null}
        <Link
          className="inline-flex mt-2 text-sm text-brand font-semibold hover:underline"
          to={route}
        >
          Continue learning →
        </Link>
      </div>
    </div>
  );
}
