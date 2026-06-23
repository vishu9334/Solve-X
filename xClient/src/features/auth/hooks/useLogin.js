import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { loginApi } from "../api/auth.api";
import useAuthStore from "../store/auth.store.js";

export const useLogin = () => {
  const navigate = useNavigate();

  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: loginApi,

    onSuccess: (data) => {
      const { accessToken, userObj } = data;

      if (!accessToken) {
        toast.error("Access token not received");
        return;
      }

      if (!userObj) {
        toast.error("User data not received");
        return;
      }

      setAccessToken(accessToken);
      setUser(userObj);

      toast.success(data?.message || "Login successful!");

      const roleRoutes = {
        admin: "/admin-landing",
        mentor: "/mentor-landing",
        student: "/student-landing",
      };

      navigate(roleRoutes[userObj.role] || "/");
    },

    onError: (error) => {
      console.error(error);
      toast.error(error?.message || "Invalid credentials. Please try again.");
    },
  });
};