import { apiClient } from "./apiClient";
import apiEndpoints from "./apiConfig";
import { capitalizeDifficulty } from "../utils/quizHelpers";

export const coursesWithQuizzes = async (page = 1, limit = 10000) => {
  const response = await apiClient.get(apiEndpoints.userCoursesWithQuizzes, {
    params: { page, limit },
  });
  if (response.status === 200) {
    return { status: true, response: response.data.result ?? [] };
  }
  return { status: false, response: [] };
};

export const quizByCourse = async (courseId, page = 1, limit = 100) => {
  const response = await apiClient.get(
    `${apiEndpoints.quizByCourse}/${courseId}/student`,
    { params: { page, limit } }
  );
  if (response.status === 200) {
    return { status: true, response: response.data.response ?? [] };
  }
  return { status: false, response: [] };
};

export const quizSingle = async (quizId) => {
  const response = await apiClient.get(`${apiEndpoints.quizSingle}/${quizId}`);
  if (response.status === 200) {
    return { status: true, response: response.data.response };
  }
  return { status: false, response: null };
};

export const quizResponseByQuizId = async (quizId) => {
  const response = await apiClient.get(
    `${apiEndpoints.quizResponseByQuizId}/${quizId}`
  );
  if (response.status === 200 || response.status === 201) {
    return { status: true, response: response.data.response ?? null };
  }
  return { status: false, response: null };
};

export const submitQuizResponse = async (payload) => {
  const response = await apiClient.post(
    apiEndpoints.quizResponseAdd,
    payload
  );
  if (response.status === 200 || response.status === 201) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const updateQuizResponse = async (payload) => {
  const response = await apiClient.patch(
    apiEndpoints.quizResponseUpdate,
    payload
  );
  if (response.status === 200 || response.status === 201) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export function buildQuizResponsePayload(quiz, answers, studentId) {
  const questions = quiz?.quiz ?? [];
  const correct = answers.filter(
    (a) => a.student_response === a.answer
  ).length;
  const wrong = answers.length - correct;

  return {
    student: studentId,
    quiz_id: quiz._id,
    quiz: answers.map((a) => ({
      question_id: a._id ?? a.question_id,
      title: a.title,
      type: a.type,
      difficulty: capitalizeDifficulty(a.difficulty),
      objectives: a.objectives,
      answer: a.answer,
      student_response: a.student_response,
      answer_notes: a.answer_notes,
    })),
    total_questions: String(questions.length),
    total_response: String(answers.length),
    total_corrects: String(correct),
    total_wrongs: String(wrong),
    total_points: String(
      questions.length ? Math.round((correct / questions.length) * 100) : 0
    ),
  };
}

export const saveQuizProgress = async (quiz, answers, studentId, responseId) => {
  const payload = buildQuizResponsePayload(quiz, answers, studentId);
  if (responseId) {
    return updateQuizResponse({ id: responseId, ...payload });
  }
  return submitQuizResponse(payload);
};
