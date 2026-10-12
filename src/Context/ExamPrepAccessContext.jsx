import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { getStoredUser } from "../Services/session";
import { userCourseList } from "../Services/CourseApi";
import { fetchSubscriptionStatus } from "../Services/SubscriptionApi";

const ExamPrepAccessContext = createContext(null);

export function computeExamPrepVisibility(hasEnrollment, hasSubscription) {
  const showPastQuestions = hasEnrollment || hasSubscription;
  /** Subscriber library + FAB: any active subscription, including enrolled students. */
  const showAiSubscription = hasSubscription;
  return { showPastQuestions, showAiSubscription };
}

export function ExamPrepAccessProvider({ children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [hasEnrollment, setHasEnrollment] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    if (!user?.token) {
      setHasEnrollment(false);
      setHasSubscription(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [coursesRes, statusRes] = await Promise.all([
      userCourseList().catch(() => null),
      fetchSubscriptionStatus(),
    ]);
    const enrolled = (coursesRes?.response?.length ?? 0) > 0;
    const subscribed = Boolean(statusRes.ok && statusRes.data?.hasAccess);
    setHasEnrollment(enrolled);
    setHasSubscription(subscribed);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, location.pathname]);

  const { showPastQuestions, showAiSubscription } = useMemo(
    () => computeExamPrepVisibility(hasEnrollment, hasSubscription),
    [hasEnrollment, hasSubscription]
  );

  const value = useMemo(
    () => ({
      loading,
      hasEnrollment,
      hasSubscription,
      showPastQuestions,
      showAiSubscription,
      refresh,
    }),
    [
      loading,
      hasEnrollment,
      hasSubscription,
      showPastQuestions,
      showAiSubscription,
      refresh,
    ]
  );

  return (
    <ExamPrepAccessContext.Provider value={value}>
      {children}
    </ExamPrepAccessContext.Provider>
  );
}

export function useExamPrepAccess() {
  const ctx = useContext(ExamPrepAccessContext);
  if (!ctx) {
    throw new Error("useExamPrepAccess must be used within ExamPrepAccessProvider");
  }
  return ctx;
}
