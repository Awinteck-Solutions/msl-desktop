import AppShell from "../Components/Layout/AppShell";
import Item from "../Components/Course/Item";
import CourseGroupFilter from "../Components/UI/CourseGroupFilter";
import { CourseCardSkeleton } from "../Components/UI/Skeleton";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { userCourseList } from "../Services/CourseApi";
import { mediaUrl } from "../Services/apiConfig";
import { getStoredUser } from "../Services/session";
import { matchesSearch } from "../utils/practiceSearch";
import {
  countCoursesByGroup,
  filterCoursesByGroup,
} from "../utils/courseProgressGroup";

const MyCourses = () => {
  const navigator = useNavigate();
  const [isLoading, setLoading] = useState(true);
  const [myCourses, setMycourses] = useState([]);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");

  const searched = useMemo(
    () =>
      myCourses.filter((value) =>
        matchesSearch(search, value.title, value.description)
      ),
    [myCourses, search]
  );

  const filtered = useMemo(
    () => filterCoursesByGroup(searched, group),
    [searched, group]
  );

  const groupCounts = useMemo(() => countCoursesByGroup(searched), [searched]);

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigator("/login");
      return;
    }
    userCourseList()
      .then((response) => {
        setMycourses(response.response);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigator]);

  return (
    <AppShell
      active={{ mycourse: true }}
      title="My courses"
      subtitle="Your enrolled programmes"
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
      <div className="space-y-5">
        <CourseGroupFilter value={group} onChange={setGroup} counts={groupCounts} />

        <div className="flex flex-wrap gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
          ) : filtered.length ? (
            filtered.map((value) => (
              <Item
                key={value._id}
                route={`/course/preview/${value._id}`}
                image={mediaUrl(value.thumbnail)}
                title={value.title}
                description={value.description}
                progress={value.progress}
              />
            ))
          ) : (
            <div className="msl-card p-12 w-full text-center">
              <p className="text-lg font-medium text-msl-text">
                {searched.length
                  ? "No courses match your filters"
                  : "No enrolled courses yet"}
              </p>
              {!searched.length ? (
                <p className="text-sm text-msl-muted mt-2">
                  Enroll via the mobile app to start learning.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default MyCourses;
