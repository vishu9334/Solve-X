import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios.js";

export const studentDashboard = async () => {
  try {
    const apiResponse = await api.get("/dashboard/student");
    return apiResponse.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const useGetStudentDashboard = () => {
  return useQuery({
    queryKey: ["studentDashboard"],
    queryFn: studentDashboard,
  });
};
