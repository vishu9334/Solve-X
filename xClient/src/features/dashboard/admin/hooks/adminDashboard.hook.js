import { useQuery } from "@tanstack/react-query";
import { adminDashboard } from "../api/adminDashboard.api.js";

export const useGetAdminDashboard = ()=>{
    return useQuery({
        queryKey:['adminDashboard'],
        queryFn : adminDashboard,
    })
}