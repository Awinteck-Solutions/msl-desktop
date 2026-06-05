import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Layers } from "lucide-react";
import { PracticeListSkeleton } from "../Components/UI/Skeleton";
import PracticeLayout from "../Components/Layout/PracticeLayout";
import CourseFlashcardCard from "../Components/Flashcard/CourseFlashcardCard";
import FlashcardPlayer from "../Components/Flashcard/FlashcardPlayer";
import PracticeStatusFilter from "../Components/Practice/PracticeStatusFilter";
import PracticeSearchBar from "../Components/Practice/PracticeSearchBar";
import PracticeFlashcardListCard from "../Components/Practice/PracticeFlashcardListCard";
import SecondaryButton from "../Components/UI/SecondaryButton";
import StatusBadge from "../Components/UI/StatusBadge";
import StudyModal from "../Components/UI/StudyModal";
import {
  coursesWithFlashcards,
  flashcardByCourse,
  flashcardSingle,
} from "../Services/FlashcardApi";
import {
  filterByStatus,
  getFlashcardStatus,
} from "../utils/practiceStatus";
import { matchesSearch } from "../utils/practiceSearch";
import { getStoredUser } from "../Services/session";

const PracticeFlashcards = () => {
  const { courseId, flashcardId } = useParams();
  const location = useLocation();
  const navigator = useNavigate();
  const backCourseId = location.state?.courseId;
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [decks, setDecks] = useState([]);
  const [courseMeta, setCourseMeta] = useState(null);
  const [detail, setDetail] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigator("/login");
      return;
    }

    setLoading(true);

    if (flashcardId) {
      const courseForMeta = backCourseId || courseId;
      Promise.all([
        flashcardSingle(flashcardId),
        courseForMeta ? coursesWithFlashcards() : Promise.resolve(null),
      ])
        .then(([deckRes, courseRes]) => {
          if (deckRes.status) setDetail(deckRes.response);
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
      Promise.all([
        flashcardByCourse(courseId),
        coursesWithFlashcards(),
      ])
        .then(([deckRes, courseRes]) => {
          if (deckRes.status) setDecks(deckRes.response);
          const match = courseRes.response?.find(
            (c) => String(c._id) === String(courseId)
          );
          if (match) setCourseMeta(match);
        })
        .finally(() => setLoading(false));
      return;
    }

    coursesWithFlashcards()
      .then((res) => {
        if (res.status) setCourses(res.response);
      })
      .finally(() => setLoading(false));
  }, [courseId, flashcardId, backCourseId, navigator]);

  const filteredDecks = useMemo(() => {
    const byStatus = filterByStatus(decks, getFlashcardStatus, statusFilter);
    return byStatus.filter((deck) =>
      matchesSearch(search, deck.title, deck.description)
    );
  }, [decks, statusFilter, search]);

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
    const counts = { all: decks.length };
    decks.forEach((deck) => {
      const status = getFlashcardStatus(deck);
      counts[status] = (counts[status] ?? 0) + 1;
    });
    return counts;
  }, [decks]);

  const handleDeckBack = () => {
    navigator(
      backCourseId
        ? `/practice/flashcards/course/${backCourseId}`
        : courseId
          ? `/practice/flashcards/course/${courseId}`
          : "/practice/flashcards"
    );
  };

  if (flashcardId) {
    return (
      <PracticeLayout practiceFlashcards>
        <StudyModal
          isOpen
          onClose={handleDeckBack}
          title="Flashcard review"
        >
          {loading ? (
            <PracticeListSkeleton count={1} />
          ) : !detail ? (
            <div className="text-center py-8">
              <p className="text-sm text-msl-muted">Flashcard deck not found.</p>
              <SecondaryButton className="mt-4" onClick={handleDeckBack}>
                Back
              </SecondaryButton>
            </div>
          ) : (
            <FlashcardPlayer deck={detail} onBack={handleDeckBack} embedded />
          )}
        </StudyModal>
      </PracticeLayout>
    );
  }

  if (courseId) {
    return (
      <PracticeLayout practiceFlashcards>
        <SecondaryButton className="mb-4" onClick={() => navigator("/practice/flashcards")}>
          ← All courses
        </SecondaryButton>
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-brand" strokeWidth={1.75} />
            {courseMeta?.categoryId?.name ? (
              <StatusBadge status="processing">{courseMeta.categoryId.name}</StatusBadge>
            ) : null}
            <StatusBadge status="neutral">
              {decks.length} deck{decks.length === 1 ? "" : "s"}
            </StatusBadge>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-msl-text tracking-tight">
            {courseMeta?.title || "Course flashcards"}
          </h1>
          {courseMeta?.description ? (
            <p className="text-sm text-msl-muted mt-2 max-w-3xl line-clamp-3">
              {courseMeta.description}
            </p>
          ) : null}
        </div>

        <PracticeSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search decks…"
        />

        <PracticeStatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          counts={filterCounts}
        />

        {loading ? (
          <PracticeListSkeleton />
        ) : filteredDecks.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredDecks.map((fc) => (
              <PracticeFlashcardListCard key={fc._id} deck={fc} courseId={courseId} />
            ))}
          </div>
        ) : decks.length ? (
          <p className="text-sm text-msl-muted">
            {search.trim()
              ? "No decks match your search."
              : "No decks match this filter."}
          </p>
        ) : (
          <p className="text-sm text-msl-muted">No flashcard decks for this course.</p>
        )}
      </PracticeLayout>
    );
  }

  return (
    <PracticeLayout practiceFlashcards>
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-gradient-brand tracking-tight">
          Practice flashcards
        </h1>
        <p className="text-sm text-msl-muted mt-1">
          Pick a course to study its flashcard decks
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
            <CourseFlashcardCard
              key={course._id}
              course={course}
              to={`/practice/flashcards/course/${course._id}`}
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
            No enrolled courses with flashcards yet.
          </p>
        </div>
      )}
    </PracticeLayout>
  );
};

export default PracticeFlashcards;
