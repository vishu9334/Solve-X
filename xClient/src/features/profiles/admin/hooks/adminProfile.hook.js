import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminProfileUpdate, adminProfileGet } from '../api/adminProfile.api.js'
import { toast } from 'react-toastify'

export const useGetAdminProfile = () => {
    return useQuery({
        queryKey: ['adminProfile'],
        queryFn: adminProfileGet,
    })
}

export const useUpdateAdminProfile = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data) => adminProfileUpdate(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['adminProfile'] })
            toast.success(data.message) 
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })
}