import {
  Award,
  BookOpen,
  Flame,
  Layers,
  Medal,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

const BADGE_META = {
  first_question: { label: "First question", icon: Sparkles, color: "text-brand" },
  streak_7: { label: "7-day streak", icon: Flame, color: "text-amber-500" },
  streak_30: { label: "30-day streak", icon: Flame, color: "text-orange-500" },
  streak_100: { label: "100-day streak", icon: Flame, color: "text-red-500" },
  xp_100: { label: "100 XP", icon: Zap, color: "text-sky-500" },
  xp_500: { label: "500 XP", icon: Zap, color: "text-sky-500" },
  xp_1000: { label: "1,000 XP", icon: Zap, color: "text-indigo-400" },
  xp_2000: { label: "2,000 XP", icon: Zap, color: "text-brand" },
  quiz_beginner: { label: "Quiz beginner", icon: Target, color: "text-emerald-500" },
  quiz_master: { label: "Quiz master", icon: Trophy, color: "text-amber-500" },
  quiz_chief: { label: "Quiz chief", icon: Medal, color: "text-brand" },
  flashcard_master: { label: "Flashcard master", icon: Layers, color: "text-violet-400" },
  five_courses_complete: { label: "5 courses complete", icon: BookOpen, color: "text-emerald-500" },
  course_master: { label: "Course master", icon: Star, color: "text-amber-400" },
  course_complete: { label: "Course complete", icon: Award, color: "text-brand" },
};

export function getBadgeMeta(badge) {
  const id = badge?.id || badge?.name || "";
  return (
    BADGE_META[id] || {
      label: badge?.name || id || "Badge",
      icon: Award,
      color: "text-brand",
    }
  );
}
