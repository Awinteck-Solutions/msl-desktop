import { apiClient, publicClient } from "./apiClient";
import apiEndpoints from "./apiConfig";
import { getStoredUser } from "./session";

export const sendFeedback = async ({ type, phone, message }) => {
  const user = getStoredUser();
  const response = await apiClient.post(apiEndpoints.sendFeedback, {
    type,
    phone,
    message,
    user_id: user?._id,
  });
  if (response.status === 200 || response.status === 201) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const sendRequest = async (data) => {
  const response = await apiClient.post(apiEndpoints.sendRequest, data);
  if (response.status === 200 || response.status === 201) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const updateAvailableCall = async (osVersion = "windows") => {
  const response = await publicClient.get(apiEndpoints.updateAvailable, {
    params: { osVersion },
  });
  if (response.status === 200) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};
