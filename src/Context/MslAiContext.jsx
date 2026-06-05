import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useParams } from "react-router-dom";
import { normalizeS3Key } from "../utils/s3Key";

const MslAiContext = createContext(null);

const EMPTY_SCOPE = {
  courseId: null,
  lessonId: null,
  s3Keys: [],
  label: null,
  source: null,
  resourceType: null,
};

export function MslAiProvider({ children }) {
  const location = useLocation();
  const params = useParams();
  const [manualScope, setManualScope] = useState(null);

  const routeScope = useMemo(() => {
    const path = location.pathname || "";
    const state = location.state || {};

    if (path.startsWith("/course/preview/") && params.id) {
      return {
        ...EMPTY_SCOPE,
        courseId: String(params.id),
        label: "Current course",
        source: "route",
      };
    }

    if (path.startsWith("/preview/pdf/") && params.id) {
      const pdfKey = state.data ? normalizeS3Key(state.data) : null;
      return {
        ...EMPTY_SCOPE,
        courseId: String(params.id),
        s3Keys: pdfKey ? [pdfKey] : [],
        label: pdfKey ? "Current PDF" : "Current course",
        source: "route",
      };
    }

    if (path.startsWith("/practice/quiz/course/") && params.courseId) {
      return {
        ...EMPTY_SCOPE,
        courseId: String(params.courseId),
        label: "Quiz course",
        source: "route",
      };
    }

    if (path.startsWith("/practice/flashcards/course/") && params.courseId) {
      return {
        ...EMPTY_SCOPE,
        courseId: String(params.courseId),
        label: "Flashcard course",
        source: "route",
      };
    }

    return { ...EMPTY_SCOPE, source: "none" };
  }, [location.pathname, location.state, params]);

  useEffect(() => {
    setManualScope((prev) => {
      if (!prev) return null;
      if (prev.source === "picker") {
        return routeScope.source === "none" ? null : prev;
      }
      if (prev.source === "page") {
        if (routeScope.source === "none") return null;
        if (
          routeScope.courseId &&
          prev.courseId &&
          routeScope.courseId !== prev.courseId
        ) {
          return null;
        }
        return prev;
      }
      return null;
    });
  }, [routeScope.courseId, routeScope.source, routeScope.s3Keys?.join("|")]);

  const scope = useMemo(() => {
    if (manualScope) {
      return { ...EMPTY_SCOPE, ...manualScope };
    }
    return routeScope;
  }, [manualScope, routeScope]);

  const setAiScope = useCallback((next) => {
    setManualScope({
      ...EMPTY_SCOPE,
      ...next,
      s3Keys: next.s3Keys ?? [],
      source: next.source || "page",
      resourceType: next.resourceType ?? null,
    });
  }, []);

  const clearAiScope = useCallback(() => {
    setManualScope(null);
  }, []);

  const value = useMemo(
    () => ({ scope, setAiScope, clearAiScope, routeScope }),
    [scope, setAiScope, clearAiScope, routeScope]
  );

  return (
    <MslAiContext.Provider value={value}>{children}</MslAiContext.Provider>
  );
}

export function useMslAi() {
  const ctx = useContext(MslAiContext);
  if (!ctx) throw new Error("useMslAi must be used within MslAiProvider");
  return ctx;
}
