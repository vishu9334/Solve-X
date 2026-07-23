import { useQuery } from "@tanstack/react-query";
import { mentorDashboard } from "../api/mentorDashboard.api.js";
import useAuthStore from "../../../auth/store/auth.store.js";

export const useGetMentorDashboard = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["mentorDashboard"],
    queryFn: mentorDashboard,
    enabled: !!accessToken,
  });
};
