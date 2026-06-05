import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "msl-nav-collapsed";
const COLLAPSE_BREAKPOINT = 1024;

function readUserCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function isNarrowViewport() {
  return typeof window !== "undefined" && window.innerWidth < COLLAPSE_BREAKPOINT;
}

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [userCollapsed, setUserCollapsed] = useState(readUserCollapsed);
  const [viewportNarrow, setViewportNarrow] = useState(isNarrowViewport);

  useEffect(() => {
    const onResize = () => setViewportNarrow(isNarrowViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (viewportNarrow) return;
    try {
      localStorage.setItem(STORAGE_KEY, userCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [userCollapsed, viewportNarrow]);

  const collapsed = viewportNarrow || userCollapsed;

  const setCollapsed = useCallback((value) => {
    if (viewportNarrow) return;
    setUserCollapsed(Boolean(value));
  }, [viewportNarrow]);

  const toggleCollapsed = useCallback(() => {
    if (viewportNarrow) return;
    setUserCollapsed((v) => !v);
  }, [viewportNarrow]);

  const value = useMemo(
    () => ({ collapsed, viewportNarrow, setCollapsed, toggleCollapsed }),
    [collapsed, viewportNarrow, setCollapsed, toggleCollapsed]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    return {
      collapsed: false,
      setCollapsed: () => {},
      toggleCollapsed: () => {},
    };
  }
  return ctx;
}
