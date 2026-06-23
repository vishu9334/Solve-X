import { useQuery } from "@tanstack/react-query";
import { mentorDashboard } from "../api/mentorDashboard.api.js";

export const useGetMentorDashboard = () => {
  return useQuery({
    queryKey: ["mentorDashboard"],
    queryFn: mentorDashboard,
  });
};
