import { apiClient } from "./apiClient";
import apiEndpoints from "./apiConfig";

export const courseList = async () => {
  const response = await apiClient.get(apiEndpoints.courseList);
  if (response.status === 200) {
    return { response: response.data.response };
  }
  return null;
};

export const userCourseList = async () => {
  const response = await apiClient.get(apiEndpoints.userCourses);
  if (response.status === 200) {
    const items = response.data.result ?? [];
    const unique = Array.from(
      new Map(items.map((item) => [item._id, item])).values()
    );
    return { response: unique };
  }
  return null;
};

/** Set of enrolled course id strings for the current user. */
export async function fetchEnrolledCourseIds() {
  const result = await userCourseList();
  const courses = result?.response ?? [];
  return new Set(courses.map((c) => String(c._id)));
}

export const singleCourse = async (id) => {
  const response = await apiClient.get(`${apiEndpoints.singleCourse}/${id}`);
  if (response.status === 200) {
    return { status: true, response: response.data };
  }
  if (response.status === 404) {
    return { status: false, message: response.data?.message };
  }
  return null;
};
