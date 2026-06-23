import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { otpVerification, resendOtpApi } from "../api/auth.api";
import useAuthStore from "../store/auth.store";

export const useVerificationOtp = () => {
  const navigate = useNavigate();

  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: otpVerification,

    onSuccess: (data) => {
      const { accessToken, userObj } = data;

      setAccessToken(accessToken);
      setUser(userObj);

      toast.success("OTP verified successfully");

      switch (userObj?.role) {
        case "student":
          navigate("/student-landing");
          break;

        case "mentor":
          navigate("/mentor-landing");
          break;

        case "admin":
          navigate("/admin-landing");
          break;

        default:
          navigate("/");
          break;
      }
    },

    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "OTP verification failed. Please try again.";

      toast.error(message);
    },
  });
};

export const useResendOtp = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: resendOtpApi,

    onSuccess: (data) => {
      const msg = data?.data?.message || (typeof data?.message === 'object' ? data?.message?.message : data?.message) || "OTP resent successfully";
      toast.success(msg);
    },

    onError: (error) => {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Resending OTP failed. Please try again.";

      toast.error(message);

      // Redirect to public page when the OTP resend limit (429) is exceeded
      if (error?.status === 429 || error?.statusCode === 429 || error?.response?.status === 429) {
        navigate("/");
      }
    },
  });
};