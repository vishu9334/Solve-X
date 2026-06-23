import api from "../../../../lib/axios.js";

export const mentorProfileUpdate = async (data) => {
  try {
    const apiResponse = await api.patch("/mentor/profile", data);
    return apiResponse.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const mentorProfileGet = async () => {
  try {
    const apiResponse = await api.get("/mentor/profile");
    return apiResponse.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
