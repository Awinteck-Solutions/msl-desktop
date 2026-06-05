import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Play,
  RotateCcw,
} from "lucide-react";
import StatusBadge from "../UI/StatusBadge";
import IconBox from "../UI/IconBox";
import IndigoProgress from "../UI/IndigoProgress";
import { mediaUrl } from "../../Services/apiConfig";

function deckStatus(deck) {
  if (deck.progress >= 100 || deck.completionCount > 0) return "completed";
  if (deck.progress > 0) return "in_progress";
  return "not_started";
}

const STATUS_MAP = {
  not_started: { label: "Not started", status: "pending", icon: Layers, variant: "sky" },
  in_progress: { label: "In progress", status: "pending", icon: Clock, variant: "amber" },
  completed: { label: "Completed", status: "completed", icon: CheckCircle2, variant: "emerald" },
};

export default function PracticeFlashcardListCard({ deck, courseId }) {
  const status = deckStatus(deck);
  const meta = STATUS_MAP[status];
  const Icon = meta.icon;
  const cardCount = (deck.flashcardItems ?? []).length;

  return (
    <Link
      to={`/practice/flashcards/${deck._id}`}
      state={{ courseId }}
      className="group flex gap-4 glass-card rounded-msl p-4 hover:border-brand/30 hover:shadow-glow-indigo-soft transition-all"
    >
      <div className="w-24 h-24 shrink-0 rounded-msl overflow-hidden bg-brand/10 border border-msl-border">
        {deck.thumbnail ? (
          <img
            src={mediaUrl(deck.thumbnail)}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-cta opacity-80">
            <Layers className="w-8 h-8 text-white/90" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-sm text-msl-text line-clamp-2 group-hover:text-brand transition-colors">
            {deck.title}
          </h3>
          <IconBox variant={meta.variant} className="!w-9 !h-9 shrink-0">
            <Icon className="w-4 h-4" strokeWidth={1.75} />
          </IconBox>
        </div>

        {deck.description ? (
          <p className="text-xs text-msl-muted line-clamp-2 mt-1">{deck.description}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <StatusBadge status={meta.status}>{meta.label}</StatusBadge>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-msl-muted font-semibold">
            <RotateCcw className="w-3 h-3" strokeWidth={2} />
            {cardCount} cards
          </span>
        </div>

        {deck.progress > 0 && deck.progress < 100 ? (
          <div className="mt-auto pt-3 space-y-1">
            <div className="flex justify-between text-[10px] text-msl-muted font-mono">
              <span>Progress</span>
              <span className="text-brand">{deck.progress}%</span>
            </div>
            <IndigoProgress value={deck.progress} />
          </div>
        ) : (
          <p className="mt-auto pt-3 text-xs font-semibold text-brand inline-flex items-center gap-1">
            <Play className="w-3.5 h-3.5" strokeWidth={2.5} />
            {status === "in_progress" ? "Continue deck" : "Start review"}
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </p>
        )}
      </div>
    </Link>
  );
}
