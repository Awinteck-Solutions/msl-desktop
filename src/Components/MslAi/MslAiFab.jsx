import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getStoredUser } from "../../Services/session";
import { useExamPrepAccess } from "../../Context/ExamPrepAccessContext";
import MslAiMenu from "./MslAiMenu";
import AiChatPanel from "./panels/AiChatPanel";
import SubscriptionAiChatPanel from "./panels/SubscriptionAiChatPanel";
import AiGenerateFlashcardsPanel from "./panels/AiGenerateFlashcardsPanel";
import AiGenerateQuizPanel from "./panels/AiGenerateQuizPanel";
import AiSummarizePanel from "./panels/AiSummarizePanel";
import AiRecentActivityPanel from "./panels/AiRecentActivityPanel";

function resolveFabVariant({ hasEnrollment, showAiSubscription, pathname }) {
  const onSubscriptionRoute = pathname.startsWith("/subscription");

  if (!hasEnrollment) {
    return showAiSubscription ? "subscription" : null;
  }

  if (onSubscriptionRoute && showAiSubscription) {
    return "subscription";
  }

  return "course";
}

export default function MslAiFab() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const { hasEnrollment, showAiSubscription } = useExamPrepAccess();

  const user = getStoredUser();
  const isLogin = location.pathname === "/login" || location.hash?.includes("/login");

  const fabVariant = useMemo(
    () =>
      resolveFabVariant({
        hasEnrollment,
        showAiSubscription,
        pathname: location.pathname,
      }),
    [hasEnrollment, showAiSubscription, location.pathname]
  );

  useEffect(() => {
    setMenuOpen(false);
    setActivePanel(null);
  }, [fabVariant, location.pathname]);

  if (!user?.token || isLogin) return null;

  if (location.pathname.startsWith("/past-questions")) {
    return null;
  }

  if (!fabVariant) {
    return null;
  }

  const isSubscription = fabVariant === "subscription";

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
        variant={fabVariant}
      />

      {isSubscription ? (
        <SubscriptionAiChatPanel isOpen={activePanel === "chat"} onClose={closeAll} />
      ) : (
        <AiChatPanel isOpen={activePanel === "chat"} onClose={closeAll} />
      )}

      <AiGenerateFlashcardsPanel
        isOpen={activePanel === "flashcards"}
        onClose={closeAll}
        onBack={backToMenu}
        variant={fabVariant}
      />
      <AiGenerateQuizPanel
        isOpen={activePanel === "quiz"}
        onClose={closeAll}
        onBack={backToMenu}
        variant={fabVariant}
      />
      <AiSummarizePanel
        isOpen={activePanel === "summarize"}
        onClose={closeAll}
        onBack={backToMenu}
        variant={fabVariant}
      />
      <AiRecentActivityPanel
        isOpen={activePanel === "activity"}
        onClose={closeAll}
        onBack={backToMenu}
        variant={fabVariant}
      />
    </>
  );
}
