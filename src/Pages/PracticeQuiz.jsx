import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Target } from "lucide-react";
import { PracticeListSkeleton } from "../Components/UI/Skeleton";
import PracticeLayout from "../Components/Layout/PracticeLayout";
import CourseQuizCard from "../Components/Quiz/CourseQuizCard";
import QuizPlayer from "../Components/Quiz/QuizPlayer";
import PracticeStatusFilter from "../Components/Practice/PracticeStatusFilter";
import PracticeSearchBar from "../Components/Practice/PracticeSearchBar";
import PracticeQuizListCard from "../Components/Practice/PracticeQuizListCard";
import IndigoProgress from "../Components/UI/IndigoProgress";
import SecondaryButton from "../Components/UI/SecondaryButton";
import StatusBadge from "../Components/UI/StatusBadge";
import StudyModal from "../Components/UI/StudyModal";
import {
  coursesWithQuizzes,
  quizByCourse,
  quizSingle,
  quizResponseByQuizId,
} from "../Services/QuizApi";
import {
  filterByStatus,
  getQuizStatus,
} from "../utils/practiceStatus";
import { matchesSearch } from "../utils/practiceSearch";
import { getStoredUser } from "../Services/session";

const PracticeQuiz = () => {
  const { courseId, quizId } = useParams();
  const location = useLocation();
  const navigator = useNavigate();
  const backCourseId = location.state?.courseId;
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [courseMeta, setCourseMeta] = useState(null);
  const [detail, setDetail] = useState(null);
  const [quizResponse, setQuizResponse] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const quizCloseRef = useRef(null);

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigator("/login");
      return;
    }

    setLoading(true);

    if (quizId) {
      const courseForMeta = backCourseId || courseId;
      Promise.all([
        quizSingle(quizId),
        quizResponseByQuizId(quizId),
        courseForMeta ? coursesWithQuizzes() : Promise.resolve(null),
      ])
        .then(([quizRes, responseRes, courseRes]) => {
          if (quizRes.status) setDetail(quizRes.response);
          if (responseRes.status) setQuizResponse(responseRes.response);
          if (courseRes?.status) {
            const match = courseRes.response?.find(
              (c) => String(c._id) === String(courseForMeta)
            );
            if (match) setCourseMeta(match);
          }
        })
        .finally(() => setLoading(false));
      return;
    }

    if (courseId) {
      Promise.all([quizByCourse(courseId), coursesWithQuizzes()])
        .then(([quizRes, courseRes]) => {
          if (quizRes.status) setQuizzes(quizRes.response);
          const match = courseRes.response?.find(
            (c) => String(c._id) === String(courseId)
          );
          if (match) setCourseMeta(match);
        })
        .finally(() => setLoading(false));
      return;
    }

    coursesWithQuizzes()
      .then((res) => {
        if (res.status) setCourses(res.response);
      })
      .finally(() => setLoading(false));
  }, [courseId, quizId, backCourseId, navigator]);

  const filteredQuizzes = useMemo(() => {
    const byStatus = filterByStatus(quizzes, getQuizStatus, statusFilter);
    return byStatus.filter(({ quiz }) =>
      matchesSearch(search, quiz.title, quiz.description)
    );
  }, [quizzes, statusFilter, search]);

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) =>
        matchesSearch(
          search,
          course.title,
          course.description,
          course.categoryId?.name
        )
      ),
    [courses, search]
  );

  const filterCounts = useMemo(() => {
    const counts = { all: quizzes.length };
    quizzes.forEach((item) => {
      const status = getQuizStatus(item);
      counts[status] = (counts[status] ?? 0) + 1;
    });
    return counts;
  }, [quizzes]);

  const handleQuizBack = () => {
    navigator(
      backCourseId
        ? `/practice/quiz/course/${backCourseId}`
        : courseId
          ? `/practice/quiz/course/${courseId}`
          : "/practice/quiz"
    );
  };

  if (quizId) {
    return (
      <PracticeLayout practiceQuiz>
        <StudyModal
          isOpen
          onClose={() => {
            if (quizCloseRef.current) quizCloseRef.current();
            else handleQuizBack();
          }}
          closeOnClickOutside={false}
          title={detail?.title || "Quiz"}
        >
          {loading ? (
            <PracticeListSkeleton count={1} />
          ) : !detail ? (
            <div className="text-center py-8">
              <p className="text-sm text-msl-muted">Quiz not found.</p>
              <SecondaryButton className="mt-4" onClick={handleQuizBack}>
                Back
              </SecondaryButton>
            </div>
          ) : (
            <QuizPlayer
              quiz={detail}
              initialResponse={quizResponse}
              onBack={handleQuizBack}
              embedded
              lessonTitle={courseMeta?.title}
              onRegisterCloseHandler={(fn) => {
                quizCloseRef.current = fn;
              }}
            />
          )}
        </StudyModal>
      </PracticeLayout>
    );
  }

  if (courseId) {
    const progress = courseMeta?.progress ?? {};
    return (
      <PracticeLayout practiceQuiz>
        <SecondaryButton className="mb-4" onClick={() => navigator("/practice/quiz")}>
          ← All courses
        </SecondaryButton>
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-brand" strokeWidth={1.75} />
            {courseMeta?.categoryId?.name ? (
              <StatusBadge status="processing">{courseMeta.categoryId.name}</StatusBadge>
            ) : null}
            <StatusBadge status="neutral">
              {quizzes.length} quiz{quizzes.length === 1 ? "" : "zes"}
            </StatusBadge>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-msl-text tracking-tight">
            {courseMeta?.title || "Course quizzes"}
          </h1>
          {courseMeta?.description ? (
            <p className="text-sm text-msl-muted mt-2 max-w-3xl line-clamp-3">
              {courseMeta.description}
            </p>
          ) : null}
          {progress.total > 0 ? (
            <div className="mt-4 max-w-md space-y-1.5">
              <div className="flex justify-between text-xs text-msl-muted">
                <span>
                  {progress.completed} / {progress.total} lessons
                </span>
                <span className="font-mono text-brand tabular-nums">
                  {progress.percentage}%
                </span>
              </div>
              <IndigoProgress value={progress.percentage ?? 0} />
            </div>
          ) : null}
        </div>

        <PracticeSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search quizzes…"
        />

        <PracticeStatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          counts={filterCounts}
        />

        {loading ? (
          <PracticeListSkeleton />
        ) : filteredQuizzes.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredQuizzes.map(({ quiz, latestResponse }) => (
              <PracticeQuizListCard
                key={quiz._id}
                quiz={quiz}
                latestResponse={latestResponse}
                courseId={courseId}
                status={getQuizStatus({ latestResponse })}
              />
            ))}
          </div>
        ) : quizzes.length ? (
          <p className="text-sm text-msl-muted">
            {search.trim()
              ? "No quizzes match your search."
              : "No quizzes match this filter."}
          </p>
        ) : (
          <p className="text-sm text-msl-muted">No quizzes for this course.</p>
        )}
      </PracticeLayout>
    );
  }

  return (
    <PracticeLayout practiceQuiz>
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-gradient-brand tracking-tight">
          Practice quizzes
        </h1>
        <p className="text-sm text-msl-muted mt-1">
          Pick a course to practice its quizzes
        </p>
      </div>
      <PracticeSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search courses…"
      />
      {loading ? (
        <PracticeListSkeleton count={6} />
      ) : filteredCourses.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseQuizCard
              key={course._id}
              course={course}
              to={`/practice/quiz/course/${course._id}`}
            />
          ))}
        </div>
      ) : courses.length ? (
        <div className="glass-card text-center py-16">
          <p className="text-sm text-msl-muted">No courses match your search.</p>
        </div>
      ) : (
        <div className="glass-card text-center py-16">
          <p className="text-sm text-msl-muted">
            No enrolled courses with quizzes yet.
          </p>
        </div>
      )}
    </PracticeLayout>
  );
};

export default PracticeQuiz;
