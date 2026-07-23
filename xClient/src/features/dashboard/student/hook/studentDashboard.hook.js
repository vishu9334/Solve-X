import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios.js";
import useAuthStore from "../../../auth/store/auth.store.js";

export const studentDashboard = async () => {
  try {
    const apiResponse = await api.get("/dashboard/student");
    return apiResponse.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const useGetStudentDashboard = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["studentDashboard"],
    queryFn: studentDashboard,
    enabled: !!accessToken,
  });
};
