import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "@chakra-ui/react";
import { Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../Components/Layout/AppShell";
import DashboardStatsCarousel from "../Components/Dashboard/DashboardStatsCarousel";
import ExploreCarousel from "../Components/Dashboard/ExploreCarousel";
import LeaderboardModal from "../Components/Dashboard/LeaderboardModal";
import Item from "../Components/Course/Item";
import CourseGroupFilter from "../Components/UI/CourseGroupFilter";
import {
  ChallengePanelSkeleton,
  CourseCardSkeleton,
  ExploreCarouselSkeleton,
  ProfileProgressSkeleton,
} from "../Components/UI/Skeleton";
import { courseList, userCourseList } from "../Services/CourseApi";
import { getMyGamification } from "../Services/GamificationApi";
import { mediaUrl } from "../Services/apiConfig";
import { getProfile } from "../Services/UserApi";
import { getStoredUser } from "../Services/session";
import { xpProgress } from "../utils/gamificationHelpers";
import { matchesSearch } from "../utils/practiceSearch";
import {
  countCoursesByGroup,
  filterCoursesByGroup,
} from "../utils/courseProgressGroup";

const Dashboard = () => {
  const navigator = useNavigate();
  const user = getStoredUser();
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGamification, setLoadingGamification] = useState(true);
  const [loadingExplore, setLoadingExplore] = useState(true);
  const [myCourses, setMyCourses] = useState([]);
  const [exploreCourses, setExploreCourses] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [search, setSearch] = useState("");
  const [courseGroup, setCourseGroup] = useState("all");
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.image || "");

  const searchedCourses = useMemo(
    () => myCourses.filter((c) => matchesSearch(search, c.title, c.description)),
    [myCourses, search]
  );

  const filteredMyCourses = useMemo(
    () => filterCoursesByGroup(searchedCourses, courseGroup),
    [searchedCourses, courseGroup]
  );

  const courseGroupCounts = useMemo(
    () => countCoursesByGroup(searchedCourses),
    [searchedCourses]
  );

  useEffect(() => {
    if (!user?.token) {
      navigator("/login");
      return;
    }

    userCourseList()
      .then((res) => setMyCourses(res.response || []))
      .catch(() => {})
      .finally(() => setLoadingCourses(false));

    courseList()
      .then((res) => setExploreCourses(res.response || []))
      .catch(() => {})
      .finally(() => setLoadingExplore(false));

    getMyGamification()
      .then((res) => {
        if (res.status) setGamification(res.response);
      })
      .finally(() => setLoadingGamification(false));

    getProfile()
      .then((res) => {
        if (res.status && res.response?.image) {
          setProfileImage(res.response.image);
        }
      })
      .catch(() => {});
  }, [navigator, user?.token]);

  const { remaining, pct } = xpProgress(
    gamification?.totalXp,
    gamification?.nextLevelXp
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName =
    user?.firstname || user?.firstName || user?.name || "Student";
  const avatarName = [user?.firstname, user?.lastname].filter(Boolean).join(" ") || displayName;

  return (
    <AppShell active={{ dashboard: true }} noPadding>
      <div className="px-6 lg:px-8 py-6 space-y-8 max-w-7xl mx-auto">
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar
              size="lg"
              name={avatarName}
              src={profileImage ? mediaUrl(profileImage) : undefined}
              className="ring-2 ring-brand/25 shrink-0"
            />
            <div>
              <p className="text-sm text-msl-muted">{greeting()}</p>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-gradient-brand mt-1 tracking-tight">
                {displayName}
              </h1>
              <p className="text-msl-muted mt-2 max-w-xl">
                Track your progress, complete daily challenges, and continue learning.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* <Link to="/practice/quiz" className="msl-btn-primary">
              Practice quiz
            </Link> */}
            <button
              type="button"
              onClick={() => setLeaderboardOpen(true)}
              className="inline-flex items-center gap-2 rounded-msl border border-msl-border bg-msl-surface px-4 py-2 text-sm font-medium text-msl-text hover:border-brand/40 hover:bg-brand/10 transition"
              aria-label="Open leaderboard"
            >
              <Trophy className="w-4 h-4 text-brand" strokeWidth={1.75} />
              Leaderboard
            </button>
          </div>
        </section>

        {loadingGamification ? (
          <section className="overflow-hidden">
            <div className="flex gap-4">
              <div className="w-1/3 shrink-0"><ProfileProgressSkeleton /></div>
              <div className="w-1/3 shrink-0"><ChallengePanelSkeleton /></div>
              <div className="w-1/3 shrink-0"><ChallengePanelSkeleton /></div>
            </div>
          </section>
        ) : (
          <DashboardStatsCarousel
            gamification={gamification}
            remaining={remaining}
            pct={pct}
          />
        )}

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-msl-text">My courses</h2>
              <p className="text-sm text-msl-muted">Continue where you left off</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search courses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-msl border border-msl-border bg-msl-surface px-4 py-2 text-sm text-msl-text placeholder:text-msl-muted focus:outline-none focus:border-msl-primary/50 w-full sm:w-56"
              />
              <Link to="/personal/course" className="text-sm text-brand hover:underline whitespace-nowrap">
                View all
              </Link>
            </div>
          </div>

          {!loadingCourses ? (
            <CourseGroupFilter
              value={courseGroup}
              onChange={setCourseGroup}
              counts={courseGroupCounts}
            />
          ) : null}

          <div className="flex flex-wrap gap-4 mt-4">
            {loadingCourses ? (
              Array.from({ length: 4 }).map((_, i) => <CourseCardSkeleton key={i} />)
            ) : filteredMyCourses.length ? (
              filteredMyCourses.slice(0, 6).map((course) => (
                <Item
                  key={course._id}
                  route={`/course/preview/${course._id}`}
                  image={mediaUrl(course.thumbnail)}
                  title={course.title}
                  description={course.description}
                  progress={course.progress}
                />
              ))
            ) : (
              <div className="msl-card p-10 w-full text-center">
                <p className="text-lg font-medium text-msl-text">No enrolled courses yet</p>
                <p className="text-sm text-msl-muted mt-2">
                  Enroll via the mobile app to start learning.
                </p>
                <Link to="/course" className="msl-btn-primary inline-flex mt-4">
                  Browse courses
                </Link>
              </div>
            )}
          </div>
        </section>

        {loadingExplore ? (
          <ExploreCarouselSkeleton />
        ) : exploreCourses.length ? (
          <ExploreCarousel courses={exploreCourses} />
        ) : null}
      </div>

      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />
    </AppShell>
  );
};

export default Dashboard;
