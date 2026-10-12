import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getStoredUser } from "../../Services/session";
import { useExamPrepAccess } from "../../Context/ExamPrepAccessContext";
import MslAiMenu from "./MslAiMenu";
import SubscriptionAiChatPanel from "./panels/SubscriptionAiChatPanel";
import AiGenerateFlashcardsPanel from "./panels/AiGenerateFlashcardsPanel";
import AiGenerateQuizPanel from "./panels/AiGenerateQuizPanel";
import AiSummarizePanel from "./panels/AiSummarizePanel";
import AiRecentActivityPanel from "./panels/AiRecentActivityPanel";

const SUBSCRIPTION_VARIANT = "subscription";

export default function MslAiFab() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const { showAiSubscription } = useExamPrepAccess();

  const user = getStoredUser();
  const isLogin = location.pathname === "/login" || location.hash?.includes("/login");

  if (!user?.token || isLogin) return null;

  if (location.pathname.startsWith("/past-questions")) {
    return null;
  }

  if (!showAiSubscription) {
    return null;
  }

  const openPanel = (id) => {
    setMenuOpen(false);
    setActivePanel(id);
  };

  const closeAll = () => {
    setActivePanel(null);
    setMenuOpen(false);
  };

  const backToMenu = () => {
    setActivePanel(null);
    setMenuOpen(true);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[1000] animate-msl-fab-bounce">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="h-12 px-5 rounded-full bg-gradient-cta text-white text-sm shadow-glow-indigo hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 border border-white/15"
          aria-label="Open MSL AI"
        >
          <Sparkles className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span className="tracking-tight whitespace-nowrap">
            <span className="font-bold">MSL</span> AI
          </span>
        </button>
      </div>

      <MslAiMenu
        isOpen={menuOpen && !activePanel}
        onClose={() => setMenuOpen(false)}
        onSelect={openPanel}
        variant={SUBSCRIPTION_VARIANT}
      />

      <SubscriptionAiChatPanel isOpen={activePanel === "chat"} onClose={closeAll} />
      <AiGenerateFlashcardsPanel
        isOpen={activePanel === "flashcards"}
        onClose={closeAll}
        onBack={backToMenu}
        variant={SUBSCRIPTION_VARIANT}
      />
      <AiGenerateQuizPanel
        isOpen={activePanel === "quiz"}
        onClose={closeAll}
        onBack={backToMenu}
        variant={SUBSCRIPTION_VARIANT}
      />
      <AiSummarizePanel
        isOpen={activePanel === "summarize"}
        onClose={closeAll}
        onBack={backToMenu}
        variant={SUBSCRIPTION_VARIANT}
      />
      <AiRecentActivityPanel
        isOpen={activePanel === "activity"}
        onClose={closeAll}
        onBack={backToMenu}
        variant={SUBSCRIPTION_VARIANT}
      />
    </>
  );
}
