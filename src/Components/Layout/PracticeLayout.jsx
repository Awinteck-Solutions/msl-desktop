import SideBar from "../General/SideBar";

export default function PracticeLayout({ practiceQuiz, practiceFlashcards, children }) {
  return (
    <div className="flex h-screen bg-msl-bg overflow-hidden">
      <SideBar practiceQuiz={practiceQuiz} practiceFlashcards={practiceFlashcards} />
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</div>
    </div>
  );
}
