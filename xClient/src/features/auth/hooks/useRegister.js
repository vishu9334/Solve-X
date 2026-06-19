import { useMutation } from "@tanstack/react-query";
import { registerApi } from "../api/auth.api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const useRegister = () => {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: registerApi,
        onSuccess: (data) => {
            toast.success("OTP sent to your email!")
            navigate(`/verify?email=${data.email}`)
        },
        onError: (error) => {
            toast.error(error.message || "Registration failed. Please try again.");
        }
    });
};
