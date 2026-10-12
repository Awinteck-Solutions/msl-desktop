import { Navigate } from "react-router-dom";
import { Spinner } from "@chakra-ui/react";
import { useExamPrepAccess } from "../../Context/ExamPrepAccessContext";

export function PastQuestionsRouteGuard({ children }) {
  const { loading, showPastQuestions } = useExamPrepAccess();
  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="xl" color="brand.500" />
      </div>
    );
  }
  if (!showPastQuestions) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function SubscriptionRouteGuard({ children }) {
  const { loading, showAiSubscription } = useExamPrepAccess();
  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="xl" color="brand.500" />
      </div>
    );
  }
  if (!showAiSubscription) {
    return <Navigate to="/" replace />;
  }
  return children;
}
