import api from "../../../../lib/axios.js";

export const mentorDashboard = async () => {
  try {
    const apiResponse = await api.get("/dashboard/mentor");
    return apiResponse.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
