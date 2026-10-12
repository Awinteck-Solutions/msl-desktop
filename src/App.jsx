import { useState } from "react";
import { Routes, Route, HashRouter as Router, Navigate } from "react-router-dom";

import Login from './Pages/Login'
import Dashboard from "./Pages/Dashboard";
import Course from './Pages/Course'
import MyCourses from './Pages/MyCourses'
import PreviewCourse from "./Pages/PreviewCourse";
import PreviewPdf from "./Pages/PreviewPdf";
import Feedback from "./Pages/Feedback";
import Profile from "./Pages/Profile";
import PracticeQuiz from "./Pages/PracticeQuiz";
import PracticeFlashcards from "./Pages/PracticeFlashcards";
import Subscription from "./Pages/Subscription";
import PreviewSubscriptionResource from "./Pages/PreviewSubscriptionResource";
import PastQuestions from "./Pages/PastQuestions";
import { MslAiProvider } from "./Context/MslAiContext";
import { ExamPrepAccessProvider } from "./Context/ExamPrepAccessContext";
import { SidebarProvider } from "./Context/SidebarContext";
import MslAiFab from "./Components/MslAi/MslAiFab";
import {
  PastQuestionsRouteGuard,
  SubscriptionRouteGuard,
} from "./Components/Layout/ExamPrepRouteGuard";




function App() {
  return (
    <Router>
      <SidebarProvider>
      <ExamPrepAccessProvider>
      <MslAiProvider>
      <Routes>  
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/course" element={<Course />} />
        <Route path="/personal/course" element={<MyCourses />} />
        <Route path="*" element={<Dashboard />} />
        <Route path="/course/preview/:id" element={<PreviewCourse />} />
        <Route path="/preview/pdf/:id" element={<PreviewPdf />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/subscription"
          element={
            <SubscriptionRouteGuard>
              <Subscription />
            </SubscriptionRouteGuard>
          }
        />
        <Route
          path="/subscription/resource/:id"
          element={
            <SubscriptionRouteGuard>
              <PreviewSubscriptionResource />
            </SubscriptionRouteGuard>
          }
        />
        <Route
          path="/past-questions"
          element={
            <PastQuestionsRouteGuard>
              <PastQuestions />
            </PastQuestionsRouteGuard>
          }
        />
        <Route
          path="/past-questions/paper/:paperId"
          element={
            <PastQuestionsRouteGuard>
              <PastQuestions />
            </PastQuestionsRouteGuard>
          }
        />
        <Route path="/practice/quiz" element={<PracticeQuiz />} />
        <Route path="/practice/quiz/course/:courseId" element={<PracticeQuiz />} />
        <Route path="/practice/quiz/:quizId" element={<PracticeQuiz />} />
        <Route path="/practice/flashcards" element={<PracticeFlashcards />} />
        <Route path="/practice/flashcards/course/:courseId" element={<PracticeFlashcards />} />
        <Route path="/practice/flashcards/:flashcardId" element={<PracticeFlashcards />} />
        <Route path="/gamification" element={<Navigate to="/" replace />} />

      </Routes>
      <MslAiFab />
      </MslAiProvider>
      </ExamPrepAccessProvider>
      </SidebarProvider>
    </Router>
  );
}

export default App;
