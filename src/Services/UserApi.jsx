import { apiClient, publicClient, getAuthHeaders } from "./apiClient";
import apiEndpoints from "./apiConfig";
import { getStoredUser, setStoredUser } from "./session";

export const generateQRCode = async (data) => {
  const response = await publicClient.post(apiEndpoints.generateQRCode, data);
  if (response.status === 201) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const windowsLogin = async (id) => {
  const response = await publicClient.get(
    `${apiEndpoints.windowLogin}/${id}`,
    { validateStatus: (status) => status < 500 }
  );
  if (response.status === 200 && response.data?.status) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const verify = async () => {
  const response = await apiClient.post(apiEndpoints.verify, {});
  if (response.status === 200) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const refreshToken = async () => {
  const response = await apiClient.post(apiEndpoints.refreshToken, {});
  if (response.status === 200) {
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const getProfile = async () => {
  const response = await apiClient.get(apiEndpoints.profile);
  if (response.status === 200 || response.status === 201) {
    return { status: true, response: response.data?.response };
  }
  return { status: false, response: null };
};

export const updateProfile = async ({ firstname, lastname }) => {
  const response = await apiClient.patch(apiEndpoints.profile, {
    firstname,
    lastname,
  });
  if (response.status === 200 || response.status === 201) {
    const user = getStoredUser();
    if (user) {
      setStoredUser({ ...user, firstname, lastname });
    }
    return { status: true, response: response.data };
  }
  return { status: false, response: response.data };
};

export const updateNotificationSettings = async (settings) => {
  const response = await apiClient.patch(
    apiEndpoints.notificationSettings,
    settings
  );
  if (response.status === 200) {
    return { status: true, response: response.data?.response };
  }
  return { status: false, response: response.data };
};

export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append("upload", file);
  const response = await apiClient.patch(apiEndpoints.uploadImage, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  if (response.status === 200 || response.status === 201) {
    const imageKey = response.data?.response;
    const user = getStoredUser();
    if (user && imageKey) {
      setStoredUser({ ...user, image: imageKey });
    }
    return { status: true, response: imageKey };
  }
  return { status: false, response: response.data };
};
