import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDashboard } from "../api/adminDashboard.api.js";
import {toast} from 'react-toastify';

export const useGetAdminDashboard = ()=>{
    return useQuery({
        queryKey:['adminDashboard'],
        queryFn : adminDashboard,
    })
}