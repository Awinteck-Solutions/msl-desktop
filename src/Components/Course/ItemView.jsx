import { Link } from "react-router-dom";
import StatusBadge from "../UI/StatusBadge";

export default function ItemView({
  image,
  title,
  description = "",
  route = "/course/general/",
  lessons = 0,
  isEnrolled = false,
}) {
  return (
    <div className="w-[280px] glass-card overflow-hidden hover:shadow-glow-indigo-soft transition group">
      <div className="aspect-[4/3] bg-brand/10 overflow-hidden relative">
        <img
          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
          src={image}
          alt=""
        />
        {isEnrolled ? (
          <StatusBadge status="completed" className="absolute top-2 right-2">
            Enrolled
          </StatusBadge>
        ) : null}
      </div>
      <div className="p-4 space-y-2">
        <p className="font-display font-semibold text-msl-text line-clamp-2">{title}</p>
        <p className="text-sm text-msl-muted line-clamp-2">
          {(description || "").substring(0, 100)}
          {(description || "").length > 100 ? "…" : ""}
        </p>
        <p className="text-xs text-msl-muted font-mono">{lessons} lessons</p>
        <Link
          className="inline-flex text-sm text-brand font-semibold hover:underline"
          to={route}
        >
          View course →
        </Link>
      </div>
    </div>
  );
}
