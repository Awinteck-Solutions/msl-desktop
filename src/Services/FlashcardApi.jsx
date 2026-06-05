import { apiClient } from "./apiClient";
import apiEndpoints from "./apiConfig";
import { getStoredUser } from "./session";

export const coursesWithFlashcards = async (page = 1, limit = 10000) => {
  const response = await apiClient.get(apiEndpoints.flashcardUserCourses, {
    params: { page, limit },
  });
  if (response.status === 200 && response.data.status !== false) {
    return { status: true, response: response.data.result ?? [] };
  }
  return { status: false, response: [] };
};

export const flashcardByCourse = async (courseId, page = 1, limit = 100) => {
  const response = await apiClient.get(
    `${apiEndpoints.flashcardByCourse}/${courseId}/student`,
    { params: { page, limit } }
  );
  if (response.status === 200 && response.data.success !== false) {
    return { status: true, response: response.data.flashcards ?? [] };
  }
  return { status: false, response: [] };
};

export const flashcardSingle = async (flashcardId) => {
  const response = await apiClient.get(
    `${apiEndpoints.flashcardSingle}/${flashcardId}`
  );
  if (response.status === 200) {
    return { status: true, response: response.data.response };
  }
  return { status: false, response: null };
};

export const flashcardLeaderboard = async (flashcardId) => {
  const response = await apiClient.get(
    `${apiEndpoints.flashcardSingle}/${flashcardId}/leaderboard`
  );
  if (response.status === 200 && response.data.success !== false) {
    return { status: true, response: response.data.leaderboard ?? [] };
  }
  return { status: false, response: [] };
};

export const flashcardComplete = async (flashcardId) => {
  const studentId = getStoredUser()?._id;
  const response = await apiClient.post(
    `${apiEndpoints.flashcardSingle}/${flashcardId}/complete`,
    { studentId }
  );
  return { status: response.status === 200, response: response.data };
};

export const flashcardProgress = async (flashcardId, progress) => {
  const studentId = getStoredUser()?._id;
  const response = await apiClient.post(
    `${apiEndpoints.flashcardSingle}/${flashcardId}/progress`,
    { studentId, progress }
  );
  return { status: response.status === 200, response: response.data };
};
