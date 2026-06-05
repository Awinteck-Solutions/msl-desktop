import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  FileText,
  GraduationCap,
  PlayCircle,
  Search,
} from "lucide-react";
import AiActiveScopeBanner from "./AiActiveScopeBanner";
import { useMslAi } from "../../Context/MslAiContext";
import { singleCourse, userCourseList } from "../../Services/CourseApi";
import { normalizeS3Key } from "../../utils/s3Key";
import { Skeleton } from "../UI/Skeleton";

function ScopeOption({ active, icon: Icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors ${
        active
          ? "border-brand/40 bg-msl-accent ring-1 ring-brand/20"
          : "border-msl-border bg-msl-surface hover:border-brand/25 hover:bg-msl-accent/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            active ? "bg-brand/15 text-brand" : "bg-msl-bg text-msl-muted"
          }`}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-msl-text truncate">{title}</p>
          {subtitle ? (
            <p className="text-xs text-msl-muted mt-0.5 line-clamp-2">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function lessonResources(lesson) {
  const items = [];
  const videos = [
    lesson.video,
    lesson.video1,
    lesson.video2,
    lesson.video3,
    lesson.video4,
    lesson.video5,
    lesson.video6,
    lesson.video7,
    lesson.video8,
  ].filter(Boolean);
  const pdfs = [
    lesson.pdf,
    lesson.pdf1,
    lesson.pdf2,
    lesson.pdf3,
    lesson.pdf4,
    lesson.pdf5,
    lesson.pdf6,
    lesson.pdf7,
    lesson.pdf8,
  ].filter(Boolean);
  videos.forEach((v, i) => items.push({ type: "video", key: v, label: `Video ${i + 1}` }));
  pdfs.forEach((p, i) => items.push({ type: "pdf", key: p, label: `PDF ${i + 1}` }));
  return items;
}

export default function AiGenerateScopePicker({ panelOpen = true }) {
  const { scope, routeScope, setAiScope } = useMslAi();
  const { pathname } = useLocation();
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [search, setSearch] = useState("");
  const [lessonsExpanded, setLessonsExpanded] = useState(false);

  const isPdfPage = pathname.startsWith("/preview/pdf/");
  const activeCourseId = String(scope.courseId || routeScope.courseId || "");
  const activeLessonId = String(scope.lessonId || "");
  const activeS3 = scope.s3Keys?.[0] ? normalizeS3Key(scope.s3Keys[0]) : "";

  useEffect(() => {
    if (!panelOpen) return;
    setSearch("");
    setLessonsExpanded(false);
    setLoadingCourses(true);
    userCourseList()
      .then((res) => setCourses(res?.response || []))
      .finally(() => setLoadingCourses(false));
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen || !activeCourseId) {
      setLessons([]);
      return;
    }
    setLoadingLessons(true);
    singleCourse(activeCourseId)
      .then((res) => {
        const list =
          res.response?.response?.lessons ||
          res.response?.response?.response?.lessons ||
          res.response?.lessons ||
          [];
        setLessons(list);
      })
      .finally(() => setLoadingLessons(false));
  }, [panelOpen, activeCourseId]);

  useEffect(() => {
    if (!panelOpen) return;
    if (scope.courseId || isPdfPage) return;
    const courseId = routeScope.courseId;
    if (!courseId) return;
    setAiScope({
      courseId,
      lessonId: routeScope.lessonId || null,
      s3Keys: routeScope.s3Keys || [],
      label: routeScope.label || "Current course",
      source: "page",
      resourceType: routeScope.resourceType || null,
    });
  }, [panelOpen, isPdfPage, routeScope.courseId, scope.courseId, setAiScope]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => String(c.title || "").toLowerCase().includes(q));
  }, [courses, search]);

  const applyCourseScope = (course) => {
    setAiScope({
      courseId: String(course._id),
      lessonId: null,
      s3Keys: [],
      label: course.title,
      source: "picker",
      resourceType: null,
    });
  };

  const applyLessonScope = (lesson, resource = null) => {
    const s3Keys = resource?.key ? [normalizeS3Key(resource.key)] : [];
    const resourceLabel = resource ? ` · ${resource.label}` : "";
    setAiScope({
      courseId: activeCourseId,
      lessonId: String(lesson._id),
      s3Keys,
      label: `${lesson.title}${resourceLabel}`,
      source: "picker",
      resourceType: resource?.type || null,
    });
  };

  return (
    <div className="space-y-4">
      <AiActiveScopeBanner />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-msl-muted mb-2">
          Change course
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-msl-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your courses"
            className="w-full rounded-xl border border-msl-border bg-msl-bg/40 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
          />
        </div>
      </div>

      {isPdfPage && scope.s3Keys?.length ? (
        <ScopeOption
          active={scope.resourceType === "pdf"}
          icon={FileText}
          title={scope.label || "Current PDF"}
          subtitle="PDF you are viewing"
          onClick={() =>
            setAiScope({
              courseId: scope.courseId || routeScope.courseId,
              lessonId: null,
              s3Keys: scope.s3Keys,
              label: scope.label || "Current PDF",
              source: "picker",
              resourceType: "pdf",
            })
          }
        />
      ) : null}

      {loadingCourses ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !filteredCourses.length ? (
        <p className="text-sm text-msl-muted text-center py-4">
          {courses.length ? "No courses match your search." : "Enroll in a course to generate content."}
        </p>
      ) : (
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {filteredCourses.map((course) => (
            <ScopeOption
              key={course._id}
              active={
                activeCourseId === String(course._id) &&
                !activeLessonId &&
                !activeS3
              }
              icon={BookOpen}
              title={course.title}
              subtitle="Entire course"
              onClick={() => applyCourseScope(course)}
            />
          ))}
        </div>
      )}

      {activeCourseId ? (
        <div className="pt-2 border-t border-msl-border">
          <button
            type="button"
            onClick={() => setLessonsExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-2 py-2 text-left group"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-msl-muted group-hover:text-msl-text transition-colors">
              Lesson or resource (optional)
            </p>
            <ChevronDown
              className={`w-4 h-4 text-msl-muted shrink-0 transition-transform ${
                lessonsExpanded ? "rotate-180" : ""
              }`}
              strokeWidth={1.75}
            />
          </button>
          {lessonsExpanded ? (
            loadingLessons ? (
              <Skeleton className="h-16 w-full rounded-xl" />
            ) : lessons.length ? (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {lessons.map((lesson) => {
                  const resources = lessonResources(lesson);
                  const lessonActive =
                    activeLessonId === String(lesson._id) && !activeS3;
                  return (
                    <div key={lesson._id} className="space-y-1">
                      <ScopeOption
                        active={lessonActive}
                        icon={GraduationCap}
                        title={lesson.title}
                        subtitle="Whole lesson"
                        onClick={() => applyLessonScope(lesson)}
                      />
                      {resources.map((res) => (
                        <div key={res.key} className="pl-3">
                          <ScopeOption
                            active={
                              activeLessonId === String(lesson._id) &&
                              activeS3 === normalizeS3Key(res.key)
                            }
                            icon={res.type === "video" ? PlayCircle : FileText}
                            title={res.label}
                            subtitle={lesson.title}
                            onClick={() => applyLessonScope(lesson, res)}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-msl-muted pb-2">No lessons in this course.</p>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
