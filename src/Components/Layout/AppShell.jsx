import SideBar from "../General/SideBar";
import ThemeToggle from "./ThemeToggle";

export default function AppShell({
  active,
  children,
  title,
  subtitle,
  headerRight,
  noPadding = false,
}) {
  return (
    <div className="flex h-screen bg-msl-bg text-msl-text overflow-hidden">
      <SideBar {...active} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {(title || headerRight) && (
          <header className="flex-shrink-0 flex items-center justify-between gap-4 px-6 lg:px-8 py-5 border-b border-msl-border bg-msl-surface/80 backdrop-blur-sm">
            <div>
              {title ? (
                <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-msl-text">
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="text-sm text-msl-muted mt-0.5">{subtitle}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {headerRight}
              <ThemeToggle />
            </div>
          </header>
        )}
        <div
          className={`flex-1 overflow-y-auto ${noPadding ? "" : "px-6 lg:px-8 py-6"}`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
