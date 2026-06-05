import { useTheme } from "../../Context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-xl border border-msl-border bg-msl-surface px-3 py-2 text-sm text-msl-muted hover:text-msl-text hover:border-msl-primary/40 transition-colors ${className}`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8 2.36 10.14 10.14 0 1 0 22 14.05 1 1 0 0 0 21.64 13Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M12 18a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1Zm0-14a1 1 0 0 1-1-1V1a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1Zm8 7a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2h-2a1 1 0 0 1-1-1ZM1 12a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2H2a1 1 0 0 1-1-1Zm17.66 6.66a1 1 0 0 1 1.41 0l1.42 1.41a1 1 0 1 1-1.41 1.41l-1.42-1.41a1 1 0 0 1 0-1.41ZM3.51 4.93a1 1 0 0 1 1.41 0l1.41 1.41A1 1 0 1 1 5 7.76L3.51 6.34a1 1 0 0 1 0-1.41Zm14.14 0a1 1 0 0 1 0 1.41l-1.41 1.41a1 1 0 1 1-1.41-1.41l1.41-1.41a1 1 0 0 1 1.41 0ZM6.34 17.66a1 1 0 0 1 0 1.41l-1.41 1.42a1 1 0 1 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.41 0ZM12 6.5a5.5 5.5 0 1 0 5.5 5.5A5.51 5.51 0 0 0 12 6.5Z" />
        </svg>
      )}
      <span className="hidden sm:inline">{theme === "light" ? "Dark" : "Light"}</span>
    </button>
  );
}
