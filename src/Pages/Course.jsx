import AppShell from "../Components/Layout/AppShell";
import ItemView from "../Components/Course/ItemView";
import { CourseCardSkeleton } from "../Components/UI/Skeleton";
import { courseList, fetchEnrolledCourseIds } from "../Services/CourseApi";
import { useEffect, useState } from "react";
import { mediaUrl } from "../Services/apiConfig";
import { getStoredUser } from "../Services/session";
import { useNavigate } from "react-router-dom";
import { matchesSearch } from "../utils/practiceSearch";

const Course = () => {
  const navigator = useNavigate();
  const [isLoadingCourse, setLoadingCourse] = useState(true);
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [search, setSearch] = useState("");

  const filteredCourses = courses.filter((course) =>
    matchesSearch(search, course.title, course.description)
  );

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigator("/login");
      return;
    }
    courseList()
      .then((response) => {
        setCourses(response.response);
        setLoadingCourse(false);
      })
      .catch(() => setLoadingCourse(false));
    fetchEnrolledCourseIds().then(setEnrolledIds).catch(() => {});
  }, [navigator]);

  return (
    <AppShell
      active={{ course: true }}
      title="All courses"
      subtitle="Browse and preview available programmes"
      headerRight={
        <input
          type="text"
          placeholder="Search courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-msl border border-msl-border bg-msl-surface px-4 py-2 text-sm text-msl-text placeholder:text-msl-muted focus:outline-none focus:border-msl-primary/50 w-56"
        />
      }
    >
      <div className="flex flex-wrap gap-4">
        {isLoadingCourse ? (
          Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
        ) : filteredCourses.length ? (
          filteredCourses.map((value) => {
            const courseId = String(value._id);
            return (
              <ItemView
                key={courseId}
                route={`/course/preview/${courseId}`}
                image={mediaUrl(value.thumbnail)}
                title={value.title}
                description={value.description}
                lessons={value.lessons ?? 0}
                isEnrolled={enrolledIds.has(courseId)}
              />
            );
          })
        ) : (
          <div className="msl-card p-12 w-full text-center">
            <p className="text-lg font-medium text-msl-text">No courses found</p>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Course;
