import axios from "axios";
import apiEndpoints from "./apiConfig";




//  Windows login
export const generateQRCode = async (data) => {
  try {
    const response = await axios.post(
      apiEndpoints.generateQRCode,
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

//  Windows login
export const windowsLogin = async (data) => {
  try {
    const response = await axios.get(
      `${apiEndpoints.windowLogin}/${data}`
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



//  LOGIN
export const login = async (data) => {
    try {
      const response = await axios.post(
        apiEndpoints.login,
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

// GOOGLE AUTH  
export const googleAuth = async (data) => {
  try {
    const response = await axios.post(
      apiEndpoints.google_auth,
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
   

//  LOGIN
export const verify = async (data) => {
  try {
    const response = await axios.post(
      apiEndpoints.verify,
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


//  REGISTER
export const register = async (data) => {
    try {
      const response = await axios.post(
        apiEndpoints.register,
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
   
//  UPDATE PROFILE
export const updateProfile = async (data) => {
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
  
//  GET PROFILE
export const getProfile = async () => {
    try {
     
      const response = await axios.get(
        apiEndpoints.profile
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

//  RESET PASSWORD
export const resetPassword = async (data) => {
    try {
      const response = await axios.post(
        apiEndpoints.resetPassword,
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
  
//  CHANGE PASSWORD
export const changePassword = async (data) => {
    try {
      const response = await axios.post(
        apiEndpoints.changePassword,
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
  
//  UPLOAD IMAGE
export const uploadImage = async (data) => {
    try {
      const response = await axios.post(
        apiEndpoints.uploadImage,
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
  
//  FORGET PASSWORD
export const forgetPassword = async () => {
  try {
   
    const response = await axios.get(
      apiEndpoints.forgetPassword
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
