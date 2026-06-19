import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { logoutApi } from "../api/auth.api.js";
import useAuthStore from "../store/auth.store.js";

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: logoutApi,

    onSuccess: () => {
      logout(); // accessToken + user clear
      queryClient.clear(); // tanstack cache clear

      toast.success("Logout successful");
      navigate("/login");
    },

    onError: (error) => {
      toast.error(error?.message || "Logout failed");
    },
  });
};