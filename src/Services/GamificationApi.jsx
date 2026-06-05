import { apiClient } from "./apiClient";
import apiEndpoints from "./apiConfig";

export const getMyGamification = async () => {
  const response = await apiClient.get(apiEndpoints.gamificationMe);
  if (response.status === 200 && response.data.success) {
    return { status: true, response: response.data.response };
  }
  return { status: false, response: null };
};

export const getLeaderboard = async (type = "xp", limit = 10) => {
  const response = await apiClient.get(apiEndpoints.gamificationLeaderboard, {
    params: { type, limit },
  });
  if (response.status === 200 && response.data.success) {
    return { status: true, response: response.data.response };
  }
  return { status: false, response: null };
};
