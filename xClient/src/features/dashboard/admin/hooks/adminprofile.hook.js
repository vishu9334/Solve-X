import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminProfileUpdate, adminProfileGet } from '../api/adminprofile.api'
import { useNavigate } from 'react-router-dom'

export const useGetAdminProfile = () => {
    return useQuery({
        queryKey: ['adminProfile'],
        queryFn: adminProfileGet,
    })
}

export const adminProfile = () => {
    const navigate = useNavigate()
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