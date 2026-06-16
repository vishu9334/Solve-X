import { useMutation } from "@tanstack/react-query";
import { loginApi } from "../api/auth.api";
import useAuthStore from '../store/auth.store.js'
import { useNavigate } from "react-router-dom";
export const useLogin = () => {
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const setUser = useAuthStore((state) => state.setUser)
    const navigate = useNavigate()
    return useMutation({
        mutationFn: loginApi,
        onSuccess: (data) => {
            const { accessToken, userObj } = data
            setAccessToken(accessToken)
            setUser(userObj)
            if (userObj.role === 'admin') navigate("/dashboard/admin")
            if (userObj.role === 'mentor') navigate("/dashboard/mentor")
            if (userObj.role === 'student') navigate("/dashboard/student")
        },
        onError:(error)=>{
            console.log(error);
        }
    })
}