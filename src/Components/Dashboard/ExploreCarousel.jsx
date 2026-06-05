import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { mediaUrl } from "../../Services/apiConfig";

const CARD_WIDTH = 276; // 260px card + 16px gap

export default function ExploreCarousel({ courses = [] }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (courses.length < 2) return;

    const id = setInterval(() => {
      setOffset((prev) => {
        const next = prev + CARD_WIDTH;
        const loopAt = courses.length * CARD_WIDTH;
        return next >= loopAt ? 0 : next;
      });
    }, 3000);

    return () => clearInterval(id);
  }, [courses.length]);

  if (!courses.length) return null;

  const track = [...courses, ...courses];

  return (
    <section>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-msl-text tracking-tight">
            Explore
          </h2>
          <p className="text-sm text-msl-muted mt-0.5">Discover programmes on MSL</p>
        </div>
        <Link
          to="/course"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline shrink-0"
        >
          View all
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-msl">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-msl-bg to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-msl-bg to-transparent" />
        <div
          className="flex gap-4 w-max py-1 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${offset}px)` }}
        >
          {track.map((course, index) => (
            <Link
              key={`${course._id}-${index}`}
              to={`/course/preview/${course._id}`}
              className="group w-[260px] shrink-0 glass-card rounded-msl overflow-hidden hover:shadow-glow-indigo-soft transition-shadow"
            >
              <div className="aspect-video overflow-hidden bg-brand/10">
                <img
                  src={mediaUrl(course.thumbnail)}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-brand mt-0.5 shrink-0" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm text-msl-text line-clamp-2 group-hover:text-brand transition-colors">
                      {course.title}
                    </p>
                    <p className="text-xs text-msl-muted mt-1 font-mono tabular-nums">
                      {course.lessons ?? 0} lessons
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
