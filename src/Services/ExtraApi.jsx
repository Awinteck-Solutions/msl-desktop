import axios from "axios";
import apiEndpoints from "./apiConfig";



//  FEEDBACK LIST
export const feedbackList = async () => {
    try {
      const response = await axios.get(
        apiEndpoints.feedbackList
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
   
//  SEND FEEDBACK
export const sendFeedback = async (data) => {
    try {
      const response = await axios.post(
        apiEndpoints.sendFeedback,
        data
      );
      if (response.status == 201) {
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
   
//  SEND REQUEST
export const sendRequest = async (data) => {
    try {
      const response = await axios.post(
        apiEndpoints.update,
        data
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

//  FEEDBACK LIST
export const updateAvailableCall = async () => {
  try {
    const response = await axios.get(
      apiEndpoints.updateAvailable
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