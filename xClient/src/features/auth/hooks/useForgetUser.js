import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { forgetPasswordApi, resetPasswordApi } from "../api/auth.api";

export const useForget = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: forgetPasswordApi,

    onSuccess: (data, email) => {
      toast.success(data?.message || "Password reset OTP sent to your email!");
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    },

    onError: (error) => {
      console.error(error);
      toast.error(error?.message || "Failed to send reset link. Please try again.");
    },
  });
};

export const useReset = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: resetPasswordApi,

    onSuccess: (data) => {
      toast.success(data?.message || "Password updated successfully!");
      navigate("/login");
    },

    onError: (error) => {
      console.error(error);
      toast.error(error?.message || "Failed to reset password. Please try again.");
    },
  });
};