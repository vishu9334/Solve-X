import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mentorProfileUpdate, mentorProfileGet } from "../api/mentorProfile.api.js";
import { toast } from "react-toastify";

export const useGetMentorProfile = () => {
  return useQuery({
    queryKey: ["mentorProfile"],
    queryFn: mentorProfileGet,
  });
};

export const useUpdateMentorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => mentorProfileUpdate(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mentorProfile"] });
      queryClient.invalidateQueries({ queryKey: ["mentorDashboard"] }); // Also invalidate dashboard data
      toast.success(data.message || "Profile updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
};
