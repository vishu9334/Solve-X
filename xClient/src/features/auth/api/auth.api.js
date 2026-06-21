import api from "../../../lib/axios";

const getAccessTokenFromHeader = (headers) => {
  const authHeader = headers?.["authorization"];

  return authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
};

const getMessage = (responseData) => {
  return responseData?.message?.message || responseData?.message;
};

export const loginApi = async (data) => {
  try {
    const apiResponse = await api.post("/login", data);

    const accessToken =
      getAccessTokenFromHeader(apiResponse.headers) ||
      apiResponse.data?.data?.accessToken;

    return {
      ...apiResponse.data?.data,
      accessToken,
      message: getMessage(apiResponse.data),
    };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const registerApi = async (data) => {
  try {
    const apiResponse = await api.post("/register", data);
    console.log(data)

    return {
      ...apiResponse.data?.data,
      message: getMessage(apiResponse.data),
    };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const otpVerification = async (data) => {
  try {
    const apiResponse = await api.post("/verify-otp", data);

    const accessToken =
      getAccessTokenFromHeader(apiResponse.headers) ||
      apiResponse.data?.data?.accessToken;

    return {
      ...apiResponse.data?.data,
      accessToken,
      message: getMessage(apiResponse.data),
    };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const resendOtpApi = async (data) => {
  try {
    const apiResponse = await api.post("/resend-otp", data);

    return {
      ...apiResponse.data?.data,
      message: getMessage(apiResponse.data),
    };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logoutApi = async () => {
  try {
    const apiResponse = await api.post("/logout");

    return {
      ...apiResponse.data?.data,
      message: getMessage(apiResponse.data),
    };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCurrentUserApi = async () => {
  try {
    const apiResponse = await api.get("/me");

    return apiResponse.data?.data?.userObj || apiResponse.data?.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
 