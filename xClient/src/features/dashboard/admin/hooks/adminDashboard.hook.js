import { useQuery } from "@tanstack/react-query";
import { adminDashboard } from "../api/adminDashboard.api.js";
import useAuthStore from "../../../auth/store/auth.store.js";

export const useGetAdminDashboard = ()=>{
    const accessToken = useAuthStore((state) => state.accessToken);

    return useQuery({
        queryKey:['adminDashboard'],
        queryFn : adminDashboard,
        enabled: !!accessToken,
    })
}
