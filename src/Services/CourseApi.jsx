import axios from "axios";
import apiEndpoints from "./apiConfig";



//  GET CATEGORY LIST
export const categoryList = async () => {
  try {
    const response = await axios.get(
      apiEndpoints.categoryList,
    ); 
    if (response.status == 200) {
      return {
        response:response.data.response,
      };
    } else if (response.status == 404) {
      return {
        message: response.message,
      };
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};


//  GET COURSE LIST
export const courseList = async () => {
  try { 
    const response = await axios.get(
      apiEndpoints.courseList,
    ); 
    if (response.status == 200) {
      return {
        response:response.data.response,
      };
    } else if (response.status == 404) {
      return {
        message: response.message,
      };
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

//  GET USER COURSE LIST
export const userCourseList = async (email) => {
    try { 
      const response = await axios.get(
        apiEndpoints.userCourses + `/${email}`,
      ); 
      console.log(`${apiEndpoints.userCourses + `/${email}`}`)
      console.log('response :>> ', response);
      if (response.status == 200) {
        return {
          response:response.data.result,
        };
      } else if (response.status == 404) {
        return {
          message: response.data.message,
        };
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
};
  
//  GET SINGLE COURSE
export const singleCourse = async (id) => {
  console.log('API ROUTE',apiEndpoints.singleCourse + `/${id}`)
    try { 
      const response = await axios.get(
        apiEndpoints.singleCourse + `/${id}`,
      ); 
      if (response.status == 200) {
        return {
          status: true,
          response: response.data,
        };
      } else if (response.status == 404) {
        return {
          status: false,
          message: response.data.msg,
        };
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
};

 //  GET LESSONS
export const getLessons = async ({ id }) => {
    try { 
      const response = await axios.get(
        apiEndpoints.lesson+`/${id}`,
      ); 
      if (response.status == 200) {
        return {
          status: true,
          response: response.data,
        };
      } else if (response.status == 404) {
        return {
          status: true,
          message: response.data.msg,
        };
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  };


